import type { Decimal } from '../precision/index.js'

export type DecimalInput = string | number | Decimal

/** Retorno padrão de funções simples (ICMS, IPI, CBS, IBS). */
export interface ResultadoSimples {
  imposto: Decimal
  base: Decimal
  aliquota: Decimal
}

/** Retorno de calcSt(). */
export interface ResultadoSt {
  baseIcms: Decimal
  icmsProprio: Decimal
  baseSt: Decimal
  icmsSt: Decimal
  mvaUtilizada: Decimal
}

/** Retorno de calcDifal(). */
export interface ResultadoDifal {
  difal: Decimal
  icmsOrigem: Decimal
  icmsDestino: Decimal
  baseDifal: Decimal
}

/** Retorno de calcMvaAjustada(). */
export interface ResultadoMva {
  mvaAjustada: Decimal
  mvaOriginal: Decimal
}
