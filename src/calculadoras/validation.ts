/**
 * Validacao de entrada das calculadoras tributarias.
 *
 * Modulo interno. Nao e exportado publicamente.
 * Cada funcao valida uma unica regra e throws TributoError se violada.
 *
 * @module
 */
import { Decimal } from '../precision/index.js'
import type { DecimalInput } from './types.js'
import { TributoError, TributoErrorCode } from './errors.js'

function toDecimal(value: DecimalInput): Decimal {
  return value instanceof Decimal ? value : Decimal.from(value)
}

/**
 * Valida que uma aliquota esta no range [0, 1].
 * Aliquota > 1 indica erro (ex: 18 ao inves de 0.18).
 * Aliquota < 0 nunca e valida.
 */
export function validarAliquota(value: DecimalInput, field: string): void {
  const d = toDecimal(value)
  if (d.gt(Decimal.one())) {
    throw new TributoError(TributoErrorCode.ALIQUOTA_ACIMA_DE_1, {
      field,
      received: d.toString(),
      expected: 'valor entre 0 e 1 (ex: 0.18 para 18%)',
    })
  }
  if (d.isNegative()) {
    throw new TributoError(TributoErrorCode.ALIQUOTA_NEGATIVA, {
      field,
      received: d.toString(),
      expected: 'valor >= 0',
    })
  }
}

/**
 * Valida que um valor monetario nao e negativo.
 */
export function validarValorNaoNegativo(value: DecimalInput, field: string): void {
  const d = toDecimal(value)
  if (d.isNegative()) {
    throw new TributoError(TributoErrorCode.VALOR_NEGATIVO, {
      field,
      received: d.toString(),
      expected: 'valor >= 0',
    })
  }
}

/**
 * Valida que pautaFiscal nao esta informada sem quantidade.
 */
export function validarPautaComQuantidade(
  pautaFiscal: DecimalInput | undefined,
  quantidade: DecimalInput | undefined,
): void {
  if (pautaFiscal != null && quantidade == null) {
    throw new TributoError(TributoErrorCode.PAUTA_SEM_QUANTIDADE, {
      field: 'pautaFiscal',
      received: `pautaFiscal=${toDecimal(pautaFiscal).toString()}, quantidade=undefined`,
      expected: 'informar "quantidade" junto com "pautaFiscal"',
    })
  }
}

/**
 * Valida que baseReduzida=true nao esta combinado com destinatarioContribuinte=true.
 */
export function validarBaseReduzidaSemContribuinte(
  baseReduzida: boolean | undefined,
  destinatarioContribuinte: boolean,
): void {
  if (baseReduzida === true && destinatarioContribuinte === true) {
    throw new TributoError(TributoErrorCode.BASE_REDUZIDA_COM_CONTRIBUINTE, {
      field: 'baseReduzida',
      received: 'baseReduzida=true, destinatarioContribuinte=true',
      expected: 'baseReduzida=true somente com destinatarioContribuinte=false',
    })
  }
}

/**
 * Valida que o denominador (1 - aliquota) nao e zero no ICMS por dentro.
 */
export function validarDenominadorIcms(
  aliquota: DecimalInput,
  incluirImpostoNaBase: boolean | undefined,
): void {
  if (incluirImpostoNaBase !== true) return
  const d = toDecimal(aliquota)
  if (d.eq(Decimal.one())) {
    throw new TributoError(TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA, {
      field: 'aliquota',
      received: d.toString(),
      expected: 'aliquota < 1 quando incluirImpostoNaBase=true',
    })
  }
}

/**
 * Valida que (aliquotaInterna + fecop) < 1 para evitar divisao por zero.
 */
export function validarDenominadorInternaFecop(
  aliquotaInterna: DecimalInput,
  fecop: DecimalInput | undefined,
  contexto: string,
): void {
  const interna = toDecimal(aliquotaInterna)
  const fec = fecop != null ? toDecimal(fecop) : Decimal.zero()
  const soma = interna.add(fec)
  if (soma.gte(Decimal.one())) {
    throw new TributoError(TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA, {
      field: 'aliquotaInterna + fecop',
      received: soma.toString(),
      expected: `soma das aliquotas < 1 para ${contexto} (denominador = 1 - soma)`,
    })
  }
}
