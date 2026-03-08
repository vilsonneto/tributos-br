import { describe, it, expect } from 'vitest'
import { calcSt } from '../calculadoras/st.js'
import { Decimal } from '../precision/index.js'

/**
 * Regra ICMS-ST:
 * 1. baseIcmsEfetiva = baseIcms × (1 − reducaoBase)  [ou baseIcms se sem redução]
 * 2. icmsProprio = baseIcmsEfetiva × aliquotaIcms
 * 3. baseStMva = (baseIcms + valorIpi) × (1 + mva)   [usa baseIcms original, não reduzida]
 * 4. baseSt = MAX(baseStMva, pautaFiscal × quantidade) [ou baseStMva se sem pauta]
 * 5. baseStEfetiva = baseSt × (1 − reducaoBaseSt)     [ou baseSt se sem redução ST]
 * 6. aliquotaStEfetiva = aliquotaSt + (fecop ?? 0)
 * 7. icmsSt = baseStEfetiva × aliquotaStEfetiva − icmsProprio
 */
describe('calcSt', () => {
  describe('caso base', () => {
    it('baseIcms=1000, aliquotaIcms=12%, mva=40%, aliquotaSt=18%', () => {
      // icmsProprio = 1000 × 0.12 = 120
      // baseStMva = 1000 × 1.40 = 1400
      // icmsSt = 1400 × 0.18 − 120 = 252 − 120 = 132
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
      })
      expect(r.icmsProprio.toString()).toBe('120')
      expect(r.baseSt.toString()).toBe('1400')
      expect(r.icmsSt.toString()).toBe('132')
      expect(r.mvaUtilizada.toString()).toBe('0.4')
    })

    it('com IPI: baseStMva = (baseIcms + IPI) × (1 + mva)', () => {
      // baseStMva = (1000 + 100) × 1.40 = 1100 × 1.40 = 1540
      // icmsProprio = 1000 × 0.12 = 120
      // icmsSt = 1540 × 0.18 − 120 = 277.2 − 120 = 157.2
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        valorIpi: '100',
      })
      expect(r.baseSt.toString()).toBe('1540')
      expect(r.icmsSt.toString()).toBe('157.2')
    })

    it('valorIpi undefined equivale a zero', () => {
      const semIpi = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
      })
      const comIpiZero = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        valorIpi: '0',
      })
      expect(semIpi.baseSt.toString()).toBe(comIpiZero.baseSt.toString())
      expect(semIpi.icmsSt.toString()).toBe(comIpiZero.icmsSt.toString())
    })
  })

  describe('redução de base', () => {
    it('reducaoBase 10%: baseIcmsEfetiva reduzida, baseStMva usa original', () => {
      // baseIcmsEfetiva = 1000 × (1 − 0.10) = 900
      // icmsProprio = 900 × 0.12 = 108
      // baseStMva = 1000 × 1.40 = 1400  ← usa baseIcms original, não 900
      // icmsSt = 1400 × 0.18 − 108 = 252 − 108 = 144
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        reducaoBase: '0.10',
      })
      expect(r.baseIcms.toString()).toBe('900')
      expect(r.icmsProprio.toString()).toBe('108')
      expect(r.baseSt.toString()).toBe('1400')
      expect(r.icmsSt.toString()).toBe('144')
    })

    it('reducaoBaseSt 10%: aplica redução sobre baseSt antes de calcular icmsSt', () => {
      // baseStMva = 1000 × 1.40 = 1400
      // baseStEfetiva = 1400 × (1 − 0.10) = 1260
      // icmsSt = 1260 × 0.18 − 120 = 226.8 − 120 = 106.8
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        reducaoBaseSt: '0.10',
      })
      expect(r.icmsSt.toString()).toBe('106.8')
    })
  })

  describe('pauta fiscal', () => {
    it('pauta maior que MVA: baseSt = pautaFiscal × quantidade', () => {
      // baseStMva = 1000 × 1.40 = 1400
      // basePauta = 200 × 10 = 2000
      // baseSt = MAX(1400, 2000) = 2000
      // icmsSt = 2000 × 0.18 − 120 = 360 − 120 = 240
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        pautaFiscal: '200',
        quantidade: '10',
      })
      expect(r.baseSt.toString()).toBe('2000')
      expect(r.icmsSt.toString()).toBe('240')
    })

    it('pauta menor que MVA: baseSt = baseStMva', () => {
      // baseStMva = 1000 × 1.40 = 1400
      // basePauta = 50 × 10 = 500
      // baseSt = MAX(1400, 500) = 1400
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        pautaFiscal: '50',
        quantidade: '10',
      })
      expect(r.baseSt.toString()).toBe('1400')
    })
  })

  describe('FECOP', () => {
    it('fecop 2%: aliquotaStEfetiva = 0.18 + 0.02 = 0.20', () => {
      // icmsSt = 1400 × 0.20 − 120 = 280 − 120 = 160
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        fecop: '0.02',
      })
      expect(r.icmsSt.toString()).toBe('160')
    })
  })

  describe('edge cases', () => {
    it('mva zero: baseSt = baseIcms, icmsSt = diferença de alíquotas', () => {
      // baseStMva = 1000 × (1 + 0) = 1000
      // icmsSt = 1000 × 0.18 − 120 = 180 − 120 = 60
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0',
        aliquotaSt: '0.18',
      })
      expect(r.baseSt.toString()).toBe('1000')
      expect(r.icmsSt.toString()).toBe('60')
    })

    it('aceita Decimal como input', () => {
      const r = calcSt({
        baseIcms: Decimal.from('1000'),
        aliquotaIcms: Decimal.from('0.12'),
        mva: Decimal.from('0.40'),
        aliquotaSt: Decimal.from('0.18'),
      })
      expect(r.icmsSt.toString()).toBe('132')
    })

    it('aceita number como input', () => {
      const r = calcSt({
        baseIcms: 1000,
        aliquotaIcms: 0.12,
        mva: 0.4,
        aliquotaSt: 0.18,
      })
      expect(r.icmsSt.toString()).toBe('132')
    })

    it('retorna instâncias de Decimal', () => {
      const r = calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
      })
      expect(r.baseIcms).toBeInstanceOf(Decimal)
      expect(r.icmsProprio).toBeInstanceOf(Decimal)
      expect(r.baseSt).toBeInstanceOf(Decimal)
      expect(r.icmsSt).toBeInstanceOf(Decimal)
      expect(r.mvaUtilizada).toBeInstanceOf(Decimal)
    })
  })
})
