# tributos-br

Brazilian tax calculation engine with arbitrary decimal precision. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/tributos-br)](https://www.npmjs.com/package/tributos-br)
[![CI](https://github.com/vilsonneto/tributos-br/actions/workflows/ci.yml/badge.svg)](https://github.com/vilsonneto/tributos-br/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)]()

> [Versão em português](./README.md)

---

## Why this library exists

JavaScript uses IEEE 754 (floating point) for numbers. This causes silent errors in tax calculations:

```js
1.064 * 39680
// Expected: 42219.52
// IEEE 754: 42219.520000000004
```

Brazil's tax authority (SEFAZ) rejects electronic invoices (NF-e) with validation errors 629/630 when `vProd != vUnCom x qCom`. This cent-level drift is caused by IEEE 754 rounding.

`tributos-br` solves this with arbitrary-precision string arithmetic. Every operation is performed on pure decimal digits, with no conversion to `number` at any intermediate step.

---

## Installation

```bash
npm install tributos-br
```

```bash
yarn add tributos-br
```

```bash
pnpm add tributos-br
```

---

## Quick start

```ts
import { calcIcms } from 'tributos-br'

const result = calcIcms({
  valorProduto: '1000',
  aliquota: '0.18',
})

console.log(result.imposto.toFixed(2)) // '180.00'
console.log(result.base.toFixed(2)) // '1000.00'
```

All functions receive and return values as `Decimal`, never `number`. Use `.toFixed(2)` to format and `.toNumber()` only for interop with external APIs.

---

## Available functions

| Function            | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `calcIcms()`        | ICMS (state VAT, "inside" or "outside" calculation)   |
| `calcIpi()`         | IPI (federal excise tax on manufactured products)     |
| `calcMvaAjustada()` | Adjusted MVA for interstate operations (with FECOP)   |
| `calcSt()`          | ICMS-ST unified (5 scenarios via optional parameters) |
| `calcDifal()`       | DIFAL single + dual + reduced-base (CST 20)           |
| `calcCbs()`         | CBS (tax reform, LC 214/2025 — replaces PIS/COFINS)   |
| `calcIbs()`         | IBS (tax reform, LC 214/2025 — replaces ICMS/ISS)     |

All functions are pure, receive parameters (no hardcoded tax rates), return an object with calculation breakdown, and use `Decimal` internally with HALF_UP rounding (SEFAZ standard).

---

## Examples

### ICMS (state VAT)

```ts
import { calcIcms } from 'tributos-br'

// "Outside" calculation (default, interstate operations)
const icms = calcIcms({
  valorProduto: '1000',
  aliquota: '0.18', // 18%
})
// icms.base    → 1000
// icms.imposto → 180

// "Inside" calculation (tax embedded in price)
const icmsInside = calcIcms({
  valorProduto: '1000',
  aliquota: '0.18',
  incluirImpostoNaBase: true,
})
// icmsInside.base    → ~1219.51 (1000 / (1 - 0.18))
// icmsInside.imposto → ~219.51
```

### IPI (federal excise tax)

```ts
import { calcIpi } from 'tributos-br'

const ipi = calcIpi({
  valorProduto: '1000',
  aliquota: '0.10', // 10%
})
// ipi.base    → 1000
// ipi.imposto → 100
```

### Adjusted MVA

Adjusts the original MVA for interstate operations, neutralizing the tax rate differential (EC 87/2015).

```ts
import { calcMvaAjustada } from 'tributos-br'

const mva = calcMvaAjustada({
  mvaOriginal: '0.40', // 40%
  aliquotaInterestadual: '0.12', // 12%
  aliquotaInterna: '0.18', // 18%
})
// mva.mvaOriginal → 0.40
// mva.mvaAjustada → ~0.5024 (50.24%)
```

### ICMS-ST (tax substitution)

A single function covering all scenarios via optional parameters:

```ts
import { calcSt } from 'tributos-br'

// Basic scenario: internal operation with original MVA
const st = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.18',
  mva: '0.40',
  aliquotaSt: '0.18',
})
// st.icmsProprio → 180
// st.baseSt      → 1400 (1000 x 1.40)
// st.icmsSt      → 72   (1400 x 0.18 - 180)

// Interstate with IPI composing ST base
const stInter = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.12',
  mva: '0.5024',
  aliquotaSt: '0.18',
  valorIpi: '100',
})
// stInter.baseSt → 1652.64
// stInter.icmsSt → 177.47
```

### DIFAL (tax rate differential)

```ts
import { calcDifal } from 'tributos-br'

// Single-base (non-taxpayer, end consumer)
const difal = calcDifal({
  valorOperacao: '1000',
  aliquotaInterestadual: '0.12',
  aliquotaInternaDestino: '0.18',
  destinatarioContribuinte: false,
})
// difal.difal → 60

// Dual-base (taxpayer, LC 190/2022)
const difalDual = calcDifal({
  valorOperacao: '1000',
  aliquotaInterestadual: '0.12',
  aliquotaInternaDestino: '0.18',
  destinatarioContribuinte: true,
})
// difalDual.baseDifal → ~1073.17
// difalDual.difal     → ~73.17

// Reduced-base (CST 20, state tax benefit with pRedBC)
// Caller pre-computes the reduced base: 243.90 × (1 - 0.95) = 12.20
const difalReduced = calcDifal({
  valorOperacao: '12.20',
  aliquotaInterestadual: '0.12',
  aliquotaInternaDestino: '0.18',
  destinatarioContribuinte: false,
  baseReduzida: true,
})
// difalReduced.baseDifal   → 14.88 (12.20 / (1 - 0.18), tax-inclusive)
// difalReduced.icmsOrigem  → 1.46
// difalReduced.icmsDestino → 2.68
// difalReduced.difal       → 1.22
```

### CBS and IBS (tax reform)

```ts
import { calcCbs, calcIbs } from 'tributos-br'

const cbs = calcCbs({
  base: '1000',
  aliquota: '0.009', // 0.9% (2026 test rate)
})
// cbs.imposto → 9

const ibs = calcIbs({
  base: '1000',
  aliquota: '0.178', // 17.8%
})
// ibs.imposto → 178
```

Tax rates are not hardcoded as they vary by sector and year during the transition period.

---

## Decimal precision

The library includes the `Decimal` class for arbitrary-precision arithmetic. It can be used independently:

```ts
import { Decimal, RoundingMode } from 'tributos-br/precision'

const a = Decimal.from('1.064')
const b = Decimal.from('39680')

const result = a.mul(b).round(2)
console.log(result.toFixed(2)) // '42219.52' (exact!)

// Monetary rounding (2 decimal places, HALF_UP)
Decimal.from('1.235').toMoney().toFixed(2) // '1.24'

// Rate rounding (4 decimal places, HALF_UP)
Decimal.from('0.12345').toRate().toFixed(4) // '0.1235'
```

### Rounding modes

| Mode        | Description                   |
| ----------- | ----------------------------- |
| `HALF_UP`   | Round half up (SEFAZ default) |
| `HALF_EVEN` | Round half to even (Banker's) |
| `HALF_DOWN` | Round half down               |
| `UP`        | Round away from zero          |
| `DOWN`      | Round toward zero (truncate)  |
| `CEILING`   | Round toward +Infinity        |
| `FLOOR`     | Round toward -Infinity        |

---

## Entry points

| Import                  | Contents                                              |
| ----------------------- | ----------------------------------------------------- |
| `tributos-br`           | Calculators (ICMS, IPI, DIFAL, ST, CBS/IBS) + Decimal |
| `tributos-br/precision` | `Decimal` + `RoundingMode` only                       |

---

## Compatibility

- Node.js >= 20
- ESM and CommonJS
- TypeScript strict

---

## License

[MIT](./LICENSE)
