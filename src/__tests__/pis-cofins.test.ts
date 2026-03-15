import { describe, it, expect } from 'vitest'
import { calcPis, calcCofins } from '../calculadoras/pis-cofins.js'
import { Decimal } from '../precision/index.js'

/**
 * PIS: imposto = base × alíquota (por fora)
 * COFINS: imposto = base × alíquota (por fora)
 *
 * Alíquotas padrão (regime não cumulativo): PIS 1,65%, COFINS 7,60%.
 * Alíquotas regime cumulativo: PIS 0,65%, COFINS 3%.
 * Alíquota é informada pelo chamador.
 */

// ─── calcPis ────────────────────────────────────────────────────────────────

describe('calcPis', () => {
  it('126.08 × 0.0165 = 2.08028 → HALF_UP 2 casas → 2.08', () => {
    const r = calcPis({ base: '126.08', aliquota: '0.0165' })
    expect(r.base.toString()).toBe('126.08')
    expect(r.aliquota.toString()).toBe('0.0165')
    expect(r.imposto.toMoney().toString()).toBe('2.08')
  })

  it('31.93 × 0.0165 = 0.526845 → HALF_UP 2 casas → 0.53', () => {
    const r = calcPis({ base: '31.93', aliquota: '0.0165' })
    expect(r.imposto.toMoney().toString()).toBe('0.53')
  })

  it('21.06 × 0.0165 = 0.34749 → HALF_UP 2 casas → 0.35', () => {
    const r = calcPis({ base: '21.06', aliquota: '0.0165' })
    expect(r.imposto.toMoney().toString()).toBe('0.35')
  })

  it('222.12 × 0.0165 = 3.66498 → HALF_UP 2 casas → 3.66', () => {
    const r = calcPis({ base: '222.12', aliquota: '0.0165' })
    expect(r.imposto.toMoney().toString()).toBe('3.66')
  })

  it('432.32 × 0.0165 = 7.13328 → HALF_UP 2 casas → 7.13', () => {
    const r = calcPis({ base: '432.32', aliquota: '0.0165' })
    expect(r.imposto.toMoney().toString()).toBe('7.13')
  })

  it('243.90 × 0.0165 = 4.02435 → HALF_UP 2 casas → 4.02', () => {
    const r = calcPis({ base: '243.90', aliquota: '0.0165' })
    expect(r.imposto.toMoney().toString()).toBe('4.02')
  })

  it('alíquota zero → imposto zero', () => {
    const r = calcPis({ base: '10000', aliquota: '0' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('base zero → imposto zero', () => {
    const r = calcPis({ base: '0', aliquota: '0.0165' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('regime cumulativo: 1000 × 0.0065 = 6.50', () => {
    const r = calcPis({ base: '1000', aliquota: '0.0065' })
    expect(r.imposto.toMoney().toString()).toBe('6.5')
  })

  it('aceita Decimal como input', () => {
    const r = calcPis({ base: Decimal.from('126.08'), aliquota: Decimal.from('0.0165') })
    expect(r.imposto.toMoney().toString()).toBe('2.08')
  })

  it('aceita number como input', () => {
    const r = calcPis({ base: 1000, aliquota: 0.0165 })
    expect(r.imposto.toString()).toBe('16.5')
  })

  it('retorna instâncias de Decimal', () => {
    const r = calcPis({ base: '1000', aliquota: '0.0165' })
    expect(r.base).toBeInstanceOf(Decimal)
    expect(r.imposto).toBeInstanceOf(Decimal)
    expect(r.aliquota).toBeInstanceOf(Decimal)
  })
})

// ─── calcCofins ─────────────────────────────────────────────────────────────

describe('calcCofins', () => {
  it('126.08 × 0.076 = 9.58208 → HALF_UP 2 casas → 9.58', () => {
    const r = calcCofins({ base: '126.08', aliquota: '0.076' })
    expect(r.base.toString()).toBe('126.08')
    expect(r.aliquota.toString()).toBe('0.076')
    expect(r.imposto.toMoney().toString()).toBe('9.58')
  })

  it('31.93 × 0.076 = 2.42668 → HALF_UP 2 casas → 2.43', () => {
    const r = calcCofins({ base: '31.93', aliquota: '0.076' })
    expect(r.imposto.toMoney().toString()).toBe('2.43')
  })

  it('21.06 × 0.076 = 1.60056 → HALF_UP 2 casas → 1.60', () => {
    const r = calcCofins({ base: '21.06', aliquota: '0.076' })
    expect(r.imposto.toMoney().toString()).toBe('1.6')
  })

  it('222.12 × 0.076 = 16.88112 → HALF_UP 2 casas → 16.88', () => {
    const r = calcCofins({ base: '222.12', aliquota: '0.076' })
    expect(r.imposto.toMoney().toString()).toBe('16.88')
  })

  it('432.32 × 0.076 = 32.85632 → HALF_UP 2 casas → 32.86', () => {
    const r = calcCofins({ base: '432.32', aliquota: '0.076' })
    expect(r.imposto.toMoney().toString()).toBe('32.86')
  })

  it('243.90 × 0.076 = 18.5364 → HALF_UP 2 casas → 18.54', () => {
    const r = calcCofins({ base: '243.90', aliquota: '0.076' })
    expect(r.imposto.toMoney().toString()).toBe('18.54')
  })

  it('alíquota zero → imposto zero', () => {
    const r = calcCofins({ base: '10000', aliquota: '0' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('base zero → imposto zero', () => {
    const r = calcCofins({ base: '0', aliquota: '0.076' })
    expect(r.imposto.isZero()).toBe(true)
  })

  it('regime cumulativo: 1000 × 0.03 = 30', () => {
    const r = calcCofins({ base: '1000', aliquota: '0.03' })
    expect(r.imposto.toString()).toBe('30')
  })

  it('aceita Decimal como input', () => {
    const r = calcCofins({ base: Decimal.from('126.08'), aliquota: Decimal.from('0.076') })
    expect(r.imposto.toMoney().toString()).toBe('9.58')
  })

  it('aceita number como input', () => {
    const r = calcCofins({ base: 1000, aliquota: 0.076 })
    expect(r.imposto.toString()).toBe('76')
  })

  it('retorna instâncias de Decimal', () => {
    const r = calcCofins({ base: '1000', aliquota: '0.076' })
    expect(r.base).toBeInstanceOf(Decimal)
    expect(r.imposto).toBeInstanceOf(Decimal)
    expect(r.aliquota).toBeInstanceOf(Decimal)
  })
})

// ─── PIS + COFINS combinados ────────────────────────────────────────────────

describe('PIS + COFINS combinados', () => {
  it('mesma base — impostos independentes e somáveis', () => {
    const base = '126.08'
    const pis = calcPis({ base, aliquota: '0.0165' })
    const cofins = calcCofins({ base, aliquota: '0.076' })
    // 2.08028 + 9.58208 = 11.66236 → HALF_UP → 11.66
    expect(pis.imposto.add(cofins.imposto).toMoney().toString()).toBe('11.66')
  })
})

// ─── audit trail ────────────────────────────────────────────────────────────

describe('audit trail', () => {
  it('calcPis: 2 steps (Base PIS + PIS)', () => {
    const r = calcPis({ base: '126.08', aliquota: '0.0165' })
    expect(r.audit).toHaveLength(2)
    expect(r.audit[0].step).toBe('Base PIS')
    expect(r.audit[0].value).toBe('126.08')
    expect(r.audit[1].step).toBe('PIS')
    expect(r.audit[1].formula).toBe('126.08 × 0.0165')
    expect(r.audit[1].value).toBe('2.08')
  })

  it('calcCofins: 2 steps (Base COFINS + COFINS)', () => {
    const r = calcCofins({ base: '126.08', aliquota: '0.076' })
    expect(r.audit).toHaveLength(2)
    expect(r.audit[0].step).toBe('Base COFINS')
    expect(r.audit[0].value).toBe('126.08')
    expect(r.audit[1].step).toBe('COFINS')
    expect(r.audit[1].formula).toBe('126.08 × 0.0760')
    expect(r.audit[1].value).toBe('9.58')
  })
})
