import { describe, it, expect } from 'vitest'
import { parse } from '../precision/parse.js'
import { addInternal, subInternal, mulInternal, divInternal } from '../precision/arithmetic.js'
import type { DecimalInternal } from '../precision/types.js'

/** Converte DecimalInternal para string legível para assertions */
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

// Helpers
function add(a: string, b: string): string {
  return toStr(addInternal(parse(a), parse(b)))
}

function sub(a: string, b: string): string {
  return toStr(subInternal(parse(a), parse(b)))
}

function mul(a: string, b: string): string {
  return toStr(mulInternal(parse(a), parse(b)))
}

function div(a: string, b: string, precision = 20): string {
  return toStr(divInternal(parse(a), parse(b), precision))
}

describe('arithmetic', () => {
  describe('correção IEEE 754 — razão de existir da lib', () => {
    it('0.1 + 0.2 deve ser exatamente 0.3', () => {
      expect(add('0.1', '0.2')).toBe('0.3')
    })

    it('0.1 + 0.1 + 0.1 deve ser exatamente 0.3', () => {
      const step1 = addInternal(parse('0.1'), parse('0.1'))
      const step2 = addInternal(step1, parse('0.1'))
      expect(toStr(step2)).toBe('0.3')
    })

    it('1.005 * 100 deve ser exatamente 100.5', () => {
      expect(mul('1.005', '100')).toBe('100.5')
    })
  })

  describe('soma', () => {
    it('positivos: 1.23 + 4.56 = 5.79', () => {
      expect(add('1.23', '4.56')).toBe('5.79')
    })

    it('negativos: -1 + 3 = 2', () => {
      expect(add('-1', '3')).toBe('2')
    })

    it('zeros: 0 + 0 = 0', () => {
      expect(add('0', '0')).toBe('0')
    })

    it('decimais de tamanhos diferentes: 1.1 + 2.22 = 3.32', () => {
      expect(add('1.1', '2.22')).toBe('3.32')
    })

    it('soma com carry: 999 + 1 = 1000', () => {
      expect(add('999', '1')).toBe('1000')
    })

    it('soma de negativos: -1 + -2 = -3', () => {
      expect(add('-1', '-2')).toBe('-3')
    })

    it('soma com zero: 5 + 0 = 5', () => {
      expect(add('5', '0')).toBe('5')
    })

    it('soma com zero invertido: 0 + 5 = 5', () => {
      expect(add('0', '5')).toBe('5')
    })
  })

  describe('subtração', () => {
    it('5 - 8 = -3', () => {
      expect(sub('5', '8')).toBe('-3')
    })

    it('5 - 5 = 0', () => {
      expect(sub('5', '5')).toBe('0')
    })

    it('10.5 - 3.2 = 7.3', () => {
      expect(sub('10.5', '3.2')).toBe('7.3')
    })

    it('-3 - (-5) = 2', () => {
      expect(sub('-3', '-5')).toBe('2')
    })

    it('0 - 5 = -5', () => {
      expect(sub('0', '5')).toBe('-5')
    })
  })

  describe('multiplicação', () => {
    it('inteiros: 3 × 4 = 12', () => {
      expect(mul('3', '4')).toBe('12')
    })

    it('inteiros grandes: 999 × 999 = 998001', () => {
      expect(mul('999', '999')).toBe('998001')
    })

    it('decimais: 1.5 × 2.0 = 3', () => {
      // 1.5 × 2 = 3.0 normalizado = "3"
      expect(mul('1.5', '2.0')).toBe('3')
    })

    it('negativos: -2 × 3 = -6', () => {
      expect(mul('-2', '3')).toBe('-6')
    })

    it('negativos: -2 × -3 = 6', () => {
      expect(mul('-2', '-3')).toBe('6')
    })

    it('zero: 0 × 999 = 0', () => {
      expect(mul('0', '999')).toBe('0')
    })

    it('zero invertido: 999 × 0 = 0', () => {
      expect(mul('999', '0')).toBe('0')
    })
  })

  describe('divisão', () => {
    it('exata: 10 / 2 = 5', () => {
      expect(div('10', '2')).toBe('5')
    })

    it('periódica: 1 / 3 com precisão', () => {
      const result = div('1', '3', 20)
      expect(result.startsWith('0.3333333333')).toBe(true)
    })

    it('divisão por zero lança erro', () => {
      expect(() => divInternal(parse('10'), parse('0'), 20)).toThrow('Divisão por zero')
    })

    it('0 / 5 = 0', () => {
      expect(div('0', '5')).toBe('0')
    })

    it('negativo: -10 / 2 = -5', () => {
      expect(div('-10', '2')).toBe('-5')
    })

    it('negativo / negativo: -10 / -2 = 5', () => {
      expect(div('-10', '-2')).toBe('5')
    })
  })

  describe('cenários tributários reais', () => {
    it('vProd = vUnCom × qCom: 1.0640 × 39680 deve fechar', () => {
      // NF-e: vProd = vUnCom × qCom
      // 1.0640 × 39680 = 42,219.52
      expect(mul('1.0640', '39680')).toBe('42219.52')
    })

    it('ICMS por dentro: preço / (1 - 0.18)', () => {
      // preço = 100, alíquota ICMS = 18%
      // base = 100 / 0.82 = 121.95121951219512...
      const result = div('100', '0.82', 20)
      expect(result.startsWith('121.9512195121951')).toBe(true)
    })

    it('MVA ajustada: ((1 + MVA) × (1 - interestadual) / (1 - interna)) - 1', () => {
      // MVA original = 34.87%, interestadual = 12%, interna = 25%
      // ((1 + 0.3487) × (1 - 0.12) / (1 - 0.25)) - 1
      // = (1.3487 × 0.88 / 0.75) - 1
      // = (1.186856 / 0.75) - 1
      // = 1.582474666... - 1
      // = 0.582474666...

      const step1 = addInternal(parse('1'), parse('0.3487')) // 1.3487
      const step2 = subInternal(parse('1'), parse('0.12')) // 0.88
      const step3 = subInternal(parse('1'), parse('0.25')) // 0.75
      const step4 = mulInternal(step1, step2) // 1.3487 × 0.88
      const step5 = divInternal(step4, step3, 20) // / 0.75
      const result = subInternal(step5, parse('1')) // - 1

      const resultStr = toStr(result)
      expect(resultStr.startsWith('0.58247')).toBe(true)
    })

    it('rateio de frete entre 3 itens deve somar ao total', () => {
      // Frete total: 100.00, 3 itens com valores: 50, 30, 20
      // Rateio proporcional: 50/100, 30/100, 20/100
      const total = parse('100')
      const item1 = divInternal(mulInternal(parse('100'), parse('50')), total, 20)
      const item2 = divInternal(mulInternal(parse('100'), parse('30')), total, 20)
      const item3 = divInternal(mulInternal(parse('100'), parse('20')), total, 20)

      const soma = addInternal(addInternal(item1, item2), item3)
      expect(toStr(soma)).toBe('100')
    })
  })
})
