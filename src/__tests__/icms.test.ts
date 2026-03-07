import { describe, it, expect } from 'vitest'
import { calcIcms } from '../calculadoras/icms.js'
import { Decimal } from '../precision/index.js'

/**
 * Regra: ICMS por fora → imposto = valorProduto × aliquota
 * Regra: ICMS por dentro → base = valorProduto ÷ (1 − aliquota), imposto = base × aliquota
 *
 * O retorno é { imposto, base, aliquota } — todos Decimal, sem arredondamento aplicado.
 * Arredondar é responsabilidade de quem chama (toMoney para campos SEFAZ).
 */
describe('calcIcms', () => {
  describe('por fora (default)', () => {
    it('1000 × 0.18 = 180', () => {
      const r = calcIcms({ valorProduto: '1000', aliquota: '0.18' })
      expect(r.base.toString()).toBe('1000')
      expect(r.aliquota.toString()).toBe('0.18')
      expect(r.imposto.toString()).toBe('180')
    })

    it('500 × 0.12 (interestadual SP→MG) = 60', () => {
      const r = calcIcms({ valorProduto: '500', aliquota: '0.12' })
      expect(r.imposto.toString()).toBe('60')
    })

    it('39680 × 0.18 (caso SEFAZ 629/630) = 7142.40', () => {
      // SEFAZ rejeita NF-e quando vProd ≠ vUnCom × qCom por drift IEEE 754.
      // Aqui verificamos que a multiplicação é exata.
      const r = calcIcms({ valorProduto: '39680', aliquota: '0.18' })
      expect(r.imposto.toString()).toBe('7142.4')
    })

    it('incluirImpostoNaBase: false explícito — mesmo resultado que default', () => {
      const padrao = calcIcms({ valorProduto: '1000', aliquota: '0.18' })
      const explicito = calcIcms({
        valorProduto: '1000',
        aliquota: '0.18',
        incluirImpostoNaBase: false,
      })
      expect(padrao.imposto.toString()).toBe(explicito.imposto.toString())
    })

    it('aceita Decimal como input', () => {
      const r = calcIcms({ valorProduto: Decimal.from('2500'), aliquota: Decimal.from('0.12') })
      expect(r.imposto.toString()).toBe('300')
    })

    it('aceita number como input', () => {
      const r = calcIcms({ valorProduto: 800, aliquota: 0.17 })
      expect(r.imposto.toString()).toBe('136')
    })

    it('alíquota zero — imposto zero', () => {
      const r = calcIcms({ valorProduto: '50000', aliquota: '0' })
      expect(r.imposto.isZero()).toBe(true)
    })

    it('base zero — imposto zero', () => {
      const r = calcIcms({ valorProduto: '0', aliquota: '0.18' })
      expect(r.imposto.isZero()).toBe(true)
    })

    it('retorna instâncias de Decimal', () => {
      const r = calcIcms({ valorProduto: '1000', aliquota: '0.18' })
      expect(r.base).toBeInstanceOf(Decimal)
      expect(r.imposto).toBeInstanceOf(Decimal)
      expect(r.aliquota).toBeInstanceOf(Decimal)
    })
  })

  describe('por dentro (incluirImpostoNaBase: true)', () => {
    it('1000 / (1 − 0.18) × 0.18 — base e imposto arredondados a 2 casas', () => {
      // base = 1000 ÷ 0.82 = 1219.512195...
      // imposto = 1219.512195... × 0.18 = 219.512195...
      // toMoney arredonda HALF_UP: 219.51
      const r = calcIcms({ valorProduto: '1000', aliquota: '0.18', incluirImpostoNaBase: true })
      expect(r.imposto.toMoney().toString()).toBe('219.51')
      expect(r.base.toMoney().toString()).toBe('1219.51')
    })

    it('por dentro tem imposto maior que por fora (mesma base, mesma alíquota)', () => {
      const porFora = calcIcms({ valorProduto: '1000', aliquota: '0.18' })
      const porDentro = calcIcms({
        valorProduto: '1000',
        aliquota: '0.18',
        incluirImpostoNaBase: true,
      })
      expect(porDentro.imposto.gt(porFora.imposto)).toBe(true)
    })

    it('1000 / (1 − 0.12) × 0.12 — arredondado a 2 casas', () => {
      // base = 1000 ÷ 0.88 = 1136.363636...
      // imposto = 1136.363636... × 0.12 = 136.363636...
      // toMoney: 136.36
      const r = calcIcms({ valorProduto: '1000', aliquota: '0.12', incluirImpostoNaBase: true })
      expect(r.imposto.toMoney().toString()).toBe('136.36')
    })
  })
})
