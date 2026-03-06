import { describe, it, expect } from 'vitest'
import { Decimal } from '../precision/decimal.js'
import { RoundingMode } from '../precision/types.js'

describe('Decimal', () => {
  // ─── Construtores ──────────────────────────────────────────────────

  describe('from()', () => {
    it('cria a partir de string', () => {
      expect(Decimal.from('1.23').toString()).toBe('1.23')
    })

    it('cria a partir de number', () => {
      expect(Decimal.from(1.23).toString()).toBe('1.23')
    })

    it('cria a partir de outro Decimal', () => {
      const a = Decimal.from('1.23')
      const b = Decimal.from(a)
      expect(b.toString()).toBe('1.23')
    })

    it('aceita config customizada', () => {
      const d = Decimal.from('1', { precision: 10, rounding: RoundingMode.HALF_EVEN })
      expect(d.toString()).toBe('1')
    })

    it('lanca erro para valor invalido', () => {
      expect(() => Decimal.from('abc')).toThrow()
    })
  })

  describe('zero() e one()', () => {
    it('zero', () => {
      expect(Decimal.zero().toString()).toBe('0')
      expect(Decimal.zero().isZero()).toBe(true)
    })

    it('one', () => {
      expect(Decimal.one().toString()).toBe('1')
      expect(Decimal.one().isZero()).toBe(false)
    })
  })

  // ─── Imutabilidade ─────────────────────────────────────────────────

  describe('imutabilidade', () => {
    it('add nao modifica o original', () => {
      const a = Decimal.from('1')
      const b = a.add('2')
      expect(a.toString()).toBe('1')
      expect(b.toString()).toBe('3')
    })

    it('sub nao modifica o original', () => {
      const a = Decimal.from('5')
      a.sub('3')
      expect(a.toString()).toBe('5')
    })

    it('mul nao modifica o original', () => {
      const a = Decimal.from('2')
      a.mul('3')
      expect(a.toString()).toBe('2')
    })

    it('div nao modifica o original', () => {
      const a = Decimal.from('10')
      a.div('3')
      expect(a.toString()).toBe('10')
    })

    it('round nao modifica o original', () => {
      const a = Decimal.from('1.555')
      a.round(2)
      expect(a.toString()).toBe('1.555')
    })

    it('operacao em cadeia nao altera intermediarios', () => {
      const a = Decimal.from('100')
      const b = a.mul('1.18')
      const c = b.round(2)
      expect(a.toString()).toBe('100')
      expect(b.toString()).toBe('118')
      expect(c.toString()).toBe('118')
    })
  })

  // ─── Encadeamento ──────────────────────────────────────────────────

  describe('encadeamento', () => {
    it('Decimal.from("100").mul("1.18").round(2).toFixed(2) === "118.00"', () => {
      expect(Decimal.from('100').mul('1.18').round(2).toFixed(2)).toBe('118.00')
    })

    it('cadeia longa de 5+ operacoes mantem precisao', () => {
      // 10 + 5 = 15, * 2 = 30, - 3 = 27, / 9 = 3, + 0.5 = 3.5
      const result = Decimal.from('10').add('5').mul('2').sub('3').div('9').add('0.5')
      expect(result.toString()).toBe('3.5')
    })

    it('correcao IEEE 754: 0.1 + 0.2 = 0.3', () => {
      expect(Decimal.from('0.1').add('0.2').toString()).toBe('0.3')
    })
  })

  // ─── Atalhos tributarios ───────────────────────────────────────────

  describe('toMoney() e toRate()', () => {
    it('toMoney arredonda para 2 casas com HALF_UP', () => {
      expect(Decimal.from('1.235').toMoney().toFixed(2)).toBe('1.24')
      expect(Decimal.from('1.234').toMoney().toFixed(2)).toBe('1.23')
      expect(Decimal.from('1.225').toMoney().toFixed(2)).toBe('1.23')
    })

    it('toRate arredonda para 4 casas com HALF_UP', () => {
      expect(Decimal.from('0.12345').toRate().toFixed(4)).toBe('0.1235')
      expect(Decimal.from('0.12344').toRate().toFixed(4)).toBe('0.1234')
    })
  })

  // ─── Comparacoes ───────────────────────────────────────────────────

  describe('comparacoes', () => {
    it('cmp retorna -1, 0, 1', () => {
      expect(Decimal.from('1').cmp('2')).toBe(-1)
      expect(Decimal.from('2').cmp('2')).toBe(0)
      expect(Decimal.from('3').cmp('2')).toBe(1)
    })

    it('eq', () => {
      expect(Decimal.from('1.0').eq('1')).toBe(true)
      expect(Decimal.from('1').eq('2')).toBe(false)
    })

    it('gt e gte', () => {
      expect(Decimal.from('3').gt('2')).toBe(true)
      expect(Decimal.from('2').gt('2')).toBe(false)
      expect(Decimal.from('2').gte('2')).toBe(true)
      expect(Decimal.from('1').gte('2')).toBe(false)
    })

    it('lt e lte', () => {
      expect(Decimal.from('1').lt('2')).toBe(true)
      expect(Decimal.from('2').lt('2')).toBe(false)
      expect(Decimal.from('2').lte('2')).toBe(true)
      expect(Decimal.from('3').lte('2')).toBe(false)
    })

    it('comparacoes com negativos', () => {
      expect(Decimal.from('-1').lt('0')).toBe(true)
      expect(Decimal.from('-1').lt('-2')).toBe(false)
      expect(Decimal.from('-2').lt('-1')).toBe(true)
    })

    it('comparacoes com zero', () => {
      expect(Decimal.from('0').eq('0')).toBe(true)
      expect(Decimal.from('0').gt('-1')).toBe(true)
      expect(Decimal.from('0').lt('1')).toBe(true)
    })
  })

  // ─── Utilitarios ───────────────────────────────────────────────────

  describe('utilitarios', () => {
    it('abs de negativo', () => {
      expect(Decimal.from('-5').abs().toString()).toBe('5')
    })

    it('abs de positivo retorna mesmo valor', () => {
      expect(Decimal.from('5').abs().toString()).toBe('5')
    })

    it('abs de zero', () => {
      expect(Decimal.from('0').abs().toString()).toBe('0')
    })

    it('neg inverte sinal', () => {
      expect(Decimal.from('5').neg().toString()).toBe('-5')
      expect(Decimal.from('-5').neg().toString()).toBe('5')
    })

    it('neg de zero', () => {
      expect(Decimal.from('0').neg().toString()).toBe('0')
    })

    it('isZero', () => {
      expect(Decimal.from('0').isZero()).toBe(true)
      expect(Decimal.from('1').isZero()).toBe(false)
    })

    it('isNegative', () => {
      expect(Decimal.from('-1').isNegative()).toBe(true)
      expect(Decimal.from('0').isNegative()).toBe(false)
      expect(Decimal.from('1').isNegative()).toBe(false)
    })

    it('isPositive', () => {
      expect(Decimal.from('1').isPositive()).toBe(true)
      expect(Decimal.from('0').isPositive()).toBe(false)
      expect(Decimal.from('-1').isPositive()).toBe(false)
    })
  })

  describe('max e min', () => {
    it('max com multiplos valores', () => {
      expect(Decimal.max('1', '3', '2').toString()).toBe('3')
    })

    it('max com negativos', () => {
      expect(Decimal.max('-5', '-1', '-3').toString()).toBe('-1')
    })

    it('min com multiplos valores', () => {
      expect(Decimal.min('1', '3', '2').toString()).toBe('1')
    })

    it('min com negativos', () => {
      expect(Decimal.min('-5', '-1', '-3').toString()).toBe('-5')
    })

    it('max com um unico valor', () => {
      expect(Decimal.max('42').toString()).toBe('42')
    })

    it('min com um unico valor', () => {
      expect(Decimal.min('42').toString()).toBe('42')
    })

    it('max sem argumentos lanca erro', () => {
      expect(() => Decimal.max()).toThrow('ao menos um argumento')
    })

    it('min sem argumentos lanca erro', () => {
      expect(() => Decimal.min()).toThrow('ao menos um argumento')
    })
  })

  // ─── Conversao ─────────────────────────────────────────────────────

  describe('conversao', () => {
    it('toString sem notacao cientifica', () => {
      expect(Decimal.from('123456789.123456789').toString()).toBe('123456789.123456789')
    })

    it('toFixed com padding de zeros', () => {
      expect(Decimal.from('1.5').toFixed(2)).toBe('1.50')
      expect(Decimal.from('1').toFixed(3)).toBe('1.000')
    })

    it('toFixed(0) remove decimais', () => {
      expect(Decimal.from('1.9').toFixed(0)).toBe('1')
    })

    it('toFixed trunca sem arredondar', () => {
      expect(Decimal.from('1.999').toFixed(2)).toBe('1.99')
    })

    it('toNumber retorna number', () => {
      expect(Decimal.from('1.5').toNumber()).toBe(1.5)
      expect(typeof Decimal.from('1').toNumber()).toBe('number')
    })

    it('toJSON retorna string (para JSON.stringify)', () => {
      const d = Decimal.from('1.23')
      expect(d.toJSON()).toBe('1.23')
      expect(JSON.stringify({ valor: d })).toBe('{"valor":"1.23"}')
    })
  })

  // ─── Cenarios tributarios reais ────────────────────────────────────

  describe('cenarios tributarios', () => {
    it('vProd = vUnCom x qCom: 1.0640 x 39680 sem diferenca de centavo', () => {
      const vUnCom = Decimal.from('1.0640')
      const qCom = Decimal.from('39680')
      const vProd = vUnCom.mul(qCom).toMoney()
      expect(vProd.toFixed(2)).toBe('42219.52')
    })

    it('ICMS por dentro: vBC = vProd / (1 - aliq)', () => {
      const vProd = Decimal.from('1000')
      const aliq = Decimal.from('0.18')
      const vBC = vProd.div(Decimal.one().sub(aliq)).toMoney()
      // 1000 / 0.82 = 1219.51...
      expect(vBC.toFixed(2)).toBe('1219.51')
    })

    it('ICMS ST por MVA: ((1 + mva) x precoBase - precoBase) x aliquota', () => {
      const precoBase = Decimal.from('100')
      const mva = Decimal.from('0.40')
      const aliquota = Decimal.from('0.18')

      const baseSTcalc = Decimal.one().add(mva).mul(precoBase)
      const diffST = baseSTcalc.sub(precoBase)
      const icmsST = diffST.mul(aliquota).toMoney()

      // (1.40 * 100 - 100) * 0.18 = 40 * 0.18 = 7.20
      expect(icmsST.toFixed(2)).toBe('7.20')
    })

    it('rateio de frete: 3 itens, soma dos rateios === total', () => {
      const freteTotal = Decimal.from('100')
      const valores = [Decimal.from('200'), Decimal.from('300'), Decimal.from('500')]
      const totalItens = valores.reduce((acc, v) => acc.add(v), Decimal.zero())

      const rateios = valores.map((v) => v.div(totalItens).mul(freteTotal).toMoney())

      // 200/1000*100=20, 300/1000*100=30, 500/1000*100=50
      expect(rateios[0]!.toFixed(2)).toBe('20.00')
      expect(rateios[1]!.toFixed(2)).toBe('30.00')
      expect(rateios[2]!.toFixed(2)).toBe('50.00')

      const somaRateios = rateios.reduce((acc, r) => acc.add(r), Decimal.zero())
      expect(somaRateios.eq(freteTotal)).toBe(true)
    })
  })

  // ─── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('divisao por zero lanca erro', () => {
      expect(() => Decimal.from('1').div('0')).toThrow('Divisão por zero')
    })

    it('numero muito pequeno', () => {
      expect(Decimal.from('0.0000001').toString()).toBe('0.0000001')
    })

    it('numero muito grande', () => {
      expect(Decimal.from('999999999999').toString()).toBe('999999999999')
    })

    it('operacoes com Decimal.zero()', () => {
      expect(Decimal.zero().add('5').toString()).toBe('5')
      expect(Decimal.from('5').mul(Decimal.zero()).toString()).toBe('0')
      expect(Decimal.zero().isZero()).toBe(true)
    })

    it('negativo com toFixed', () => {
      expect(Decimal.from('-1.5').toFixed(2)).toBe('-1.50')
    })

    it('from aceita Decimal como input em operacoes', () => {
      const a = Decimal.from('2')
      const b = Decimal.from('3')
      expect(a.add(b).toString()).toBe('5')
      expect(a.mul(b).toString()).toBe('6')
    })
  })
})
