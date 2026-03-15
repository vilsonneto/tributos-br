import { Decimal } from '../precision/index.js'
import type { AuditStep, DecimalInput, ResultadoSimples } from './types.js'
import { validarAliquota, validarValorNaoNegativo } from './validation.js'

export interface CalcCbsInput {
  /** Base de cálculo da CBS. */
  base: DecimalInput
  /**
   * Alíquota da CBS em decimal — ex: 0.009 para 0,9%.
   * A alíquota não é hardcoded pois ainda está em período de transição
   * e varia por setor e ano-calendário (LC 214/2025).
   */
  aliquota: DecimalInput
}

export interface CalcIbsInput {
  /** Base de cálculo do IBS. */
  base: DecimalInput
  /**
   * Alíquota do IBS em decimal — ex: 0.178 para 17,8%.
   * Corresponde à soma das alíquotas estadual e municipal definidas
   * pelo Comitê Gestor do IBS.
   */
  aliquota: DecimalInput
}

/**
 * Calcula a CBS — Contribuição sobre Bens e Serviços (reforma tributária).
 *
 * Substitui PIS e COFINS. Calculada "por fora" sobre a base informada.
 * As alíquotas são informadas pelo chamador — não estão hardcoded —
 * porque ainda estão em período de transição (LC 214/2025).
 *
 * @example
 * calcCbs({ base: '1000', aliquota: '0.009' })
 * // → { base: 1000, aliquota: 0.009, imposto: 9 }
 */
export function calcCbs(input: CalcCbsInput): ResultadoSimples {
  validarAliquota(input.aliquota, 'aliquota')
  validarValorNaoNegativo(input.base, 'base')

  const base = Decimal.from(input.base)
  const aliquota = Decimal.from(input.aliquota)
  const imposto = base.mul(aliquota)

  const audit: AuditStep[] = [
    { step: 'Base CBS', formula: input.base.toString(), value: base.toFixed(2) },
    {
      step: 'CBS',
      formula: `${base.toFixed(2)} × ${aliquota.toFixed(4)}`,
      value: imposto.toFixed(2),
    },
  ]

  return { imposto, base, aliquota, audit }
}

/**
 * Calcula o IBS — Imposto sobre Bens e Serviços (reforma tributária).
 *
 * Substitui ICMS e ISS. Calculado "por fora" sobre a base informada.
 * A alíquota efetiva é a soma das alíquotas estadual + municipal,
 * definidas pelo Comitê Gestor do IBS (LC 214/2025).
 *
 * @example
 * calcIbs({ base: '1000', aliquota: '0.178' })
 * // → { base: 1000, aliquota: 0.178, imposto: 178 }
 */
export function calcIbs(input: CalcIbsInput): ResultadoSimples {
  validarAliquota(input.aliquota, 'aliquota')
  validarValorNaoNegativo(input.base, 'base')

  const base = Decimal.from(input.base)
  const aliquota = Decimal.from(input.aliquota)
  const imposto = base.mul(aliquota)

  const audit: AuditStep[] = [
    { step: 'Base IBS', formula: input.base.toString(), value: base.toFixed(2) },
    {
      step: 'IBS',
      formula: `${base.toFixed(2)} × ${aliquota.toFixed(4)}`,
      value: imposto.toFixed(2),
    },
  ]

  return { imposto, base, aliquota, audit }
}
