/**
 * Modos de arredondamento suportados.
 *
 * HALF_UP é o padrão da SEFAZ para NF-e — usado na validação de
 * `vProd`, `vBC`, `vICMS` e demais campos monetários.
 * HALF_EVEN (Banker's rounding) é comum em relatórios contábeis.
 *
 * @see docs/adr/001-aritmetica-em-strings.md — por que não usamos IEEE 754
 */
export enum RoundingMode {
  /** Arredonda metade para cima (padrão SEFAZ) */
  HALF_UP = 'HALF_UP',
  /** Arredonda metade para o par mais próximo (Banker's rounding) */
  HALF_EVEN = 'HALF_EVEN',
  /** Arredonda metade para baixo */
  HALF_DOWN = 'HALF_DOWN',
  /** Arredonda para longe do zero */
  UP = 'UP',
  /** Arredonda em direção ao zero (trunca) */
  DOWN = 'DOWN',
  /** Arredonda em direção a +Infinity */
  CEILING = 'CEILING',
  /** Arredonda em direção a -Infinity */
  FLOOR = 'FLOOR',
}

/**
 * Representação interna de um número decimal.
 *
 * `digits` é uma string de dígitos (sem ponto, sem sinal) — a representação
 * em string é intencional para evitar drift IEEE 754. Nunca converta `digits`
 * para `Number` em operações intermediárias.
 *
 * Valor real = sign × int(digits) × 10^exponent
 *
 * Exemplos:
 * - 1.23   → { sign: 1, digits: "123", exponent: -2 }
 * - -0.005 → { sign: -1, digits: "5", exponent: -3 }
 * - 42     → { sign: 1, digits: "42", exponent: 0 }
 *
 * @see docs/adr/001-aritmetica-em-strings.md
 */
export interface DecimalInternal {
  readonly sign: 1 | -1
  readonly digits: string
  readonly exponent: number
}

/**
 * Configuração de precisão e arredondamento.
 */
export interface PrecisionConfig {
  readonly precision: number
  readonly rounding: RoundingMode
}

/**
 * Tipos aceitos como entrada nos módulos internos (parse, arithmetic).
 *
 * Usa `{ toString(): string }` para aceitar qualquer objeto com toString(),
 * incluindo a classe Decimal — sem dependência circular.
 * A API pública re-exporta `DecimalInput` como `string | number | Decimal`
 * em decimal.ts para tipagem mais precisa.
 */
export type DecimalInput = string | number | { toString(): string }

/**
 * Configuração padrão: 20 casas decimais, HALF_UP (norma SEFAZ).
 */
export const DEFAULT_CONFIG: PrecisionConfig = {
  precision: 20,
  rounding: RoundingMode.HALF_UP,
} as const
