import { describe, it, expect } from 'vitest'
import { calcMvaAjustada } from '../calculadoras/mva.js'
import { Decimal } from '../precision/index.js'

/**
 * Regra EC 87/2015:
 * aliqInternaEfetiva = aliquotaInterna + (fecop ?? 0)
 * mvaAjustada = ((1 + mvaOriginal) × (1 − aliquotaInterestadual)) ÷ (1 − aliqInternaEfetiva) − 1
 *
 * Sem FECOP: aliqInternaEfetiva = aliquotaInterna
 * Com FECOP: aliqInternaEfetiva = aliquotaInterna + fecop
 */
describe('calcMvaAjustada', () => {
  it('MVA 40%, inter 12%, interna 18% → mvaAjustada arredondada a 4 casas', () => {
    // (1.40 × 0.88) ÷ 0.82 − 1 = 1.232 ÷ 0.82 − 1 = 1.50243902... − 1 = 0.50243902...
    // toRate (4 casas HALF_UP): 5ª casa = 3, arredonda para baixo → 0.5024
    const r = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.12',
      aliquotaInterna: '0.18',
    })
    expect(r.mvaOriginal.toString()).toBe('0.4')
    expect(r.mvaAjustada.toRate().toString()).toBe('0.5024')
  })

  it('quando alíquotas são iguais, mvaAjustada = mvaOriginal', () => {
    // (1 + mva) × (1 − 0.18) ÷ (1 − 0.18) − 1 = (1 + mva) − 1 = mva
    const r = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.18',
      aliquotaInterna: '0.18',
    })
    expect(r.mvaAjustada.toString()).toBe('0.4')
  })

  it('com FECOP 2%: alíquota interna 0.17 + 0.02 = 0.19', () => {
    // (1.40 × 0.88) ÷ 0.81 − 1 = 1.232 ÷ 0.81 − 1 = 1.520987... − 1 = 0.520987...
    // toRate (4 casas HALF_UP): 5ª casa = 8, arredonda para cima → 0.5210 → canonical '0.521'
    const r = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.12',
      aliquotaInterna: '0.17',
      fecop: '0.02',
    })
    expect(r.mvaAjustada.toRate().toString()).toBe('0.521')
  })

  it('alíquota interestadual 4% (produtos importados → ICMS 4%)', () => {
    // (1.40 × 0.96) ÷ 0.82 − 1 = 1.344 ÷ 0.82 − 1 = 1.639024... − 1 = 0.639024...
    // toRate (4 casas HALF_UP): 5ª casa = 2, arredonda para baixo → 0.6390 → canonical '0.639'
    const r = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.04',
      aliquotaInterna: '0.18',
    })
    expect(r.mvaAjustada.toRate().toString()).toBe('0.639')
  })

  it('fecop undefined comporta igual a fecop zero', () => {
    const semFecop = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.12',
      aliquotaInterna: '0.18',
    })
    const fecopZero = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.12',
      aliquotaInterna: '0.18',
      fecop: '0',
    })
    expect(semFecop.mvaAjustada.toString()).toBe(fecopZero.mvaAjustada.toString())
  })

  it('aceita Decimal como input', () => {
    const r = calcMvaAjustada({
      mvaOriginal: Decimal.from('0.40'),
      aliquotaInterestadual: Decimal.from('0.12'),
      aliquotaInterna: Decimal.from('0.18'),
    })
    expect(r.mvaAjustada.toRate().toString()).toBe('0.5024')
  })

  it('aceita number como input', () => {
    const r = calcMvaAjustada({
      mvaOriginal: 0.4,
      aliquotaInterestadual: 0.12,
      aliquotaInterna: 0.18,
    })
    expect(r.mvaAjustada.toRate().toString()).toBe('0.5024')
  })

  it('retorna instâncias de Decimal', () => {
    const r = calcMvaAjustada({
      mvaOriginal: '0.40',
      aliquotaInterestadual: '0.12',
      aliquotaInterna: '0.18',
    })
    expect(r.mvaAjustada).toBeInstanceOf(Decimal)
    expect(r.mvaOriginal).toBeInstanceOf(Decimal)
  })

  describe('audit trail', () => {
    it('sem FECOP: 1 step (MVA Ajustada)', () => {
      const r = calcMvaAjustada({
        mvaOriginal: '0.40',
        aliquotaInterestadual: '0.12',
        aliquotaInterna: '0.18',
      })
      expect(r.audit).toHaveLength(1)
      expect(r.audit[0].step).toBe('MVA Ajustada')
      expect(r.audit[0].formula).toContain('0.4000')
      expect(r.audit[0].formula).toContain('0.1200')
      expect(r.audit[0].formula).toContain('0.1800')
    })

    it('com FECOP: 2 steps (ALQ Interna Efetiva + MVA Ajustada)', () => {
      const r = calcMvaAjustada({
        mvaOriginal: '0.40',
        aliquotaInterestadual: '0.12',
        aliquotaInterna: '0.17',
        fecop: '0.02',
      })
      expect(r.audit).toHaveLength(2)
      expect(r.audit[0].step).toBe('ALQ Interna Efetiva')
      expect(r.audit[0].formula).toContain('FECOP')
      expect(r.audit[0].value).toBe('0.1900')
      expect(r.audit[1].step).toBe('MVA Ajustada')
    })
  })
})
