import { describe, it, expect } from 'vitest'
import { calcIpi } from '../calculadoras/ipi.js'
import { Decimal } from '../precision/index.js'

/**
 * Testes unitarios — calcIpi
 *
 * Logica interna, edge cases, validacao de input, regressoes.
 * Exemplos pontuais de MOC/legislacao usam prefixo [MOC] no describe.
 *
 * NF-e real NUNCA vai aqui. Use nfe-ground-truth.test.ts (nota inteira).
 * Regras de validacao SEFAZ NUNCA vao aqui. Use sefaz-validation-rules.test.ts.
 *
 * Regra: IPI sempre por fora. imposto = valorProduto x aliquota.
 */
describe('calcIpi', () => {
  it('1000 × 0.10 = 100', () => {
    const r = calcIpi({ valorProduto: '1000', aliquota: '0.10' })
    expect(r.base.toString()).toBe('1000')
    expect(r.aliquota.toString()).toBe('0.1')
    expect(r.imposto.toString()).toBe('100')
  })

  it('2500 × 0.05 = 125', () => {
    const r = calcIpi({ valorProduto: '2500', aliquota: '0.05' })
    expect(r.imposto.toString()).toBe('125')
  })

  it('1500.75 × 0.10 = 150.075 — resultado exato sem arredondamento', () => {
    // A função retorna o valor exato. Quem chama arredonda conforme necessidade.
    const r = calcIpi({ valorProduto: '1500.75', aliquota: '0.10' })
    expect(r.imposto.toString()).toBe('150.075')
  })

  it('1500.75 × 0.10 arredondado a 2 casas (SEFAZ vIPI) = 150.08', () => {
    // 150.075 → HALF_UP → 150.08 (terceira casa é 5, arredonda para cima)
    const r = calcIpi({ valorProduto: '1500.75', aliquota: '0.10' })
    expect(r.imposto.toMoney().toString()).toBe('150.08')
  })

  it('199.99 × 0.10 = 19.999 — arredondado a 2 casas = 20', () => {
    // 19.999 → HALF_UP → 20
    const r = calcIpi({ valorProduto: '199.99', aliquota: '0.10' })
    expect(r.imposto.toString()).toBe('19.999')
    expect(r.imposto.toMoney().toString()).toBe('20')
  })

  it('aceita Decimal como input', () => {
    const r = calcIpi({ valorProduto: Decimal.from('3000'), aliquota: Decimal.from('0.15') })
    expect(r.imposto.toString()).toBe('450')
  })

  it('aceita number como input', () => {
    const r = calcIpi({ valorProduto: 1000, aliquota: 0.1 })
    expect(r.imposto.toString()).toBe('100')
  })

  it('alíquota zero — imposto zero', () => {
    const r = calcIpi({ valorProduto: '5000', aliquota: '0' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('base zero — imposto zero', () => {
    const r = calcIpi({ valorProduto: '0', aliquota: '0.10' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('retorna instâncias de Decimal', () => {
    const r = calcIpi({ valorProduto: '1000', aliquota: '0.10' })
    expect(r.base).toBeInstanceOf(Decimal)
    expect(r.imposto).toBeInstanceOf(Decimal)
    expect(r.aliquota).toBeInstanceOf(Decimal)
  })

  describe('audit trail', () => {
    it('2 steps (Base IPI + IPI)', () => {
      const r = calcIpi({ valorProduto: '1000', aliquota: '0.10' })
      expect(r.audit).toHaveLength(2)
      expect(r.audit[0].step).toBe('Base IPI')
      expect(r.audit[0].value).toBe('1000.00')
      expect(r.audit[1].step).toBe('IPI')
      expect(r.audit[1].formula).toBe('1000.00 × 0.1000')
      expect(r.audit[1].value).toBe('100.00')
    })
  })
})
