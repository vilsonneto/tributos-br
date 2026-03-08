import { Decimal } from '../precision/index.js'
import type { AuditStep, DecimalInput, ResultadoMva } from './types.js'

export interface CalcMvaAjustadaInput {
  /** MVA original do protocolo/convênio ICMS. Ex: 0.40 para 40%. */
  mvaOriginal: DecimalInput
  /** Alíquota interestadual aplicada na operação. Ex: 0.12 para 12%. */
  aliquotaInterestadual: DecimalInput
  /** Alíquota interna do estado de destino. Ex: 0.18 para 18%. */
  aliquotaInterna: DecimalInput
  /**
   * FECOP — Fundo de Combate à Pobreza.
   * Quando informado, é somado à alíquota interna antes do cálculo.
   * Ex: 0.02 para 2%.
   */
  fecop?: DecimalInput
}

/**
 * Calcula a MVA ajustada conforme EC 87/2015.
 *
 * A MVA original é definida por protocolos/convênios assumindo que o remetente
 * e destinatário são contribuintes do mesmo estado. Quando a operação é
 * interestadual, a diferença de alíquotas distorce a margem — a MVA ajustada
 * corrige isso para neutralizar o benefício do diferencial de alíquota.
 *
 * Fórmula:
 * ```
 * aliqInternaEfetiva = aliquotaInterna + (fecop ?? 0)
 * mvaAjustada = ((1 + mvaOriginal) × (1 − aliquotaInterestadual)) ÷ (1 − aliqInternaEfetiva) − 1
 * ```
 *
 * @example
 * calcMvaAjustada({
 *   mvaOriginal: '0.40',
 *   aliquotaInterestadual: '0.12',
 *   aliquotaInterna: '0.18',
 * })
 * // mvaAjustada ≈ 0.5024
 */
export function calcMvaAjustada(input: CalcMvaAjustadaInput): ResultadoMva {
  const mvaOriginalDecimal = Decimal.from(input.mvaOriginal)
  const aliquotaInterestadual = Decimal.from(input.aliquotaInterestadual)
  const aliquotaInterna = Decimal.from(input.aliquotaInterna)
  const fecop = input.fecop != null ? Decimal.from(input.fecop) : Decimal.zero()
  const audit: AuditStep[] = []

  const aliqInternaEfetiva = aliquotaInterna.add(fecop)

  if (input.fecop != null) {
    audit.push({
      step: 'ALQ Interna Efetiva',
      formula: `${aliquotaInterna.toFixed(4)} + ${fecop.toFixed(4)} (FECOP)`,
      value: aliqInternaEfetiva.toFixed(4),
    })
  }

  // ((1 + mvaOriginal) × (1 − aliquotaInterestadual)) ÷ (1 − aliqInternaEfetiva) − 1
  const numerador = Decimal.one()
    .add(mvaOriginalDecimal)
    .mul(Decimal.one().sub(aliquotaInterestadual))
  const denominador = Decimal.one().sub(aliqInternaEfetiva)
  const mvaAjustada = numerador.div(denominador).sub(Decimal.one())

  audit.push({
    step: 'MVA Ajustada',
    formula: `((1 + ${mvaOriginalDecimal.toFixed(4)}) × (1 - ${aliquotaInterestadual.toFixed(4)})) / (1 - ${aliqInternaEfetiva.toFixed(4)}) - 1`,
    value: mvaAjustada.toFixed(4),
  })

  return { mvaAjustada, mvaOriginal: mvaOriginalDecimal, audit }
}
