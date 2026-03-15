import type { DecimalInternal } from './types.js'

/** Representação canônica do zero. */
export const ZERO: DecimalInternal = { sign: 1, digits: '0', exponent: 0 }

/**
 * Remove leading/trailing zeros e ajusta expoente.
 * Garante representação canônica (ex: "00120" com exp -2 → "12" com exp 0).
 */
export function normalize(sign: 1 | -1, digits: string, exponent: number): DecimalInternal {
  const stripped = digits.replace(/^0+/, '') || '0'

  if (stripped === '0') return ZERO

  const trailing = stripped.match(/0+$/)
  if (trailing) {
    return {
      sign,
      digits: stripped.slice(0, -trailing[0].length),
      exponent: exponent + trailing[0].length,
    }
  }

  return { sign, digits: stripped, exponent }
}
