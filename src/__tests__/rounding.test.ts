import { describe, it, expect } from 'vitest'
import { parse } from '../precision/parse.js'
import { round } from '../precision/rounding.js'
import { RoundingMode } from '../precision/types.js'
import type { DecimalInternal } from '../precision/types.js'

/** Converte DecimalInternal para string legível */
function toStr(d: DecimalInternal): string {
  if (d.digits === '0') return '0'

  const sign = d.sign === -1 ? '-' : ''

  if (d.exponent >= 0) {
    return sign + d.digits + '0'.repeat(d.exponent)
  }

  const totalDigits = d.digits.length
  const dotPos = totalDigits + d.exponent

  if (dotPos <= 0) {
    return sign + '0.' + '0'.repeat(-dotPos) + d.digits
  }

  return sign + d.digits.slice(0, dotPos) + '.' + d.digits.slice(dotPos)
}

function r(value: string, places: number, mode: RoundingMode): string {
  return toStr(round(parse(value), places, mode))
}

describe('rounding', () => {
  describe('HALF_UP (padrão SEFAZ)', () => {
    it('0.5 → 1', () => {
      expect(r('0.5', 0, RoundingMode.HALF_UP)).toBe('1')
    })

    it('0.4 → 0', () => {
      expect(r('0.4', 0, RoundingMode.HALF_UP)).toBe('0')
    })

    it('0.6 → 1', () => {
      expect(r('0.6', 0, RoundingMode.HALF_UP)).toBe('1')
    })

    it('-0.5 → -1', () => {
      expect(r('-0.5', 0, RoundingMode.HALF_UP)).toBe('-1')
    })

    it('-0.4 → 0', () => {
      expect(r('-0.4', 0, RoundingMode.HALF_UP)).toBe('0')
    })

    it('2.5 → 3', () => {
      expect(r('2.5', 0, RoundingMode.HALF_UP)).toBe('3')
    })

    it('1.45 com 1 casa → 1.5', () => {
      expect(r('1.45', 1, RoundingMode.HALF_UP)).toBe('1.5')
    })
  })

  describe("HALF_EVEN (Banker's rounding)", () => {
    it('0.5 → 0 (par)', () => {
      expect(r('0.5', 0, RoundingMode.HALF_EVEN)).toBe('0')
    })

    it('1.5 → 2 (par)', () => {
      expect(r('1.5', 0, RoundingMode.HALF_EVEN)).toBe('2')
    })

    it('2.5 → 2 (par)', () => {
      expect(r('2.5', 0, RoundingMode.HALF_EVEN)).toBe('2')
    })

    it('3.5 → 4 (par)', () => {
      expect(r('3.5', 0, RoundingMode.HALF_EVEN)).toBe('4')
    })

    it('-0.5 → 0 (par)', () => {
      expect(r('-0.5', 0, RoundingMode.HALF_EVEN)).toBe('0')
    })

    it('-1.5 → -2 (par)', () => {
      expect(r('-1.5', 0, RoundingMode.HALF_EVEN)).toBe('-2')
    })

    it('2.55 com 1 casa → 2.6 (> 0.5 exato)', () => {
      expect(r('2.55', 1, RoundingMode.HALF_EVEN)).toBe('2.6')
    })

    it('1.6 → 2 (firstRemoved > 5, arredonda para cima diretamente)', () => {
      // firstRemoved = 6 > 5 → return true, sem checar par/impar
      expect(r('1.6', 0, RoundingMode.HALF_EVEN)).toBe('2')
    })

    it('1.4 → 1 (firstRemoved < 5, trunca diretamente)', () => {
      expect(r('1.4', 0, RoundingMode.HALF_EVEN)).toBe('1')
    })
  })

  describe('HALF_DOWN', () => {
    it('0.5 → 0', () => {
      expect(r('0.5', 0, RoundingMode.HALF_DOWN)).toBe('0')
    })

    it('0.6 → 1', () => {
      expect(r('0.6', 0, RoundingMode.HALF_DOWN)).toBe('1')
    })

    it('-0.5 → 0', () => {
      expect(r('-0.5', 0, RoundingMode.HALF_DOWN)).toBe('0')
    })

    it('-0.6 → -1', () => {
      expect(r('-0.6', 0, RoundingMode.HALF_DOWN)).toBe('-1')
    })

    it('0.51 → 1 (> 0.5 exato)', () => {
      expect(r('0.51', 0, RoundingMode.HALF_DOWN)).toBe('1')
    })
  })

  describe('UP (away from zero)', () => {
    it('0.1 → 1', () => {
      expect(r('0.1', 0, RoundingMode.UP)).toBe('1')
    })

    it('0.9 → 1', () => {
      expect(r('0.9', 0, RoundingMode.UP)).toBe('1')
    })

    it('-0.1 → -1', () => {
      expect(r('-0.1', 0, RoundingMode.UP)).toBe('-1')
    })

    it('-0.9 → -1', () => {
      expect(r('-0.9', 0, RoundingMode.UP)).toBe('-1')
    })

    it('1.0 → 1 (exato, sem arredondamento)', () => {
      expect(r('1.0', 0, RoundingMode.UP)).toBe('1')
    })
  })

  describe('DOWN (trunca toward zero)', () => {
    it('0.9 → 0', () => {
      expect(r('0.9', 0, RoundingMode.DOWN)).toBe('0')
    })

    it('1.9 → 1', () => {
      expect(r('1.9', 0, RoundingMode.DOWN)).toBe('1')
    })

    it('-0.9 → 0', () => {
      expect(r('-0.9', 0, RoundingMode.DOWN)).toBe('0')
    })

    it('-1.9 → -1', () => {
      expect(r('-1.9', 0, RoundingMode.DOWN)).toBe('-1')
    })
  })

  describe('CEILING (direção +∞)', () => {
    it('0.1 → 1 (positivo arredonda para cima)', () => {
      expect(r('0.1', 0, RoundingMode.CEILING)).toBe('1')
    })

    it('-0.9 → 0 (negativo arredonda para cima = menos negativo)', () => {
      expect(r('-0.9', 0, RoundingMode.CEILING)).toBe('0')
    })

    it('-0.1 → 0', () => {
      expect(r('-0.1', 0, RoundingMode.CEILING)).toBe('0')
    })

    it('1.1 → 2', () => {
      expect(r('1.1', 0, RoundingMode.CEILING)).toBe('2')
    })
  })

  describe('FLOOR (direção -∞)', () => {
    it('0.9 → 0 (positivo trunca)', () => {
      expect(r('0.9', 0, RoundingMode.FLOOR)).toBe('0')
    })

    it('-0.1 → -1 (negativo arredonda para mais negativo)', () => {
      expect(r('-0.1', 0, RoundingMode.FLOOR)).toBe('-1')
    })

    it('-0.9 → -1', () => {
      expect(r('-0.9', 0, RoundingMode.FLOOR)).toBe('-1')
    })

    it('1.9 → 1', () => {
      expect(r('1.9', 0, RoundingMode.FLOOR)).toBe('1')
    })
  })

  describe('casos gerais', () => {
    it('zero não muda com qualquer modo', () => {
      expect(r('0', 0, RoundingMode.HALF_UP)).toBe('0')
      expect(r('0', 0, RoundingMode.HALF_EVEN)).toBe('0')
      expect(r('0', 0, RoundingMode.UP)).toBe('0')
    })

    it('valor exato não muda: 1.5 com 1 casa', () => {
      expect(r('1.5', 1, RoundingMode.HALF_UP)).toBe('1.5')
    })

    it('1.501 arredondado a 0 casas: firstRemoved=5 mas hasRemainder=true → arredonda para cima', () => {
      // firstRemoved = '5', removedDigits = '501', hasRemainder = true (há dígitos após o 5)
      // > 0.5 exato → arredonda para longe do zero = 2
      expect(r('1.501', 0, RoundingMode.HALF_EVEN)).toBe('2')
    })

    it('-1.501 com HALF_EVEN → -2 (simetrico com positivo)', () => {
      expect(r('-1.501', 0, RoundingMode.HALF_EVEN)).toBe('-2')
    })

    it('1.2345 com 2 casas — todos os modos', () => {
      expect(r('1.2345', 2, RoundingMode.HALF_UP)).toBe('1.23')
      expect(r('1.2345', 2, RoundingMode.HALF_EVEN)).toBe('1.23')
      expect(r('1.2345', 2, RoundingMode.HALF_DOWN)).toBe('1.23')
      expect(r('1.2345', 2, RoundingMode.UP)).toBe('1.24')
      expect(r('1.2345', 2, RoundingMode.DOWN)).toBe('1.23')
      expect(r('1.2345', 2, RoundingMode.CEILING)).toBe('1.24')
      expect(r('1.2345', 2, RoundingMode.FLOOR)).toBe('1.23')
    })

    it('-1.2345 com 2 casas — todos os modos', () => {
      expect(r('-1.2345', 2, RoundingMode.HALF_UP)).toBe('-1.23')
      expect(r('-1.2345', 2, RoundingMode.UP)).toBe('-1.24')
      expect(r('-1.2345', 2, RoundingMode.DOWN)).toBe('-1.23')
      expect(r('-1.2345', 2, RoundingMode.CEILING)).toBe('-1.23')
      expect(r('-1.2345', 2, RoundingMode.FLOOR)).toBe('-1.24')
    })

    it('valor muito pequeno: 0.001 com 0 casas UP → 1', () => {
      expect(r('0.001', 0, RoundingMode.UP)).toBe('1')
    })

    it('valor muito pequeno: 0.001 com 0 casas DOWN → 0', () => {
      expect(r('0.001', 0, RoundingMode.DOWN)).toBe('0')
    })

    it('carry no incremento: 9.95 com 1 casa HALF_UP → 10', () => {
      expect(r('9.95', 1, RoundingMode.HALF_UP)).toBe('10')
    })
  })
})
