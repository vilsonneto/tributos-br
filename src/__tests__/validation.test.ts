import { describe, it, expect } from 'vitest'
import { calcIcms } from '../calculadoras/icms.js'
import { calcIpi } from '../calculadoras/ipi.js'
import { calcSt } from '../calculadoras/st.js'
import { calcDifal } from '../calculadoras/difal.js'
import { calcMvaAjustada } from '../calculadoras/mva.js'
import { calcCbs, calcIbs } from '../calculadoras/cbs-ibs.js'
import { calcPis, calcCofins } from '../calculadoras/pis-cofins.js'
import { TributoError, TributoErrorCode } from '../calculadoras/errors.js'

function expectTributoError(fn: () => void, code: TributoErrorCode, field?: string): void {
  try {
    fn()
    expect.unreachable('deveria ter lancado TributoError')
  } catch (err) {
    expect(err).toBeInstanceOf(TributoError)
    const e = err as TributoError
    expect(e.code).toBe(code)
    if (field) expect(e.details.field).toBe(field)
  }
}

// ─── ALIQUOTA_ACIMA_DE_1 ────────────────────────────────────────────────────

describe(TributoErrorCode.ALIQUOTA_ACIMA_DE_1, () => {
  it('calcIcms: aliquota 18 ao inves de 0.18', () => {
    expectTributoError(
      () => calcIcms({ valorProduto: '1000', aliquota: 18 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'aliquota',
    )
  })

  it('calcIcms: fcp > 1', () => {
    expectTributoError(
      () => calcIcms({ valorProduto: '1000', aliquota: '0.18', fcp: 2 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'fcp',
    )
  })

  it('calcIpi: aliquota 10', () => {
    expectTributoError(
      () => calcIpi({ valorProduto: '500', aliquota: 10 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
    )
  })

  it('calcSt: aliquotaIcms 12', () => {
    expectTributoError(
      () => calcSt({ baseIcms: '1000', aliquotaIcms: 12, mva: '0.40', aliquotaSt: '0.18' }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'aliquotaIcms',
    )
  })

  it('calcSt: aliquotaSt 18', () => {
    expectTributoError(
      () => calcSt({ baseIcms: '1000', aliquotaIcms: '0.12', mva: '0.40', aliquotaSt: 18 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'aliquotaSt',
    )
  })

  it('calcSt: reducaoBase 10', () => {
    expectTributoError(
      () =>
        calcSt({
          baseIcms: '1000',
          aliquotaIcms: '0.12',
          mva: '0.40',
          aliquotaSt: '0.18',
          reducaoBase: 10,
        }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'reducaoBase',
    )
  })

  it('calcDifal: aliquotaInterestadual 12', () => {
    expectTributoError(
      () =>
        calcDifal({
          valorOperacao: '1000',
          aliquotaInterestadual: 12,
          aliquotaInternaDestino: '0.18',
          destinatarioContribuinte: false,
        }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'aliquotaInterestadual',
    )
  })

  it('calcMvaAjustada: aliquotaInterna 18', () => {
    expectTributoError(
      () =>
        calcMvaAjustada({
          mvaOriginal: '0.40',
          aliquotaInterestadual: '0.12',
          aliquotaInterna: 18,
        }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
      'aliquotaInterna',
    )
  })

  it('calcCbs: aliquota 9', () => {
    expectTributoError(
      () => calcCbs({ base: '1000', aliquota: 9 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
    )
  })

  it('calcIbs: aliquota 17.8', () => {
    expectTributoError(
      () => calcIbs({ base: '1000', aliquota: 17.8 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
    )
  })

  it('calcPis: aliquota 1.65', () => {
    expectTributoError(
      () => calcPis({ base: '1000', aliquota: 1.65 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
    )
  })

  it('calcCofins: aliquota 7.6', () => {
    expectTributoError(
      () => calcCofins({ base: '1000', aliquota: 7.6 }),
      TributoErrorCode.ALIQUOTA_ACIMA_DE_1,
    )
  })

  // Boundaries
  it('aliquota exatamente 1 nao rejeita (> 1, nao >= 1)', () => {
    expect(() => calcIcms({ valorProduto: '1000', aliquota: '1' })).not.toThrow()
  })

  it('MVA > 1 e valido (nao valida com validarAliquota)', () => {
    expect(() =>
      calcSt({ baseIcms: '1000', aliquotaIcms: '0.12', mva: '1.50', aliquotaSt: '0.18' }),
    ).not.toThrow()
  })
})

// ─── ALIQUOTA_NEGATIVA ──────────────────────────────────────────────────────

describe(TributoErrorCode.ALIQUOTA_NEGATIVA, () => {
  it('calcIcms: aliquota -0.18', () => {
    expectTributoError(
      () => calcIcms({ valorProduto: '1000', aliquota: '-0.18' }),
      TributoErrorCode.ALIQUOTA_NEGATIVA,
      'aliquota',
    )
  })

  it('calcSt: reducaoBase negativa', () => {
    expectTributoError(
      () =>
        calcSt({
          baseIcms: '1000',
          aliquotaIcms: '0.12',
          mva: '0.40',
          aliquotaSt: '0.18',
          reducaoBase: '-0.10',
        }),
      TributoErrorCode.ALIQUOTA_NEGATIVA,
      'reducaoBase',
    )
  })

  it('calcDifal: fecop negativa', () => {
    expectTributoError(
      () =>
        calcDifal({
          valorOperacao: '1000',
          aliquotaInterestadual: '0.12',
          aliquotaInternaDestino: '0.18',
          destinatarioContribuinte: false,
          fecop: '-0.02',
        }),
      TributoErrorCode.ALIQUOTA_NEGATIVA,
      'fecop',
    )
  })

  // Boundary
  it('aliquota 0 nao rejeita', () => {
    expect(() => calcIcms({ valorProduto: '1000', aliquota: '0' })).not.toThrow()
  })
})

// ─── VALOR_NEGATIVO ─────────────────────────────────────────────────────────

describe(TributoErrorCode.VALOR_NEGATIVO, () => {
  it('calcIcms: valorProduto negativo', () => {
    expectTributoError(
      () => calcIcms({ valorProduto: '-500', aliquota: '0.18' }),
      TributoErrorCode.VALOR_NEGATIVO,
      'valorProduto',
    )
  })

  it('calcSt: baseIcms negativa', () => {
    expectTributoError(
      () => calcSt({ baseIcms: '-1000', aliquotaIcms: '0.12', mva: '0.40', aliquotaSt: '0.18' }),
      TributoErrorCode.VALOR_NEGATIVO,
      'baseIcms',
    )
  })

  it('calcSt: valorIpi negativo', () => {
    expectTributoError(
      () =>
        calcSt({
          baseIcms: '1000',
          aliquotaIcms: '0.12',
          mva: '0.40',
          aliquotaSt: '0.18',
          valorIpi: '-50',
        }),
      TributoErrorCode.VALOR_NEGATIVO,
      'valorIpi',
    )
  })

  it('calcDifal: valorOperacao negativo', () => {
    expectTributoError(
      () =>
        calcDifal({
          valorOperacao: '-1000',
          aliquotaInterestadual: '0.12',
          aliquotaInternaDestino: '0.18',
          destinatarioContribuinte: false,
        }),
      TributoErrorCode.VALOR_NEGATIVO,
      'valorOperacao',
    )
  })

  it('calcCbs: base negativa', () => {
    expectTributoError(
      () => calcCbs({ base: '-1000', aliquota: '0.009' }),
      TributoErrorCode.VALOR_NEGATIVO,
      'base',
    )
  })

  it('calcPis: base negativa', () => {
    expectTributoError(
      () => calcPis({ base: '-100', aliquota: '0.0165' }),
      TributoErrorCode.VALOR_NEGATIVO,
      'base',
    )
  })

  // Boundary
  it('valor 0 nao rejeita', () => {
    expect(() => calcIcms({ valorProduto: '0', aliquota: '0.18' })).not.toThrow()
  })
})

// ─── PAUTA_SEM_QUANTIDADE ───────────────────────────────────────────────────

describe(TributoErrorCode.PAUTA_SEM_QUANTIDADE, () => {
  it('calcSt: pautaFiscal sem quantidade', () => {
    expectTributoError(
      () =>
        calcSt({
          baseIcms: '1000',
          aliquotaIcms: '0.12',
          mva: '0.40',
          aliquotaSt: '0.18',
          pautaFiscal: '200',
        }),
      TributoErrorCode.PAUTA_SEM_QUANTIDADE,
      'pautaFiscal',
    )
  })

  it('pautaFiscal + quantidade juntos nao rejeita', () => {
    expect(() =>
      calcSt({
        baseIcms: '1000',
        aliquotaIcms: '0.12',
        mva: '0.40',
        aliquotaSt: '0.18',
        pautaFiscal: '200',
        quantidade: '10',
      }),
    ).not.toThrow()
  })

  it('sem pautaFiscal nao rejeita', () => {
    expect(() =>
      calcSt({ baseIcms: '1000', aliquotaIcms: '0.12', mva: '0.40', aliquotaSt: '0.18' }),
    ).not.toThrow()
  })
})

// ─── BASE_REDUZIDA_COM_CONTRIBUINTE ─────────────────────────────────────────

describe(TributoErrorCode.BASE_REDUZIDA_COM_CONTRIBUINTE, () => {
  it('calcDifal: baseReduzida=true + destinatarioContribuinte=true', () => {
    expectTributoError(
      () =>
        calcDifal({
          valorOperacao: '12.20',
          aliquotaInterestadual: '0.12',
          aliquotaInternaDestino: '0.18',
          destinatarioContribuinte: true,
          baseReduzida: true,
        }),
      TributoErrorCode.BASE_REDUZIDA_COM_CONTRIBUINTE,
      'baseReduzida',
    )
  })

  it('baseReduzida=true + contribuinte=false nao rejeita', () => {
    expect(() =>
      calcDifal({
        valorOperacao: '12.20',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '0.18',
        destinatarioContribuinte: false,
        baseReduzida: true,
      }),
    ).not.toThrow()
  })
})

// ─── DIVISAO_POR_ZERO_ALIQUOTA ──────────────────────────────────────────────

describe(TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA, () => {
  it('calcIcms: aliquota=1 + incluirImpostoNaBase=true', () => {
    expectTributoError(
      () => calcIcms({ valorProduto: '1000', aliquota: '1', incluirImpostoNaBase: true }),
      TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA,
      'aliquota',
    )
  })

  it('calcIcms: aliquota=1 sem incluirImpostoNaBase nao rejeita', () => {
    expect(() => calcIcms({ valorProduto: '1000', aliquota: '1' })).not.toThrow()
  })

  it('calcMvaAjustada: aliquotaInterna=1 (denominador zero)', () => {
    expectTributoError(
      () =>
        calcMvaAjustada({
          mvaOriginal: '0.40',
          aliquotaInterestadual: '0.12',
          aliquotaInterna: '1',
        }),
      TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA,
    )
  })

  it('calcMvaAjustada: aliquotaInterna + fecop = 1', () => {
    expectTributoError(
      () =>
        calcMvaAjustada({
          mvaOriginal: '0.40',
          aliquotaInterestadual: '0.12',
          aliquotaInterna: '0.98',
          fecop: '0.02',
        }),
      TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA,
    )
  })

  it('calcDifal base dupla: aliquotaInternaDestino=1', () => {
    expectTributoError(
      () =>
        calcDifal({
          valorOperacao: '1000',
          aliquotaInterestadual: '0.12',
          aliquotaInternaDestino: '1',
          destinatarioContribuinte: true,
        }),
      TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA,
    )
  })

  it('calcDifal base unica: aliquota=1 NAO valida denominador (nao divide)', () => {
    expect(() =>
      calcDifal({
        valorOperacao: '1000',
        aliquotaInterestadual: '0.12',
        aliquotaInternaDestino: '1',
        destinatarioContribuinte: false,
      }),
    ).not.toThrow()
  })
})

// ─── Casos validos continuam funcionando ────────────────────────────────────

describe('casos validos nao quebram', () => {
  it('calcIcms caso padrao', () => {
    const r = calcIcms({ valorProduto: '1000', aliquota: '0.18' })
    expect(r.imposto.toString()).toBe('180')
  })

  it('calcSt caso padrao', () => {
    const r = calcSt({
      baseIcms: '1000',
      aliquotaIcms: '0.12',
      mva: '0.40',
      aliquotaSt: '0.18',
    })
    expect(r.icmsSt.toFixed(2)).toBe('132.00')
  })

  it('calcPis caso padrao', () => {
    const r = calcPis({ base: '126.08', aliquota: '0.0165' })
    expect(r.imposto.toMoney().toString()).toBe('2.08')
  })
})

// ─── TributoError e instancia de Error ──────────────────────────────────────

describe('TributoError', () => {
  it('e instancia de Error', () => {
    try {
      calcIcms({ valorProduto: '1000', aliquota: 18 })
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(TributoError)
    }
  })

  it('tem code, details.field, details.received, details.expected', () => {
    try {
      calcIcms({ valorProduto: '1000', aliquota: 18 })
    } catch (err) {
      const e = err as TributoError
      expect(e.code).toBe(TributoErrorCode.ALIQUOTA_ACIMA_DE_1)
      expect(e.details.field).toBe('aliquota')
      expect(e.details.received).toBe('18')
      expect(e.details.expected).toContain('0 e 1')
    }
  })

  it('message contem o code entre colchetes', () => {
    try {
      calcIcms({ valorProduto: '-500', aliquota: '0.18' })
    } catch (err) {
      const e = err as TributoError
      expect(e.message).toContain('[VALOR_NEGATIVO]')
      expect(e.message).toContain('valorProduto')
    }
  })
})
