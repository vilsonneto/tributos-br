import { Decimal } from '../precision/index.js'
import type { AuditStep, DecimalInput, ResultadoSimples } from './types.js'

export interface CalcIcmsInput {
  valorProduto: DecimalInput
  /**
   * Alíquota decimal — ex: 0.18 para 18%.
   * Não usar percentual inteiro (18), sempre fração decimal (0.18).
   */
  aliquota: DecimalInput
  /**
   * ICMS "por dentro" (base de cálculo inclui o próprio imposto).
   * Usado em operações internas em alguns estados. Default: false (por fora).
   *
   * Por fora: base = valorProduto
   * Por dentro: base = valorProduto ÷ (1 − aliquota)
   */
  incluirImpostoNaBase?: boolean
  /**
   * FCP (Fundo de Combate à Pobreza) — alíquota decimal. Ex: 0.02 para 2%.
   * Calculado sobre a mesma base do ICMS. Retornado como campo separado
   * no resultado (corresponde a vFCP no XML da NF-e).
   */
  fcp?: DecimalInput
}

/**
 * Calcula o ICMS sobre uma operação.
 *
 * **Por fora** (padrão, operações interestaduais): a base é o valor do produto.
 * **Por dentro** (operações internas em alguns estados): o imposto já está embutido
 * no preço, então a base é maior — divide-se pelo complemento da alíquota para
 * "desembutir" o ICMS e recalcular sobre a base cheia.
 *
 * @example
 * calcIcms({ valorProduto: '1000', aliquota: '0.18' })
 * // → { base: 1000, aliquota: 0.18, imposto: 180 }
 *
 * calcIcms({ valorProduto: '1000', aliquota: '0.18', incluirImpostoNaBase: true })
 * // → { base: ~1219.51, aliquota: 0.18, imposto: ~219.51 }
 */
export function calcIcms(input: CalcIcmsInput): ResultadoSimples {
  const aliquota = Decimal.from(input.aliquota)
  let base = Decimal.from(input.valorProduto)
  const audit: AuditStep[] = []

  if (input.incluirImpostoNaBase === true) {
    const complemento = Decimal.one().sub(aliquota)
    const baseOriginal = base
    base = base.div(complemento)
    audit.push({
      step: 'Base ICMS (por dentro)',
      formula: `${baseOriginal.toFixed(2)} / (1 - ${aliquota.toFixed(4)})`,
      value: base.toFixed(2),
    })
  } else {
    audit.push({
      step: 'Base ICMS',
      formula: input.valorProduto.toString(),
      value: base.toFixed(2),
    })
  }

  const imposto = base.mul(aliquota)
  audit.push({
    step: 'ICMS',
    formula: `${base.toFixed(2)} × ${aliquota.toFixed(4)}`,
    value: imposto.toFixed(2),
  })

  let fcpResult: Decimal | undefined
  if (input.fcp != null) {
    const fcpAliquota = Decimal.from(input.fcp)
    fcpResult = base.mul(fcpAliquota)
    audit.push({
      step: 'FCP',
      formula: `${base.toFixed(2)} × ${fcpAliquota.toFixed(4)}`,
      value: fcpResult.toFixed(2),
    })
  }

  return { imposto, base, aliquota, ...(fcpResult != null && { fcp: fcpResult }), audit }
}
