/**
 * Parser de entrada → DecimalInternal.
 *
 * Converte strings, numbers e objetos com toString() para a representação
 * interna. Quando recebe `number`, converte via `.toString()` — nunca opera
 * sobre o float diretamente — para preservar a intenção do usuário.
 *
 * @see docs/adr/001-aritmetica-em-strings.md
 * @module
 */
import type { DecimalInput, DecimalInternal } from './types.js'
import { ZERO as ZERO_INTERNAL } from './internal.js'

/**
 * Converte uma entrada (string, number ou objeto com toString()) para DecimalInternal.
 *
 * Nunca opera diretamente sobre floats — converte number via .toString()
 * para preservar a intenção do usuário (ex: 0.1 → "0.1", não "0.1000...0001").
 */
export function parse(value: DecimalInput): DecimalInternal {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Valor inválido: ${value}`)
    }
    return parseString(value.toString())
  }

  if (typeof value === 'string') {
    return parseString(value)
  }

  // Objeto com toString() — inclui Decimal quando existir
  return parseString(value.toString())
}

function parseString(raw: string): DecimalInternal {
  const trimmed = raw.trim()

  if (trimmed === '') {
    throw new Error('Valor inválido: string vazia')
  }

  // Determinar sinal
  let str = trimmed
  let sign: 1 | -1 = 1

  if (str.startsWith('-')) {
    sign = -1
    str = str.slice(1)
  } else if (str.startsWith('+')) {
    str = str.slice(1)
  }

  if (str === '') {
    throw new Error(`Valor inválido: "${raw}"`)
  }

  // Notação científica: separar mantissa e expoente
  let mantissa = str
  let expPart = 0

  const eIndex = str.search(/[eE]/)
  if (eIndex !== -1) {
    mantissa = str.slice(0, eIndex)
    const expStr = str.slice(eIndex + 1)

    if (expStr === '' || expStr === '+' || expStr === '-') {
      throw new Error(`Valor inválido: "${raw}"`)
    }

    expPart = Number(expStr)

    if (!Number.isFinite(expPart) || !Number.isInteger(expPart)) {
      throw new Error(`Valor inválido: "${raw}"`)
    }
  }

  // Validar mantissa: apenas dígitos e no máximo um ponto
  const dotIndex = mantissa.indexOf('.')

  let intPart: string
  let fracPart: string

  if (dotIndex === -1) {
    intPart = mantissa
    fracPart = ''
  } else {
    intPart = mantissa.slice(0, dotIndex)
    fracPart = mantissa.slice(dotIndex + 1)

    // Segundo ponto decimal = inválido
    if (fracPart.includes('.')) {
      throw new Error(`Valor inválido: "${raw}"`)
    }
  }

  // Parte inteira vazia com parte fracionária (ex: ".5")
  if (intPart === '') {
    intPart = '0'
  }

  // Validar que só contém dígitos
  if (!/^\d+$/.test(intPart) || (fracPart !== '' && !/^\d+$/.test(fracPart))) {
    throw new Error(`Valor inválido: "${raw}"`)
  }

  // Juntar dígitos e calcular expoente
  const allDigits = intPart + fracPart
  const exponent = expPart - fracPart.length

  // Remover zeros à esquerda
  const stripped = allDigits.replace(/^0+/, '') || '0'

  // Zero em qualquer forma
  if (stripped === '0') {
    return ZERO_INTERNAL
  }

  // Remover zeros à direita e ajustar expoente
  const trailingZeros = stripped.match(/0+$/)
  if (trailingZeros) {
    const trimmedDigits = stripped.slice(0, -trailingZeros[0].length)
    return {
      sign,
      digits: trimmedDigits || '0',
      exponent: exponent + trailingZeros[0].length,
    }
  }

  return { sign, digits: stripped, exponent }
}
