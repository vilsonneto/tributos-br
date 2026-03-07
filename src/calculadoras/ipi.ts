import { Decimal } from '../precision/index.js'
import type { DecimalInput, ResultadoSimples } from './types.js'

export interface CalcIpiInput {
  valorProduto: DecimalInput
  /** Alíquota decimal — ex: 0.10 para 10%. */
  aliquota: DecimalInput
}

/**
 * Calcula o IPI sobre uma operação.
 *
 * O IPI é sempre calculado "por fora" — incide sobre o valor do produto
 * e é somado ao valor total da nota. A base é sempre o valorProduto.
 *
 * @example
 * calcIpi({ valorProduto: '1000', aliquota: '0.10' })
 * // → { base: 1000, aliquota: 0.10, imposto: 100 }
 */
export function calcIpi(input: CalcIpiInput): ResultadoSimples {
  const base = Decimal.from(input.valorProduto)
  const aliquota = Decimal.from(input.aliquota)
  const imposto = base.mul(aliquota)

  return { imposto, base, aliquota }
}
