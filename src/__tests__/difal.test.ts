import { describe, it, expect } from 'vitest'
import { calcDifal } from '../calculadoras/difal.js'
import { Decimal } from '../precision/index.js'

/**
 * Regra — base única (não-contribuinte):
 *   icmsOrigem  = valorOperacao × aliquotaInterestadual
 *   baseDifal   = valorOperacao
 *   icmsDestino = baseDifal × (aliquotaInternaDestino + fecop)
 *   difal       = icmsDestino − icmsOrigem
 *
 * Regra — base dupla (contribuinte, LC 190/2022):
 *   icmsOrigem  = valorOperacao × aliquotaInterestadual
 *   baseDifal   = (valorOperacao − icmsOrigem) ÷ (1 − aliquotaInternaDestino − fecop)
 *   icmsDestino = baseDifal × (aliquotaInternaDestino + fecop)
 *   difal       = icmsDestino − icmsOrigem
 */
describe('calcDifal', () => {
  describe('base única (destinatarioContribuinte: false)', () => {
    it('1000, inter 12%, interna 18% → difal = 60', () => {
      // icmsOrigem = 120, icmsDestino = 180, difal = 60
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
      })
      expect(r.icmsOrigem.toString()).toBe('120')
      expect(r.baseDifal.toString()).toBe('1000')
      expect(r.icmsDestino.toString()).toBe('180')
      expect(r.difal.toString()).toBe('60')
    })

    it('com FECOP 2%: aliquotaInternaEfetiva = 0.20 → difal = 80', () => {
      // icmsDestino = 1000 × 0.20 = 200, difal = 200 − 120 = 80
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        fecop: '0.02',
      })
      expect(r.icmsDestino.toString()).toBe('200')
      expect(r.difal.toString()).toBe('80')
    })

    it('alíquotas iguais (inter = interna) → difal zero', () => {
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.18',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
      })
      expect(r.difal.isZero()).toBe(true)
    })
  })

  describe('base dupla (destinatarioContribuinte: true, LC 190/2022)', () => {
    it('1000, inter 12%, interna 18% → baseDifal > 1000', () => {
      // icmsOrigem = 120
      // baseDifal = (1000 − 120) ÷ (1 − 0.18) = 880 ÷ 0.82 = 1073.17073...
      // icmsDestino = 1073.17073... × 0.18 = 193.17073...
      // difal = 193.17073... − 120 = 73.17073...
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: true,
      })
      expect(r.icmsOrigem.toString()).toBe('120')
      expect(r.baseDifal.toMoney().toString()).toBe('1073.17')
      expect(r.icmsDestino.toMoney().toString()).toBe('193.17')
      expect(r.difal.toMoney().toString()).toBe('73.17')
    })

    it('base dupla tem difal maior que base única — mesmos parâmetros', () => {
      const params = {
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
      }
      const baseUnica = calcDifal({ ...params, destinatarioContribuinte: false })
      const baseDupla = calcDifal({ ...params, destinatarioContribuinte: true })
      expect(baseDupla.difal.gt(baseUnica.difal)).toBe(true)
    })

    it('com FECOP 2% base dupla: 880 ÷ 0.80 = 1100, difal = 100', () => {
      // icmsOrigem = 120
      // aliquotaInternaEfetiva = 0.18 + 0.02 = 0.20
      // baseDifal = (1000 − 120) ÷ (1 − 0.20) = 880 ÷ 0.80 = 1100
      // icmsDestino = 1100 × 0.20 = 220
      // difal = 220 − 120 = 100
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: true,
        fecop: '0.02',
      })
      expect(r.baseDifal.toString()).toBe('1100')
      expect(r.icmsDestino.toString()).toBe('220')
      expect(r.difal.toString()).toBe('100')
    })
  })

  describe('edge cases', () => {
    it('fecop undefined equivale a zero', () => {
      const semFecop = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
      })
      const fecopZero = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        fecop: '0',
      })
      expect(semFecop.difal.toString()).toBe(fecopZero.difal.toString())
    })

    it('aceita Decimal como input', () => {
      const r = calcDifal({
        valorOperacao: Decimal.from('1000'),
        aliquotaInterestadual: Decimal.from('0.12'),
        aliquotaInternaDestino: Decimal.from('0.18'),
        destinatarioContribuinte: false,
      })
      expect(r.difal.toString()).toBe('60')
    })

    it('aceita number como input', () => {
      const r = calcDifal({
        valorOperacao: 1000,
        aliquotaInterestadual: 0.12,
        aliquotaInternaDestino: 0.18,
        destinatarioContribuinte: false,
      })
      expect(r.difal.toString()).toBe('60')
    })

    it('retorna instâncias de Decimal', () => {
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
      })
      expect(r.difal).toBeInstanceOf(Decimal)
      expect(r.icmsOrigem).toBeInstanceOf(Decimal)
      expect(r.icmsDestino).toBeInstanceOf(Decimal)
      expect(r.baseDifal).toBeInstanceOf(Decimal)
    })
  })
})
