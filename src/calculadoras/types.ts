import type { Decimal } from '../precision/index.js'

export type DecimalInput = string | number | Decimal

/**
 * Uma etapa do audit trail — registra o nome, a fórmula e o valor
 * de cada operação intermediária do cálculo tributário.
 *
 * Permite rastrear exatamente onde um arredondamento ou divergência
 * ocorreu quando a SEFAZ rejeita uma NF-e (erros 629/630).
 */
export interface AuditStep {
  /** Nome legível da etapa. Ex: "Base ICMS", "ICMS Próprio". */
  step: string
  /** Fórmula aplicada com valores concretos. Ex: "1000.00 × 0.18". */
  formula: string
  /** Resultado da etapa. Ex: "180.00". */
  value: string
}

/** Retorno padrão de funções simples (ICMS, IPI, CBS, IBS). */
export interface ResultadoSimples {
  imposto: Decimal
  base: Decimal
  aliquota: Decimal
  audit: AuditStep[]
}

/** Retorno de calcSt(). */
export interface ResultadoSt {
  baseIcms: Decimal
  icmsProprio: Decimal
  baseSt: Decimal
  icmsSt: Decimal
  mvaUtilizada: Decimal
  audit: AuditStep[]
}

/** Retorno de calcDifal(). */
export interface ResultadoDifal {
  difal: Decimal
  icmsOrigem: Decimal
  icmsDestino: Decimal
  baseDifal: Decimal
  audit: AuditStep[]
}

/** Retorno de calcMvaAjustada(). */
export interface ResultadoMva {
  mvaAjustada: Decimal
  mvaOriginal: Decimal
  audit: AuditStep[]
}
