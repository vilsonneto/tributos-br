import { Decimal } from '../precision/index.js'
import type { DecimalInput, ResultadoSimples } from './types.js'

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

  if (input.incluirImpostoNaBase === true) {
    // base = valorProduto ÷ (1 − aliquota)
    base = base.div(Decimal.one().sub(aliquota))
  }

  const imposto = base.mul(aliquota)

  return { imposto, base, aliquota }
}
