import type { DecimalInternal } from './types.js'
import { RoundingMode } from './types.js'

const ZERO: DecimalInternal = { sign: 1, digits: '0', exponent: 0 }

/**
 * Arredonda um DecimalInternal para o número especificado de casas decimais.
 *
 * O valor interno é sign × int(digits) × 10^exponent.
 * Para arredondar para `places` casas decimais, precisamos que o expoente final
 * seja >= -places.
 */
export function round(
  value: DecimalInternal,
  decimalPlaces: number,
  mode: RoundingMode,
): DecimalInternal {
  if (value.digits === '0') return ZERO

  // Quantos dígitos totais temos após o ponto decimal?
  // O valor é digits × 10^exponent
  // Se exponent >= -decimalPlaces, já está dentro da precisão
  const targetExponent = -decimalPlaces

  if (value.exponent >= targetExponent) {
    return value
  }

  // Precisamos cortar dígitos. O número de dígitos a manter:
  // valor = digits × 10^exponent
  // queremos resultado × 10^targetExponent
  // resultado = digits / 10^(targetExponent - exponent)
  const digitsToRemove = targetExponent - value.exponent

  if (digitsToRemove >= value.digits.length) {
    // Todos os dígitos estão além da precisão desejada
    // Verificar se devemos arredondar para 1 × 10^targetExponent
    const shouldRoundUp = shouldRoundAwayFromZero(value.sign, '0', value.digits, mode)
    if (shouldRoundUp) {
      return { sign: value.sign, digits: '1', exponent: targetExponent }
    }
    return ZERO
  }

  const keptDigits = value.digits.slice(0, value.digits.length - digitsToRemove)
  const removedDigits = value.digits.slice(value.digits.length - digitsToRemove)

  const shouldUp = shouldRoundAwayFromZero(value.sign, keptDigits, removedDigits, mode)

  if (shouldUp) {
    const incremented = incrementDigits(keptDigits)
    return normalize(value.sign, incremented, targetExponent)
  }

  return normalize(value.sign, keptDigits, targetExponent)
}

/**
 * Determina se devemos arredondar para longe do zero.
 *
 * @param sign - sinal do número
 * @param keptDigits - dígitos que ficam
 * @param removedDigits - dígitos que foram removidos
 * @param mode - modo de arredondamento
 */
function shouldRoundAwayFromZero(
  sign: 1 | -1,
  keptDigits: string,
  removedDigits: string,
  mode: RoundingMode,
): boolean {
  // Se removedDigits é todo zeros, não há arredondamento
  if (/^0*$/.test(removedDigits)) return false

  const firstRemoved = Number(removedDigits[0])
  const hasRemainder = removedDigits.length > 1 && !/^.0*$/.test(removedDigits)

  switch (mode) {
    case RoundingMode.UP:
      // Sempre para longe do zero se há fração
      return true

    case RoundingMode.DOWN:
      // Sempre trunca (direção ao zero)
      return false

    case RoundingMode.CEILING:
      // Para +∞: arredonda para cima se positivo
      return sign === 1

    case RoundingMode.FLOOR:
      // Para -∞: arredonda para cima se negativo (mais negativo)
      return sign === -1

    case RoundingMode.HALF_UP:
      // >= 0.5 arredonda para longe do zero
      return firstRemoved >= 5

    case RoundingMode.HALF_DOWN:
      // > 0.5 arredonda para longe do zero, = 0.5 trunca
      if (firstRemoved > 5) return true
      if (firstRemoved < 5) return false
      return hasRemainder // 0.5000... = false, 0.5001... = true

    case RoundingMode.HALF_EVEN: {
      // Metade vai para o par mais próximo
      if (firstRemoved > 5) return true
      if (firstRemoved < 5) return false
      if (hasRemainder) return true // > 0.5 exato

      // Exatamente 0.5: arredonda para o par
      const lastKeptDigit = keptDigits === '' ? 0 : Number(keptDigits[keptDigits.length - 1])
      return lastKeptDigit % 2 !== 0 // ímpar → arredonda para par
    }
  }
}

/** Incrementa uma string de dígitos por 1 */
function incrementDigits(digits: string): string {
  const chars = digits.split('')
  let carry = 1

  for (let i = chars.length - 1; i >= 0 && carry > 0; i--) {
    const sum = Number(chars[i]) + carry
    chars[i] = (sum % 10).toString()
    carry = Math.floor(sum / 10)
  }

  if (carry > 0) {
    return carry.toString() + chars.join('')
  }

  return chars.join('')
}

/** Normaliza removendo trailing zeros */
function normalize(sign: 1 | -1, digits: string, exponent: number): DecimalInternal {
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
