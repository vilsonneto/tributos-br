import { describe, it, expect } from 'vitest'
import { parse } from '../precision/parse.js'

describe('parse', () => {
  describe('inteiros positivos', () => {
    it('deve parsear "42"', () => {
      expect(parse('42')).toEqual({ sign: 1, digits: '42', exponent: 0 })
    })

    it('deve parsear "0" como zero normalizado', () => {
      expect(parse('0')).toEqual({ sign: 1, digits: '0', exponent: 0 })
    })

    it('deve parsear "1"', () => {
      expect(parse('1')).toEqual({ sign: 1, digits: '1', exponent: 0 })
    })

    it('deve parsear inteiro grande', () => {
      expect(parse('123456789012345678901234567890')).toEqual({
        sign: 1,
        digits: '12345678901234567890123456789',
        exponent: 1,
      })
    })
  })

  describe('decimais positivos', () => {
    it('deve parsear "1.23"', () => {
      expect(parse('1.23')).toEqual({ sign: 1, digits: '123', exponent: -2 })
    })

    it('deve parsear "0.001"', () => {
      expect(parse('0.001')).toEqual({ sign: 1, digits: '1', exponent: -3 })
    })

    it('deve parsear "100.0" normalizando trailing zeros', () => {
      const result = parse('100.0')
      expect(result.sign).toBe(1)
      // 1000 com trailing zeros removidos = "1" com exponent ajustado
      expect(result.digits).toBe('1')
      expect(result.exponent).toBe(2)
    })

    it('deve parsear ".5" (sem parte inteira)', () => {
      expect(parse('.5')).toEqual({ sign: 1, digits: '5', exponent: -1 })
    })
  })

  describe('negativos', () => {
    it('deve parsear "-1"', () => {
      expect(parse('-1')).toEqual({ sign: -1, digits: '1', exponent: 0 })
    })

    it('deve parsear "-0.5"', () => {
      expect(parse('-0.5')).toEqual({ sign: -1, digits: '5', exponent: -1 })
    })

    it('deve parsear "-100.123"', () => {
      expect(parse('-100.123')).toEqual({ sign: -1, digits: '100123', exponent: -3 })
    })

    it('deve normalizar "-0" como zero positivo', () => {
      expect(parse('-0')).toEqual({ sign: 1, digits: '0', exponent: 0 })
    })
  })

  describe('notação científica', () => {
    it('deve parsear "1e-10"', () => {
      expect(parse('1e-10')).toEqual({ sign: 1, digits: '1', exponent: -10 })
    })

    it('deve parsear "1.5e+3"', () => {
      const result = parse('1.5e+3')
      expect(result.sign).toBe(1)
      expect(result.digits).toBe('15')
      expect(result.exponent).toBe(2)
    })

    it('deve parsear "2.5E-4" (E maiúsculo)', () => {
      expect(parse('2.5E-4')).toEqual({ sign: 1, digits: '25', exponent: -5 })
    })

    it('deve parsear "5e0"', () => {
      expect(parse('5e0')).toEqual({ sign: 1, digits: '5', exponent: 0 })
    })
  })

  describe('leading zeros', () => {
    it('deve normalizar "007" para digits "7"', () => {
      expect(parse('007')).toEqual({ sign: 1, digits: '7', exponent: 0 })
    })

    it('deve normalizar "00.123"', () => {
      expect(parse('00.123')).toEqual({ sign: 1, digits: '123', exponent: -3 })
    })

    it('deve normalizar "000" como zero', () => {
      expect(parse('000')).toEqual({ sign: 1, digits: '0', exponent: 0 })
    })
  })

  describe('trailing zeros', () => {
    it('deve normalizar "1.200" removendo trailing zeros e ajustando expoente', () => {
      const result = parse('1.200')
      expect(result.sign).toBe(1)
      expect(result.digits).toBe('12')
      expect(result.exponent).toBe(-1)
    })
  })

  describe('sinal + explícito', () => {
    it('deve parsear "+42" como positivo', () => {
      expect(parse('+42')).toEqual({ sign: 1, digits: '42', exponent: 0 })
    })

    it('deve parsear "+0.5" como positivo', () => {
      expect(parse('+0.5')).toEqual({ sign: 1, digits: '5', exponent: -1 })
    })
  })

  describe('entrada number', () => {
    it('deve parsear 0.1', () => {
      const result = parse(0.1)
      expect(result.sign).toBe(1)
      expect(result.digits).toBe('1')
      expect(result.exponent).toBe(-1)
    })

    it('deve parsear 1.5', () => {
      expect(parse(1.5)).toEqual({ sign: 1, digits: '15', exponent: -1 })
    })

    it('deve parsear -3.14', () => {
      expect(parse(-3.14)).toEqual({ sign: -1, digits: '314', exponent: -2 })
    })

    it('deve parsear 1e-10', () => {
      expect(parse(1e-10)).toEqual({ sign: 1, digits: '1', exponent: -10 })
    })

    it('deve parsear 0', () => {
      expect(parse(0)).toEqual({ sign: 1, digits: '0', exponent: 0 })
    })

    it('deve parsear -0 como zero positivo', () => {
      expect(parse(-0)).toEqual({ sign: 1, digits: '0', exponent: 0 })
    })
  })

  describe('entrada objeto com toString()', () => {
    it('deve parsear objeto com toString()', () => {
      const obj = { toString: () => '3.14' }
      expect(parse(obj)).toEqual({ sign: 1, digits: '314', exponent: -2 })
    })
  })

  describe('entradas inválidas', () => {
    it('deve rejeitar NaN', () => {
      expect(() => parse(NaN)).toThrow('Valor inválido: NaN')
    })

    it('deve rejeitar Infinity', () => {
      expect(() => parse(Infinity)).toThrow('Valor inválido: Infinity')
    })

    it('deve rejeitar -Infinity', () => {
      expect(() => parse(-Infinity)).toThrow('Valor inválido: -Infinity')
    })

    it('deve rejeitar string vazia', () => {
      expect(() => parse('')).toThrow('Valor inválido: string vazia')
    })

    it('deve rejeitar múltiplos pontos "1.2.3"', () => {
      expect(() => parse('1.2.3')).toThrow('Valor inválido: "1.2.3"')
    })

    it('deve rejeitar vírgula como separador "1,23"', () => {
      expect(() => parse('1,23')).toThrow('Valor inválido: "1,23"')
    })

    it('deve rejeitar letras "abc"', () => {
      expect(() => parse('abc')).toThrow('Valor inválido: "abc"')
    })

    it('deve rejeitar mix de letras e números "12x4"', () => {
      expect(() => parse('12x4')).toThrow('Valor inválido: "12x4"')
    })

    it('deve rejeitar apenas sinal "-"', () => {
      expect(() => parse('-')).toThrow('Valor inválido: "-"')
    })

    it('deve rejeitar apenas sinal "+"', () => {
      expect(() => parse('+')).toThrow('Valor inválido: "+"')
    })

    it('deve rejeitar notação científica incompleta "1e"', () => {
      expect(() => parse('1e')).toThrow('Valor inválido: "1e"')
    })

    it('deve rejeitar notação científica com expoente inválido "1e1.5"', () => {
      expect(() => parse('1e1.5')).toThrow('Valor inválido: "1e1.5"')
    })
  })
})
