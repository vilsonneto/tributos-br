import { Decimal } from '../precision/index.js'
import type { AuditStep, DecimalInput, ResultadoSimples } from './types.js'
import { validarAliquota, validarValorNaoNegativo } from './validation.js'

export interface CalcPisInput {
  /** Base de cálculo do PIS. */
  base: DecimalInput
  /** Alíquota decimal — ex: 0.0165 para 1,65%. */
  aliquota: DecimalInput
}

export interface CalcCofinsInput {
  /** Base de cálculo da COFINS. */
  base: DecimalInput
  /** Alíquota decimal — ex: 0.076 para 7,60%. */
  aliquota: DecimalInput
}

/**
 * Calcula o PIS — Programa de Integração Social.
 *
 * Calculado "por fora" sobre a base informada.
 * A alíquota não é hardcoded porque varia por regime tributário e CST.
 * Alíquota padrão regime cumulativo: 0,65%. Não cumulativo: 1,65%.
 *
 * @example
 * calcPis({ base: '126.08', aliquota: '0.0165' })
 * // → { base: 126.08, aliquota: 0.0165, imposto: 2.08 }
 */
export function calcPis(input: CalcPisInput): ResultadoSimples {
  validarAliquota(input.aliquota, 'aliquota')
  validarValorNaoNegativo(input.base, 'base')

  const base = Decimal.from(input.base)
  const aliquota = Decimal.from(input.aliquota)
  const imposto = base.mul(aliquota)

  const audit: AuditStep[] = [
    { step: 'Base PIS', formula: input.base.toString(), value: base.toFixed(2) },
    {
      step: 'PIS',
      formula: `${base.toFixed(2)} × ${aliquota.toFixed(4)}`,
      value: imposto.toFixed(2),
    },
  ]

  return { imposto, base, aliquota, audit }
}

/**
 * Calcula a COFINS — Contribuição para o Financiamento da Seguridade Social.
 *
 * Calculada "por fora" sobre a base informada.
 * A alíquota não é hardcoded porque varia por regime tributário e CST.
 * Alíquota padrão regime cumulativo: 3%. Não cumulativo: 7,6%.
 *
 * @example
 * calcCofins({ base: '126.08', aliquota: '0.076' })
 * // → { base: 126.08, aliquota: 0.076, imposto: 9.58 }
 */
export function calcCofins(input: CalcCofinsInput): ResultadoSimples {
  validarAliquota(input.aliquota, 'aliquota')
  validarValorNaoNegativo(input.base, 'base')

  const base = Decimal.from(input.base)
  const aliquota = Decimal.from(input.aliquota)
  const imposto = base.mul(aliquota)

  const audit: AuditStep[] = [
    { step: 'Base COFINS', formula: input.base.toString(), value: base.toFixed(2) },
    {
      step: 'COFINS',
      formula: `${base.toFixed(2)} × ${aliquota.toFixed(4)}`,
      value: imposto.toFixed(2),
    },
  ]

  return { imposto, base, aliquota, audit }
}
