import { describe, it, expect } from 'vitest'
import { calcCbs, calcIbs } from '../calculadoras/cbs-ibs.js'
import { Decimal } from '../precision/index.js'

/**
 * Testes unitarios — calcCbs / calcIbs
 *
 * Logica interna, edge cases, validacao de input, regressoes.
 * Exemplos pontuais de MOC/legislacao usam prefixo [MOC] no describe.
 *
 * NF-e real NUNCA vai aqui. Use nfe-ground-truth.test.ts (nota inteira).
 * Regras de validacao SEFAZ NUNCA vao aqui. Use sefaz-validation-rules.test.ts.
 *
 * CBS (LC 214/2025, substitui PIS/COFINS): imposto = base x aliquota
 * IBS (LC 214/2025, substitui ICMS/ISS): imposto = base x aliquota
 * Aliquotas nao sao hardcoded, variam por setor/ano.
 */
describe('calcCbs', () => {
  it('1000 × 0.009 = 9', () => {
    const r = calcCbs({ base: '1000', aliquota: '0.009' })
    expect(r.base.toString()).toBe('1000')
    expect(r.aliquota.toString()).toBe('0.009')
    expect(r.imposto.toString()).toBe('9')
  })

  it('2500.50 × 0.009 = 22.5045 — resultado exato', () => {
    const r = calcCbs({ base: '2500.50', aliquota: '0.009' })
    expect(r.imposto.toString()).toBe('22.5045')
  })

  it('2500.50 × 0.009 arredondado a 2 casas = 22.50 → canonical 22.5', () => {
    // 22.5045 → HALF_UP → terceira casa é 4, arredonda para baixo → 22.50 → canonical '22.5'
    const r = calcCbs({ base: '2500.50', aliquota: '0.009' })
    expect(r.imposto.toMoney().toString()).toBe('22.5')
  })

  it('alíquota zero — imposto zero', () => {
    const r = calcCbs({ base: '10000', aliquota: '0' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('base zero — imposto zero', () => {
    const r = calcCbs({ base: '0', aliquota: '0.009' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('aceita Decimal como input', () => {
    const r = calcCbs({ base: Decimal.from('5000'), aliquota: Decimal.from('0.009') })
    expect(r.imposto.toString()).toBe('45')
  })

  it('aceita number como input', () => {
    const r = calcCbs({ base: 1000, aliquota: 0.009 })
    expect(r.imposto.toString()).toBe('9')
  })

  it('retorna instâncias de Decimal', () => {
    const r = calcCbs({ base: '1000', aliquota: '0.009' })
    expect(r.base).toBeInstanceOf(Decimal)
    expect(r.imposto).toBeInstanceOf(Decimal)
    expect(r.aliquota).toBeInstanceOf(Decimal)
  })
})

describe('calcIbs', () => {
  it('1000 × 0.178 = 178', () => {
    const r = calcIbs({ base: '1000', aliquota: '0.178' })
    expect(r.base.toString()).toBe('1000')
    expect(r.aliquota.toString()).toBe('0.178')
    expect(r.imposto.toString()).toBe('178')
  })

  it('1000 × 0.001 (alíquota municipal mínima) = 1', () => {
    const r = calcIbs({ base: '1000', aliquota: '0.001' })
    expect(r.imposto.toString()).toBe('1')
  })

  it('alíquota zero — imposto zero', () => {
    const r = calcIbs({ base: '50000', aliquota: '0' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('base zero — imposto zero', () => {
    const r = calcIbs({ base: '0', aliquota: '0.178' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('aceita Decimal como input', () => {
    const r = calcIbs({ base: Decimal.from('2000'), aliquota: Decimal.from('0.178') })
    expect(r.imposto.toString()).toBe('356')
  })

  it('aceita number como input', () => {
    const r = calcIbs({ base: 1000, aliquota: 0.178 })
    expect(r.imposto.toString()).toBe('178')
  })

  it('CBS + IBS sobre mesma base — impostos independentes e somáveis', () => {
    // CBS: 10000 × 0.009 = 90
    // IBS: 10000 × 0.178 = 1780
    // total: 1870
    const base = '10000'
    const cbs = calcCbs({ base, aliquota: '0.009' })
    const ibs = calcIbs({ base, aliquota: '0.178' })
    expect(cbs.imposto.add(ibs.imposto).toString()).toBe('1870')
  })

  it('retorna instâncias de Decimal', () => {
    const r = calcIbs({ base: '1000', aliquota: '0.178' })
    expect(r.base).toBeInstanceOf(Decimal)
    expect(r.imposto).toBeInstanceOf(Decimal)
    expect(r.aliquota).toBeInstanceOf(Decimal)
  })
})

describe('audit trail', () => {
  it('calcCbs: 2 steps (Base CBS + CBS)', () => {
    const r = calcCbs({ base: '1000', aliquota: '0.009' })
    expect(r.audit).toHaveLength(2)
    expect(r.audit[0].step).toBe('Base CBS')
    expect(r.audit[0].value).toBe('1000.00')
    expect(r.audit[1].step).toBe('CBS')
    expect(r.audit[1].formula).toBe('1000.00 × 0.0090')
    expect(r.audit[1].value).toBe('9.00')
  })

  it('calcIbs: 2 steps (Base IBS + IBS)', () => {
    const r = calcIbs({ base: '1000', aliquota: '0.178' })
    expect(r.audit).toHaveLength(2)
    expect(r.audit[0].step).toBe('Base IBS')
    expect(r.audit[0].value).toBe('1000.00')
    expect(r.audit[1].step).toBe('IBS')
    expect(r.audit[1].formula).toBe('1000.00 × 0.1780')
    expect(r.audit[1].value).toBe('178.00')
  })
})
