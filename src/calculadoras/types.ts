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
  /** FCP (Fundo de Combate à Pobreza) — presente apenas quando `fcp` é informado no input. */
  fcp?: Decimal
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
  /** DIFAL puro, sem FCP. Corresponde a vICMSUFDest no XML. */
  difal: Decimal
  icmsOrigem: Decimal
  /** ICMS destino sem FCP. */
  icmsDestino: Decimal
  baseDifal: Decimal
  /** FCP no DIFAL — presente apenas quando `fecop` é informado. Corresponde a vFCPUFDest no XML. */
  fcp?: Decimal
  audit: AuditStep[]
}

/** Retorno de calcMvaAjustada(). */
export interface ResultadoMva {
  mvaAjustada: Decimal
  mvaOriginal: Decimal
  audit: AuditStep[]
}
