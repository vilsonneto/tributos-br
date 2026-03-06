/**
 * Classe Decimal — API pública imutável da camada de precisão.
 *
 * Toda operação retorna um novo Decimal. Nenhuma operação modifica o
 * objeto original. O encadeamento de operações é o uso esperado:
 *
 * ```ts
 * Decimal.from('100').mul('1.18').round(2).toFixed(2) // '118.00'
 * ```
 *
 * Internamente delega para parse, arithmetic e rounding, que operam
 * exclusivamente sobre strings de dígitos — sem IEEE 754.
 *
 * @see docs/adr/001-aritmetica-em-strings.md
 * @module
 */
import type { DecimalInternal, PrecisionConfig } from './types.js'
import { RoundingMode, DEFAULT_CONFIG } from './types.js'
import { parse } from './parse.js'
import { addInternal, subInternal, mulInternal, divInternal } from './arithmetic.js'
import { round } from './rounding.js'

/** Tipos aceitos como entrada: string, number ou outro Decimal. */
export type DecimalInput = string | number | Decimal

export class Decimal {
  /** @internal */
  private readonly _internal: DecimalInternal
  /** @internal */
  private readonly _config: PrecisionConfig

  private constructor(internal: DecimalInternal, config: PrecisionConfig) {
    this._internal = internal
    this._config = config
  }

  // ─── Construtores ────────────────────────────────────────────────────

  /**
   * Cria um Decimal a partir de string, number ou outro Decimal.
   *
   * ```ts
   * Decimal.from('1.23')
   * Decimal.from(1.23)
   * Decimal.from(outroDecimal)
   * Decimal.from('1.23', { precision: 10, rounding: RoundingMode.HALF_EVEN })
   * ```
   */
  static from(value: DecimalInput, config?: Partial<PrecisionConfig>): Decimal {
    const cfg = resolveConfig(config)
    if (value instanceof Decimal) {
      return new Decimal(value._internal, cfg)
    }
    return new Decimal(parse(value), cfg)
  }

  /** Retorna Decimal representando zero. */
  static zero(config?: Partial<PrecisionConfig>): Decimal {
    return Decimal.from('0', config)
  }

  /** Retorna Decimal representando um. */
  static one(config?: Partial<PrecisionConfig>): Decimal {
    return Decimal.from('1', config)
  }

  // ─── Operações aritméticas (encadeáveis) ─────────────────────────────

  /** Soma: `this + value`. Retorna novo Decimal. */
  add(value: DecimalInput): Decimal {
    return new Decimal(addInternal(this._internal, toInternal(value)), this._config)
  }

  /** Subtração: `this - value`. Retorna novo Decimal. */
  sub(value: DecimalInput): Decimal {
    return new Decimal(subInternal(this._internal, toInternal(value)), this._config)
  }

  /** Multiplicação: `this × value`. Retorna novo Decimal. */
  mul(value: DecimalInput): Decimal {
    return new Decimal(mulInternal(this._internal, toInternal(value)), this._config)
  }

  /**
   * Divisão: `this ÷ value`.
   * Usa a precisão configurada para determinar dígitos significativos.
   * Lança erro se `value` for zero.
   */
  div(value: DecimalInput): Decimal {
    return new Decimal(
      divInternal(this._internal, toInternal(value), this._config.precision),
      this._config,
    )
  }

  // ─── Arredondamento ──────────────────────────────────────────────────

  /**
   * Arredonda para o número especificado de casas decimais.
   * Se o modo não for informado, usa o modo da configuração.
   */
  round(decimalPlaces: number, mode?: RoundingMode): Decimal {
    const m = mode ?? this._config.rounding
    return new Decimal(round(this._internal, decimalPlaces, m), this._config)
  }

  /**
   * Arredondamento monetário: 2 casas decimais, HALF_UP.
   * Padrão SEFAZ para campos como vProd, vBC, vICMS.
   */
  toMoney(): Decimal {
    return new Decimal(round(this._internal, 2, RoundingMode.HALF_UP), this._config)
  }

  /**
   * Arredondamento de alíquota: 4 casas decimais, HALF_UP.
   * Padrão SEFAZ para campos como pICMS, pIPI.
   */
  toRate(): Decimal {
    return new Decimal(round(this._internal, 4, RoundingMode.HALF_UP), this._config)
  }

  // ─── Comparações ─────────────────────────────────────────────────────

  /**
   * Compara este Decimal com outro valor.
   * Retorna -1 se `this < other`, 0 se iguais, 1 se `this > other`.
   */
  cmp(other: DecimalInput): -1 | 0 | 1 {
    const diff = subInternal(this._internal, toInternal(other))
    if (diff.digits === '0') return 0
    return diff.sign === 1 ? 1 : -1
  }

  eq(other: DecimalInput): boolean {
    return this.cmp(other) === 0
  }

  gt(other: DecimalInput): boolean {
    return this.cmp(other) === 1
  }

  gte(other: DecimalInput): boolean {
    return this.cmp(other) >= 0
  }

  lt(other: DecimalInput): boolean {
    return this.cmp(other) === -1
  }

  lte(other: DecimalInput): boolean {
    return this.cmp(other) <= 0
  }

  // ─── Utilitários ─────────────────────────────────────────────────────

  /** Retorna o valor absoluto. */
  abs(): Decimal {
    if (this._internal.sign === 1 || this._internal.digits === '0') return this
    return new Decimal({ ...this._internal, sign: 1 }, this._config)
  }

  /** Retorna o valor com sinal invertido. */
  neg(): Decimal {
    if (this._internal.digits === '0') return this
    const newSign: 1 | -1 = this._internal.sign === 1 ? -1 : 1
    return new Decimal({ ...this._internal, sign: newSign }, this._config)
  }

  isZero(): boolean {
    return this._internal.digits === '0'
  }

  isNegative(): boolean {
    return this._internal.sign === -1 && this._internal.digits !== '0'
  }

  isPositive(): boolean {
    return this._internal.sign === 1 && this._internal.digits !== '0'
  }

  /** Retorna o maior entre os valores fornecidos. */
  static max(...values: DecimalInput[]): Decimal {
    if (values.length === 0) {
      throw new Error('Decimal.max requer ao menos um argumento')
    }
    let result = Decimal.from(values[0]!)
    for (let i = 1; i < values.length; i++) {
      const current = Decimal.from(values[i]!)
      if (current.gt(result)) {
        result = current
      }
    }
    return result
  }

  /** Retorna o menor entre os valores fornecidos. */
  static min(...values: DecimalInput[]): Decimal {
    if (values.length === 0) {
      throw new Error('Decimal.min requer ao menos um argumento')
    }
    let result = Decimal.from(values[0]!)
    for (let i = 1; i < values.length; i++) {
      const current = Decimal.from(values[i]!)
      if (current.lt(result)) {
        result = current
      }
    }
    return result
  }

  // ─── Conversão ───────────────────────────────────────────────────────

  /**
   * Converte para string sem notação científica.
   * É a representação canônica — usada em toJSON() e como entrada para parse().
   */
  toString(): string {
    const d = this._internal
    if (d.digits === '0') return '0'

    const sign = d.sign === -1 ? '-' : ''

    if (d.exponent >= 0) {
      return sign + d.digits + '0'.repeat(d.exponent)
    }

    const totalDigits = d.digits.length
    const dotPos = totalDigits + d.exponent

    if (dotPos <= 0) {
      return sign + '0.' + '0'.repeat(-dotPos) + d.digits
    }

    return sign + d.digits.slice(0, dotPos) + '.' + d.digits.slice(dotPos)
  }

  /**
   * Formata com exatamente `n` casas decimais, com padding de zeros.
   * Não arredonda — use `.round(n)` antes se necessário.
   *
   * ```ts
   * Decimal.from('1.5').toFixed(2) // '1.50'
   * Decimal.from('1').toFixed(0)   // '1'
   * ```
   */
  toFixed(n: number): string {
    const str = this.toString()

    if (n <= 0) {
      const dotIdx = str.indexOf('.')
      return dotIdx === -1 ? str : str.slice(0, dotIdx)
    }

    const dotIdx = str.indexOf('.')

    if (dotIdx === -1) {
      return str + '.' + '0'.repeat(n)
    }

    const currentDecimals = str.length - dotIdx - 1

    if (currentDecimals >= n) {
      return str.slice(0, dotIdx + 1 + n)
    }

    return str + '0'.repeat(n - currentDecimals)
  }

  /**
   * Converte para number IEEE 754.
   *
   * **Atenção**: pode perder precisão para valores com mais de ~15 dígitos
   * significativos. Usar apenas para interoperabilidade com APIs que exigem
   * number — nunca para cálculos intermediários.
   */
  toNumber(): number {
    return Number(this.toString())
  }

  /**
   * Retorna a representação string para JSON.stringify.
   * Garante que valores decimais são serializados como strings, evitando
   * perda de precisão na serialização JSON.
   */
  toJSON(): string {
    return this.toString()
  }
}

// ─── Helpers internos ────────────────────────────────────────────────────

function toInternal(value: DecimalInput): DecimalInternal {
  if (value instanceof Decimal) {
    return value['_internal']
  }
  return parse(value)
}

function resolveConfig(partial?: Partial<PrecisionConfig>): PrecisionConfig {
  if (!partial) return DEFAULT_CONFIG
  return {
    precision: partial.precision ?? DEFAULT_CONFIG.precision,
    rounding: partial.rounding ?? DEFAULT_CONFIG.rounding,
  }
}
