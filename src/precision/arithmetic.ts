/**
 * Aritmética decimal sobre strings — sem IEEE 754.
 *
 * Todas as operações (soma, subtração, multiplicação, divisão) manipulam
 * exclusivamente strings de dígitos. Nenhum valor intermediário passa por
 * `Number` como representação de valor monetário.
 *
 * Motivação: a SEFAZ rejeita NF-e (erros 629/630) quando
 * `vProd ≠ vUnCom × qCom`, causado por drift de ponto flutuante.
 * Exemplo: `1.064 * 39680 = 42219.52000000001` em IEEE 754.
 *
 * @see docs/adr/001-aritmetica-em-strings.md — decisão arquitetural completa
 * @module
 */
import type { DecimalInternal } from './types.js'

const ZERO: DecimalInternal = { sign: 1, digits: '0', exponent: 0 }

// ─── Helpers de strings de dígitos ──────────────────────────────────────

/** Compara magnitudes: retorna 1 se a > b, -1 se a < b, 0 se iguais */
function compareDigits(a: string, b: string): number {
  if (a.length !== b.length) return a.length > b.length ? 1 : -1
  if (a > b) return 1
  if (a < b) return -1
  return 0
}

/** Soma duas strings de dígitos (sem sinal, ambas positivas) */
function addDigits(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length)
  const padA = a.padStart(maxLen, '0')
  const padB = b.padStart(maxLen, '0')

  let carry = 0
  let result = ''

  for (let i = maxLen - 1; i >= 0; i--) {
    const sum = Number(padA[i]) + Number(padB[i]) + carry
    carry = Math.floor(sum / 10)
    result = (sum % 10).toString() + result
  }

  if (carry > 0) {
    result = carry.toString() + result
  }

  return result
}

/** Subtrai duas strings de dígitos (a >= b garantido pelo chamador) */
function subtractDigits(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length)
  const padA = a.padStart(maxLen, '0')
  const padB = b.padStart(maxLen, '0')

  let borrow = 0
  let result = ''

  for (let i = maxLen - 1; i >= 0; i--) {
    let diff = Number(padA[i]) - Number(padB[i]) - borrow
    if (diff < 0) {
      diff += 10
      borrow = 1
    } else {
      borrow = 0
    }
    result = diff.toString() + result
  }

  return result.replace(/^0+/, '') || '0'
}

/** Multiplica duas strings de dígitos via long multiplication */
function multiplyDigits(a: string, b: string): string {
  const result = new Array<number>(a.length + b.length).fill(0)

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const mul = Number(a[i]) * Number(b[j])
      const p1 = i + j
      const p2 = i + j + 1
      const sum = mul + (result[p2] ?? 0)

      result[p2] = sum % 10
      result[p1] = (result[p1] ?? 0) + Math.floor(sum / 10)
    }
  }

  return result.join('').replace(/^0+/, '') || '0'
}

/** Divisão longa: retorna quociente com `precision` dígitos significativos */
function divideDigits(
  a: string,
  b: string,
  precision: number,
): { digits: string; exponent: number } {
  // Padding para obter precisão suficiente
  const totalDigits = precision + 1 // +1 para arredondamento posterior
  const padded = a + '0'.repeat(Math.max(0, totalDigits - a.length + b.length))
  const divisor = b

  let remainder = ''
  let quotient = ''

  for (let i = 0; i < padded.length; i++) {
    remainder += padded[i]
    remainder = remainder.replace(/^0+/, '') || '0'

    let count = 0
    while (compareDigits(remainder, divisor) >= 0) {
      remainder = subtractDigits(remainder, divisor)
      count++
    }
    quotient += count.toString()
  }

  quotient = quotient.replace(/^0+/, '') || '0'

  // O expoente é ajustado pela diferença de comprimento: resultado = quotient × 10^(len_a - len_padded)
  const exponent = a.length - padded.length

  return { digits: quotient, exponent }
}

// ─── Normalização ───────────────────────────────────────────────────────

function normalize(sign: 1 | -1, digits: string, exponent: number): DecimalInternal {
  // Remover leading zeros
  const stripped = digits.replace(/^0+/, '') || '0'

  if (stripped === '0') return ZERO

  // Remover trailing zeros e ajustar expoente
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

// ─── Operações públicas ─────────────────────────────────────────────────

/**
 * Alinha dois DecimalInternal para o mesmo expoente (o menor dos dois),
 * adicionando zeros à direita do que tem expoente maior.
 */
function align(
  a: DecimalInternal,
  b: DecimalInternal,
): { aDigits: string; bDigits: string; exponent: number } {
  const minExp = Math.min(a.exponent, b.exponent)
  const aDigits = a.digits + '0'.repeat(a.exponent - minExp)
  const bDigits = b.digits + '0'.repeat(b.exponent - minExp)
  return { aDigits, bDigits, exponent: minExp }
}

/**
 * Soma dois decimais internos. Opera sobre strings de dígitos
 * para evitar perda de precisão (ex: 0.1 + 0.2 = 0.3 exato).
 */
export function addInternal(a: DecimalInternal, b: DecimalInternal): DecimalInternal {
  // Mesmo sinal: soma magnitudes, mantém sinal
  if (a.sign === b.sign) {
    const { aDigits, bDigits, exponent } = align(a, b)
    const resultDigits = addDigits(aDigits, bDigits)
    return normalize(a.sign, resultDigits, exponent)
  }

  // Sinais diferentes: subtrai magnitudes, sinal do maior
  const { aDigits, bDigits, exponent } = align(a, b)
  const cmp = compareDigits(aDigits, bDigits)

  if (cmp === 0) return ZERO

  if (cmp > 0) {
    const resultDigits = subtractDigits(aDigits, bDigits)
    return normalize(a.sign, resultDigits, exponent)
  }

  const resultDigits = subtractDigits(bDigits, aDigits)
  return normalize(b.sign, resultDigits, exponent)
}

/** Subtrai dois decimais internos: `a - b`. Delega para addInternal com sinal invertido. */
export function subInternal(a: DecimalInternal, b: DecimalInternal): DecimalInternal {
  // a - b = a + (-b)
  const negB: DecimalInternal = b.digits === '0' ? b : { ...b, sign: b.sign === 1 ? -1 : 1 }
  return addInternal(a, negB)
}

/**
 * Multiplica dois decimais internos via long multiplication sobre strings.
 * Cenário SEFAZ típico: `vProd = vUnCom × qCom` deve ser exato.
 */
export function mulInternal(a: DecimalInternal, b: DecimalInternal): DecimalInternal {
  if (a.digits === '0' || b.digits === '0') return ZERO

  const sign: 1 | -1 = a.sign === b.sign ? 1 : -1
  const digits = multiplyDigits(a.digits, b.digits)
  const exponent = a.exponent + b.exponent

  return normalize(sign, digits, exponent)
}

/**
 * Divide dois decimais internos via divisão longa sobre strings.
 * O parâmetro `precision` define dígitos significativos do quociente.
 * Cenário SEFAZ típico: ICMS por dentro `vBC = vProd / (1 - alíquota)`.
 */
export function divInternal(
  a: DecimalInternal,
  b: DecimalInternal,
  precision: number,
): DecimalInternal {
  if (b.digits === '0') {
    throw new Error('Divisão por zero')
  }

  if (a.digits === '0') return ZERO

  const sign: 1 | -1 = a.sign === b.sign ? 1 : -1
  const { digits, exponent: divExp } = divideDigits(a.digits, b.digits, precision)
  const exponent = divExp + (a.exponent - b.exponent)

  return normalize(sign, digits, exponent)
}
