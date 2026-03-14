import { Decimal } from '../precision/index.js'
import type { AuditStep, DecimalInput, ResultadoDifal } from './types.js'

export interface CalcDifalInput {
  /** Valor da operação (base de referência para ICMS de origem). */
  valorOperacao: DecimalInput
  /** Alíquota interestadual aplicada pelo estado de origem. Ex: 0.12. */
  aliquotaInterestadual: DecimalInput
  /** Alíquota interna do estado de destino. Ex: 0.18. */
  aliquotaInternaDestino: DecimalInput
  /**
   * Indica se o destinatário é contribuinte do ICMS.
   *
   * - `true` (contribuinte): usa base dupla conforme LC 190/2022.
   *   A base do ICMS de destino é maior — o ICMS de origem é retirado
   *   da base para recalcular sobre o valor "cheio" no destino.
   * - `false` (não-contribuinte, consumidor final): base única.
   *   Ambos os ICMS (origem e destino) calculados sobre o mesmo valor.
   */
  destinatarioContribuinte: boolean
  /** FECOP — Fundo de Combate à Pobreza. Somado à alíquota interna. Ex: 0.02. */
  fecop?: DecimalInput
  /**
   * Indica que `valorOperacao` é uma base já reduzida por benefício fiscal
   * (ICMS CST 20, com pRedBC). Só se aplica quando `destinatarioContribuinte`
   * é `false`.
   *
   * Quando `true`, a base do DIFAL de destino é calculada via ICMS "por
   * dentro" sobre a base reduzida, gerando uma base diferente (maior) para
   * o estado de destino:
   *
   * ```
   * icmsOrigem  = valorOperacao × aliquotaInterestadual
   * baseDifal   = valorOperacao ÷ (1 − aliquotaInternaDestino − fecop)
   * icmsDestino = baseDifal × (aliquotaInternaDestino + fecop)
   * difal       = icmsDestino − icmsOrigem
   * ```
   *
   * A diferença em relação à base dupla do contribuinte (LC 190/2022) é
   * que aqui NÃO se subtrai o ICMS de origem antes da divisão. A redução
   * de base já removeu o componente tributário do preço.
   *
   * Como origem e destino usam bases diferentes, os ICMS são valores
   * monetários independentes (vICMS e vICMSUFDest no XML). O DIFAL é a
   * diferença desses valores arredondados a 2 casas:
   * ```
   * difal = round(icmsDestino, 2) − round(icmsOrigem, 2)
   * ```
   *
   * Cenário real: NF-e EMANX (SEFAZ/MG, cStat 100), Roku Express 4K,
   * CST 20 com pRedBC 95%. A base ICMS interestadual (12.20) difere da
   * base DIFAL destino (14.88 = 12.20 / 0.82). Sem este modo, o calcDifal
   * retornava 0.73 ao invés de 1.22 — erro de 40%.
   *
   * @default false
   */
  baseReduzida?: boolean
}

/**
 * Calcula o DIFAL — Diferencial de Alíquota do ICMS (EC 87/2015 + LC 190/2022).
 *
 * O DIFAL é o imposto adicional pago nas vendas interestaduais para reequilibrar
 * a arrecadação entre o estado de origem e o estado de destino.
 *
 * Três modos de cálculo:
 *
 * **Base única (não-contribuinte, sem redução)**: ambos os ICMS calculados
 * sobre o mesmo valor.
 * ```
 * icmsOrigem  = valorOperacao × aliquotaInterestadual
 * icmsDestino = valorOperacao × aliquotaInternaDestino
 * fcp         = valorOperacao × fecop          (quando informado)
 * difal       = icmsDestino − icmsOrigem       (sem FCP)
 * ```
 *
 * **Base dupla (contribuinte, LC 190/2022)**: o ICMS de origem é subtraído antes
 * de calcular o ICMS de destino, gerando uma base maior para o estado receptor.
 * O FECOP entra no denominador (composição da base) mas NÃO no icmsDestino.
 * ```
 * icmsOrigem  = valorOperacao × aliquotaInterestadual
 * baseDifal   = (valorOperacao − icmsOrigem) ÷ (1 − aliquotaInternaDestino − fecop)
 * icmsDestino = baseDifal × aliquotaInternaDestino
 * fcp         = baseDifal × fecop              (quando informado)
 * difal       = icmsDestino − icmsOrigem       (sem FCP)
 * ```
 *
 * **Base reduzida (não-contribuinte + CST 20)**: quando há benefício fiscal de
 * redução de base (pRedBC), o `valorOperacao` já é a base reduzida. A base do
 * DIFAL de destino é recalculada via ICMS "por dentro", sem subtrair o ICMS de
 * origem (a redução já removeu o componente tributário do preço).
 *
 * Cada intermediário é arredondado a 2 casas porque corresponde a um campo
 * monetário independente no XML da NF-e (vBC, vBCUFDest, vICMS, vICMSUFDest):
 * ```
 * icmsOrigem  = round(valorOperacao × aliquotaInterestadual, 2)
 * baseDifal   = round(valorOperacao ÷ (1 − aliquotaInternaDestino − fecop), 2)
 * icmsDestino = round(baseDifal × aliquotaInternaDestino, 2)
 * fcp         = round(baseDifal × fecop, 2)    (quando informado)
 * difal       = icmsDestino − icmsOrigem        (sem FCP)
 * ```
 *
 * Este terceiro modo foi descoberto a partir de uma NF-e real (EMANX,
 * SEFAZ/MG, CST 20, pRedBC 95%). Sem ele, o calcDifal retornava 0.73
 * quando o valor correto é 1.22.
 *
 * @example
 * // Base única (não-contribuinte)
 * calcDifal({
 *   valorOperacao: '1000',
 *   aliquotaInterestadual: '0.12',
 *   aliquotaInternaDestino: '0.18',
 *   destinatarioContribuinte: false,
 * })
 * // → { difal: 60, icmsOrigem: 120, icmsDestino: 180, baseDifal: 1000 }
 *
 * @example
 * // Base reduzida (CST 20, pRedBC 95%, base já reduzida pelo caller)
 * calcDifal({
 *   valorOperacao: '12.20',    // 243.90 × (1 - 0.95)
 *   aliquotaInterestadual: '0.12',
 *   aliquotaInternaDestino: '0.18',
 *   destinatarioContribuinte: false,
 *   baseReduzida: true,
 * })
 * // → { baseDifal: ~14.88, icmsOrigem: ~1.46, icmsDestino: ~2.68, difal: 1.22 }
 */
export function calcDifal(input: CalcDifalInput): ResultadoDifal {
  const valorOperacao = Decimal.from(input.valorOperacao)
  const aliquotaInterestadual = Decimal.from(input.aliquotaInterestadual)
  const aliquotaInterna = Decimal.from(input.aliquotaInternaDestino)
  const fecop = input.fecop != null ? Decimal.from(input.fecop) : Decimal.zero()
  const audit: AuditStep[] = []

  const aliquotaInternaEfetiva = aliquotaInterna.add(fecop)

  if (input.fecop != null) {
    audit.push({
      step: 'ALQ Interna Efetiva',
      formula: `${aliquotaInterna.toFixed(4)} + ${fecop.toFixed(4)} (FECOP)`,
      value: aliquotaInternaEfetiva.toFixed(4),
    })
  }

  let icmsOrigem = valorOperacao.mul(aliquotaInterestadual)
  audit.push({
    step: 'ICMS Origem',
    formula: `${valorOperacao.toFixed(2)} × ${aliquotaInterestadual.toFixed(4)}`,
    value: icmsOrigem.toFixed(2),
  })

  let baseDifal: Decimal
  let icmsDestino: Decimal

  if (input.destinatarioContribuinte) {
    // Base dupla (LC 190/2022)
    // A alíquota efetiva (com FECOP) é usada no denominador porque o ICMS
    // "por dentro" inclui o FCP na composição da base.
    baseDifal = valorOperacao.sub(icmsOrigem).div(Decimal.one().sub(aliquotaInternaEfetiva))
    audit.push({
      step: 'Base DIFAL (dupla)',
      formula: `(${valorOperacao.toFixed(2)} - ${icmsOrigem.toFixed(2)}) / (1 - ${aliquotaInternaEfetiva.toFixed(4)})`,
      value: baseDifal.toFixed(2),
    })
    icmsDestino = baseDifal.mul(aliquotaInterna)
  } else if (input.baseReduzida === true) {
    // Base reduzida (CST 20 — benefício fiscal com pRedBC)
    // valorOperacao já é a base reduzida. A base DIFAL do destino é
    // calculada via ICMS "por dentro": divide pelo complemento da alíquota
    // interna efetiva (com FECOP), sem subtrair icmsOrigem.
    //
    // Cada intermediário é arredondado a 2 casas (toMoney) porque origem e
    // destino usam bases diferentes — cada valor é um campo monetário
    // independente no XML da NF-e (vBC, vBCUFDest, vICMS, vICMSUFDest).
    baseDifal = valorOperacao.div(Decimal.one().sub(aliquotaInternaEfetiva)).toMoney()
    audit.push({
      step: 'Base DIFAL (reduzida, por dentro)',
      formula: `${valorOperacao.toFixed(2)} / (1 - ${aliquotaInternaEfetiva.toFixed(4)})`,
      value: baseDifal.toFixed(2),
    })
    icmsOrigem = icmsOrigem.toMoney()
    icmsDestino = baseDifal.mul(aliquotaInterna).toMoney()
  } else {
    // Base única
    baseDifal = valorOperacao
    audit.push({
      step: 'Base DIFAL (única)',
      formula: valorOperacao.toFixed(2),
      value: baseDifal.toFixed(2),
    })
    icmsDestino = baseDifal.mul(aliquotaInterna)
  }

  audit.push({
    step: 'ICMS Destino',
    formula: `${baseDifal.toFixed(2)} × ${aliquotaInterna.toFixed(4)}`,
    value: icmsDestino.toFixed(2),
  })

  // FCP separado do DIFAL — no XML, vFCPUFDest é campo independente de vICMSUFDest
  let fcpResult: Decimal | undefined
  if (input.fecop != null) {
    fcpResult =
      input.baseReduzida === true && !input.destinatarioContribuinte
        ? baseDifal.mul(fecop).toMoney()
        : baseDifal.mul(fecop)
    audit.push({
      step: 'FCP',
      formula: `${baseDifal.toFixed(2)} × ${fecop.toFixed(4)}`,
      value: fcpResult.toFixed(2),
    })
  }

  const difal = icmsDestino.sub(icmsOrigem)
  audit.push({
    step: 'DIFAL',
    formula: `${icmsDestino.toFixed(2)} - ${icmsOrigem.toFixed(2)}`,
    value: difal.toFixed(2),
  })

  return {
    difal,
    icmsOrigem,
    icmsDestino,
    baseDifal,
    ...(fcpResult != null && { fcp: fcpResult }),
    audit,
  }
}
