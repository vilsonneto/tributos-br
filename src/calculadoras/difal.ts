import { Decimal } from '../precision/index.js'
import type { DecimalInput, ResultadoDifal } from './types.js'

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
}

/**
 * Calcula o DIFAL — Diferencial de Alíquota do ICMS (EC 87/2015 + LC 190/2022).
 *
 * O DIFAL é o imposto adicional pago nas vendas interestaduais para reequilibrar
 * a arrecadação entre o estado de origem e o estado de destino.
 *
 * **Base única (não-contribuinte)**: ambos os ICMS calculados sobre o mesmo valor.
 * ```
 * icmsOrigem  = valorOperacao × aliquotaInterestadual
 * icmsDestino = valorOperacao × (aliquotaInternaDestino + fecop)
 * difal       = icmsDestino − icmsOrigem
 * ```
 *
 * **Base dupla (contribuinte, LC 190/2022)**: o ICMS de origem é subtraído antes
 * de calcular o ICMS de destino, gerando uma base maior para o estado receptor.
 * ```
 * icmsOrigem  = valorOperacao × aliquotaInterestadual
 * baseDifal   = (valorOperacao − icmsOrigem) ÷ (1 − aliquotaInternaDestino − fecop)
 * icmsDestino = baseDifal × (aliquotaInternaDestino + fecop)
 * difal       = icmsDestino − icmsOrigem
 * ```
 *
 * @example
 * calcDifal({
 *   valorOperacao: '1000',
 *   aliquotaInterestadual: '0.12',
 *   aliquotaInternaDestino: '0.18',
 *   destinatarioContribuinte: false,
 * })
 * // → { difal: 60, icmsOrigem: 120, icmsDestino: 180, baseDifal: 1000 }
 */
export function calcDifal(input: CalcDifalInput): ResultadoDifal {
  const valorOperacao = Decimal.from(input.valorOperacao)
  const aliquotaInterestadual = Decimal.from(input.aliquotaInterestadual)
  const aliquotaInterna = Decimal.from(input.aliquotaInternaDestino)
  const fecop = input.fecop != null ? Decimal.from(input.fecop) : Decimal.zero()

  const aliquotaInternaEfetiva = aliquotaInterna.add(fecop)
  const icmsOrigem = valorOperacao.mul(aliquotaInterestadual)

  let baseDifal: Decimal
  let icmsDestino: Decimal

  if (input.destinatarioContribuinte) {
    // Base dupla (LC 190/2022)
    baseDifal = valorOperacao.sub(icmsOrigem).div(Decimal.one().sub(aliquotaInternaEfetiva))
    icmsDestino = baseDifal.mul(aliquotaInternaEfetiva)
  } else {
    // Base única
    baseDifal = valorOperacao
    icmsDestino = baseDifal.mul(aliquotaInternaEfetiva)
  }

  const difal = icmsDestino.sub(icmsOrigem)

  return { difal, icmsOrigem, icmsDestino, baseDifal }
}
