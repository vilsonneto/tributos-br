import { Decimal } from '../precision/index.js'
import type { AuditStep, DecimalInput, ResultadoSt } from './types.js'

export interface CalcStInput {
  /** Valor de referência para cálculo do ICMS próprio (normalmente vBC do item). */
  baseIcms: DecimalInput
  /** Alíquota do ICMS próprio (interestadual ou interna). Ex: 0.12. */
  aliquotaIcms: DecimalInput
  /**
   * MVA — Margem de Valor Agregado.
   * Pode ser a MVA original ou a MVA ajustada (quem chama decide qual usar).
   * Ex: 0.40 para 40%.
   */
  mva: DecimalInput
  /**
   * Alíquota do ICMS-ST (geralmente = alíquota interna do estado de destino).
   * Ex: 0.18.
   */
  aliquotaSt: DecimalInput
  /** IPI do item — compõe a base de cálculo do ICMS-ST. Default: 0. */
  valorIpi?: DecimalInput
  /**
   * Base mínima por pauta fiscal (valor unitário de pauta).
   * Quando informada, a base ST é MAX(baseStMva, pautaFiscal × quantidade).
   * Obrigatório informar `quantidade` quando usar pauta.
   */
  pautaFiscal?: DecimalInput
  /** Quantidade do item — obrigatório se pautaFiscal informado. */
  quantidade?: DecimalInput
  /** Redução da base do ICMS próprio. Ex: 0.10 = reduz 10% da base. */
  reducaoBase?: DecimalInput
  /** Redução da base do ICMS-ST. Ex: 0.10 = reduz 10% da base ST. */
  reducaoBaseSt?: DecimalInput
  /** FECOP — adiciona à alíquota ST. Ex: 0.02. */
  fecop?: DecimalInput
}

/**
 * Calcula o ICMS-ST (Substituição Tributária) por dentro da cadeia.
 *
 * O substituto tributário recolhe o ICMS que seria devido nas etapas seguintes
 * da cadeia, usando uma margem presumida (MVA) para estimar o preço de varejo.
 * O ICMS-ST é a diferença entre o imposto calculado sobre a base ST e o ICMS
 * próprio já pago pelo remetente.
 *
 * Quando há pauta fiscal, a SEFAZ estabelece um valor mínimo de base de
 * cálculo (pautaFiscal × quantidade), e usa-se o maior entre esse valor e
 * o calculado pela MVA — para evitar subfaturamento.
 *
 * @example
 * calcSt({ baseIcms: '1000', aliquotaIcms: '0.12', mva: '0.40', aliquotaSt: '0.18' })
 * // → { icmsProprio: 120, baseSt: 1400, icmsSt: 132 }
 */
export function calcSt(input: CalcStInput): ResultadoSt {
  const baseIcmsDecimal = Decimal.from(input.baseIcms)
  const aliquotaIcms = Decimal.from(input.aliquotaIcms)
  const mva = Decimal.from(input.mva)
  const aliquotaSt = Decimal.from(input.aliquotaSt)
  const valorIpi = input.valorIpi != null ? Decimal.from(input.valorIpi) : Decimal.zero()
  const fecop = input.fecop != null ? Decimal.from(input.fecop) : Decimal.zero()
  const audit: AuditStep[] = []

  // 1. Aplica redução na base do ICMS próprio, se houver
  const baseIcmsEfetiva =
    input.reducaoBase != null
      ? baseIcmsDecimal.mul(Decimal.one().sub(Decimal.from(input.reducaoBase)))
      : baseIcmsDecimal

  if (input.reducaoBase != null) {
    audit.push({
      step: 'Base ICMS (reduzida)',
      formula: `${baseIcmsDecimal.toFixed(2)} × (1 - ${Decimal.from(input.reducaoBase).toFixed(4)})`,
      value: baseIcmsEfetiva.toFixed(2),
    })
  } else {
    audit.push({
      step: 'Base ICMS',
      formula: input.baseIcms.toString(),
      value: baseIcmsEfetiva.toFixed(2),
    })
  }

  // 2. ICMS próprio
  const icmsProprio = baseIcmsEfetiva.mul(aliquotaIcms)
  audit.push({
    step: 'ICMS Próprio',
    formula: `${baseIcmsEfetiva.toFixed(2)} × ${aliquotaIcms.toFixed(4)}`,
    value: icmsProprio.toFixed(2),
  })

  // 3. Base ST pela MVA: (baseIcms + IPI) × (1 + MVA)
  // Nota: usa baseIcms original (sem redução) para compor base ST
  const baseStMva = baseIcmsDecimal.add(valorIpi).mul(Decimal.one().add(mva))

  if (valorIpi.gt(Decimal.zero())) {
    audit.push({
      step: 'Base ST (MVA + IPI)',
      formula: `(${baseIcmsDecimal.toFixed(2)} + ${valorIpi.toFixed(2)}) × (1 + ${mva.toFixed(4)})`,
      value: baseStMva.toFixed(2),
    })
  } else {
    audit.push({
      step: 'Base ST (MVA)',
      formula: `${baseIcmsDecimal.toFixed(2)} × (1 + ${mva.toFixed(4)})`,
      value: baseStMva.toFixed(2),
    })
  }

  // 4. Se pauta fiscal informada, base ST = MAX(baseStMva, pautaFiscal × quantidade)
  let baseSt: Decimal
  if (input.pautaFiscal != null && input.quantidade != null) {
    const basePauta = Decimal.from(input.pautaFiscal).mul(Decimal.from(input.quantidade))
    baseSt = Decimal.max(baseStMva, basePauta)
    audit.push({
      step: 'Base ST (pauta)',
      formula: `MAX(${baseStMva.toFixed(2)}, ${Decimal.from(input.pautaFiscal).toFixed(2)} × ${Decimal.from(input.quantidade).toFixed(0)})`,
      value: baseSt.toFixed(2),
    })
  } else {
    baseSt = baseStMva
  }

  // 5. Aplica redução na base ST, se houver
  const baseStEfetiva =
    input.reducaoBaseSt != null
      ? baseSt.mul(Decimal.one().sub(Decimal.from(input.reducaoBaseSt)))
      : baseSt

  if (input.reducaoBaseSt != null) {
    audit.push({
      step: 'Base ST Efetiva (reduzida)',
      formula: `${baseSt.toFixed(2)} × (1 - ${Decimal.from(input.reducaoBaseSt).toFixed(4)})`,
      value: baseStEfetiva.toFixed(2),
    })
  }

  // 6. Alíquota ST efetiva (inclui FECOP)
  const aliquotaStEfetiva = aliquotaSt.add(fecop)

  if (input.fecop != null) {
    audit.push({
      step: 'ALQ ST Efetiva',
      formula: `${aliquotaSt.toFixed(4)} + ${fecop.toFixed(4)} (FECOP)`,
      value: aliquotaStEfetiva.toFixed(4),
    })
  }

  // 7. ICMS-ST = base ST efetiva × alíquota ST efetiva − ICMS próprio
  const icmsStBruto = baseStEfetiva.mul(aliquotaStEfetiva)
  const icmsSt = icmsStBruto.sub(icmsProprio)
  audit.push({
    step: 'ICMS-ST',
    formula: `${baseStEfetiva.toFixed(2)} × ${aliquotaStEfetiva.toFixed(4)} - ${icmsProprio.toFixed(2)}`,
    value: icmsSt.toFixed(2),
  })

  return {
    baseIcms: baseIcmsEfetiva,
    icmsProprio,
    baseSt,
    icmsSt,
    mvaUtilizada: mva,
    audit,
  }
}
