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

  describe('base reduzida (baseReduzida: true, CST 20)', () => {
    it('12.20 (base reduzida 95%), inter 12%, interna 18% → difal = 1.22', () => {
      // baseDifal = round(12.20 / 0.82) = 14.88
      // icmsOrigem = round(12.20 × 0.12) = 1.46
      // icmsDestino = round(14.88 × 0.18) = 2.68
      // difal = 2.68 - 1.46 = 1.22
      const r = calcDifal({
        valorOperacao: '12.20',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        baseReduzida: true,
      })
      expect(r.baseDifal.toString()).toBe('14.88')
      expect(r.icmsOrigem.toString()).toBe('1.46')
      expect(r.icmsDestino.toString()).toBe('2.68')
      expect(r.difal.toString()).toBe('1.22')
    })

    it('1000 com redução 50% (base 500), inter 12%, interna 18% → baseDifal > valorOperacao', () => {
      // baseDifal = round(500 / 0.82) = 609.76
      // icmsOrigem = round(500 × 0.12) = 60
      // icmsDestino = round(609.76 × 0.18) = 109.76
      // difal = 109.76 - 60 = 49.76
      const r = calcDifal({
        valorOperacao: '500',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        baseReduzida: true,
      })
      expect(r.baseDifal.toString()).toBe('609.76')
      expect(r.icmsOrigem.toString()).toBe('60')
      expect(r.icmsDestino.toString()).toBe('109.76')
      expect(r.difal.toString()).toBe('49.76')
    })

    it('intermediários são arredondados a 2 casas (campos XML)', () => {
      // 123.45 / 0.82 = 150.548780... → 150.55
      // 123.45 × 0.12 = 14.814 → 14.81
      // 150.55 × 0.18 = 27.099 → 27.10
      // difal = 27.10 - 14.81 = 12.29
      const r = calcDifal({
        valorOperacao: '123.45',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        baseReduzida: true,
      })
      expect(r.baseDifal.toString()).toBe('150.55')
      expect(r.icmsOrigem.toString()).toBe('14.81')
      expect(r.icmsDestino.toString()).toBe('27.1')
      expect(r.difal.toString()).toBe('12.29')
    })

    it('com FECOP 2%: aliquotaInternaEfetiva = 0.20', () => {
      // baseDifal = round(12.20 / 0.80) = 15.25
      // icmsOrigem = round(12.20 × 0.12) = 1.46
      // icmsDestino = round(15.25 × 0.20) = 3.05
      // difal = 3.05 - 1.46 = 1.59
      const r = calcDifal({
        valorOperacao: '12.20',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        baseReduzida: true,
        fecop: '0.02',
      })
      expect(r.baseDifal.toString()).toBe('15.25')
      expect(r.difal.toString()).toBe('1.59')
    })

    it('base reduzida com destinatarioContribuinte: true é ignorado (usa base dupla)', () => {
      // baseReduzida só se aplica quando destinatarioContribuinte = false
      // Com true, segue o modo base dupla LC 190/2022
      const comBaseReduzida = calcDifal({
        valorOperacao: '12.20',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: true,
        baseReduzida: true,
      })
      const semBaseReduzida = calcDifal({
        valorOperacao: '12.20',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: true,
      })
      expect(comBaseReduzida.difal.toString()).toBe(semBaseReduzida.difal.toString())
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

  describe('audit trail', () => {
    it('base unica sem FECOP: 4 steps', () => {
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
      })
      expect(r.audit).toHaveLength(4)
      expect(r.audit[0].step).toBe('ICMS Origem')
      expect(r.audit[0].value).toBe('120.00')
      expect(r.audit[1].step).toBe('Base DIFAL (única)')
      expect(r.audit[1].value).toBe('1000.00')
      expect(r.audit[2].step).toBe('ICMS Destino')
      expect(r.audit[2].value).toBe('180.00')
      expect(r.audit[3].step).toBe('DIFAL')
      expect(r.audit[3].value).toBe('60.00')
    })

    it('base dupla: step mostra formula de divisao', () => {
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: true,
      })
      const baseStep = r.audit.find((s) => s.step === 'Base DIFAL (dupla)')
      expect(baseStep).toBeDefined()
      expect(baseStep!.formula).toContain('/')
    })

    it('base reduzida: step mostra formula por dentro', () => {
      const r = calcDifal({
        valorOperacao: '12.20',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        baseReduzida: true,
      })
      const baseStep = r.audit.find((s) => s.step === 'Base DIFAL (reduzida, por dentro)')
      expect(baseStep).toBeDefined()
      expect(baseStep!.formula).toContain('/')
      expect(baseStep!.value).toBe('14.88')
    })

    it('com FECOP: step ALQ Interna Efetiva aparece primeiro', () => {
      const r = calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        fecop: '0.02',
      })
      expect(r.audit[0].step).toBe('ALQ Interna Efetiva')
      expect(r.audit[0].value).toBe('0.2000')
      expect(r.audit).toHaveLength(5)
    })
  })
})
