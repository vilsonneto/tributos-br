/**
 * Erros de validacao de entrada das calculadoras tributarias.
 *
 * Cada TributoErrorCode mapeia exatamente UMA regra de validacao.
 * O campo `code` identifica a regra violada. O campo `details.field`
 * identifica qual parametro causou o erro.
 *
 * @module
 */

export enum TributoErrorCode {
  /** Aliquota > 1 — provavelmente passou percentual inteiro (18) ao inves de decimal (0.18). */
  ALIQUOTA_ACIMA_DE_1 = 'ALIQUOTA_ACIMA_DE_1',
  /** Aliquota < 0 — aliquota nunca pode ser negativa. */
  ALIQUOTA_NEGATIVA = 'ALIQUOTA_NEGATIVA',
  /** Valor monetario < 0 — base, valorProduto, valorIpi nao podem ser negativos. */
  VALOR_NEGATIVO = 'VALOR_NEGATIVO',
  /** pautaFiscal informada sem quantidade — combinacao invalida no calcSt. */
  PAUTA_SEM_QUANTIDADE = 'PAUTA_SEM_QUANTIDADE',
  /** baseReduzida=true com destinatarioContribuinte=true — CST 20 so se aplica a nao-contribuinte. */
  BASE_REDUZIDA_COM_CONTRIBUINTE = 'BASE_REDUZIDA_COM_CONTRIBUINTE',
  /** Combinacao de aliquotas causa denominador zero (ex: aliquota=1 com por dentro). */
  DIVISAO_POR_ZERO_ALIQUOTA = 'DIVISAO_POR_ZERO_ALIQUOTA',
}

export interface TributoErrorDetails {
  /** Nome do campo que falhou na validacao. */
  field: string
  /** Valor recebido (convertido para string). */
  received: string
  /** Descricao do que era esperado. */
  expected: string
}

function buildMessage(code: TributoErrorCode, d: TributoErrorDetails): string {
  switch (code) {
    case TributoErrorCode.ALIQUOTA_ACIMA_DE_1:
      return (
        `[${code}] Campo "${d.field}": aliquota parece estar em percentual inteiro ao inves de decimal. ` +
        `Recebido: ${d.received}. Esperado: ${d.expected}.`
      )
    case TributoErrorCode.ALIQUOTA_NEGATIVA:
      return (
        `[${code}] Campo "${d.field}": aliquota nao pode ser negativa. ` +
        `Recebido: ${d.received}. Esperado: ${d.expected}.`
      )
    case TributoErrorCode.VALOR_NEGATIVO:
      return (
        `[${code}] Campo "${d.field}": valor monetario nao pode ser negativo. ` +
        `Recebido: ${d.received}. Esperado: ${d.expected}.`
      )
    case TributoErrorCode.PAUTA_SEM_QUANTIDADE:
      return (
        `[${code}] Campo "${d.field}": pauta fiscal informada sem quantidade. ` +
        `Recebido: ${d.received}. Esperado: ${d.expected}.`
      )
    case TributoErrorCode.BASE_REDUZIDA_COM_CONTRIBUINTE:
      return (
        `[${code}] Campo "${d.field}": base reduzida (CST 20) nao se aplica a destinatario contribuinte. ` +
        `Recebido: ${d.received}. Esperado: ${d.expected}.`
      )
    case TributoErrorCode.DIVISAO_POR_ZERO_ALIQUOTA:
      return (
        `[${code}] Campo "${d.field}": combinacao de aliquotas causa divisao por zero no denominador. ` +
        `Recebido: ${d.received}. Esperado: ${d.expected}.`
      )
  }
}

export class TributoError extends Error {
  readonly code: TributoErrorCode
  readonly details: TributoErrorDetails

  constructor(code: TributoErrorCode, details: TributoErrorDetails) {
    super(buildMessage(code, details))
    this.name = 'TributoError'
    this.code = code
    this.details = details
  }
}
