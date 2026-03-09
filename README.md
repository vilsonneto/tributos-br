<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vilsonneto/tributos-br/main/.github/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vilsonneto/tributos-br/main/.github/logo-light.svg">
    <img src="https://raw.githubusercontent.com/vilsonneto/tributos-br/main/.github/logo-light.svg" width="420" alt="tributos-br f(x)">
  </picture>
</p>

<p align="center">
  <strong>Correto, testado, sem surpresas.</strong><br>
  Motor de cálculo tributário brasileiro com precisão decimal arbitrária. Zero dependências.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tributos-br"><img src="https://img.shields.io/npm/v/tributos-br" alt="npm version"></a>
  <a href="https://github.com/vilsonneto/tributos-br/actions/workflows/ci.yml"><img src="https://github.com/vilsonneto/tributos-br/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="Zero Dependencies">
</p>

---

## Por que tributos-br?

1. **Audit trail em cada cálculo** — quando a SEFAZ rejeita, você sabe exatamente onde o arredondamento causou a divergência. Cada função retorna um array de steps com fórmula e valor de cada etapa.

2. **DIFAL base dupla (LC 190/2022)** — a maioria dos ERPs menores calcula DIFAL apenas com base única. tributos-br implementa ambos os métodos e seleciona via parâmetro.

3. **FECOP na MVA Ajustada** — ALQ Intra Efetiva = ALQ Interna + FECOP. Ignorar FECOP gera diferença de ~4pp na MVA. Estados: RJ, MG, CE, PE, BA, GO, MT, PI.

4. **ST unificada** — uma única `calcSt()` cobre todos os 5 cenários de Substituição Tributária via parâmetros opcionais. Sem nomenclatura ST-01 a ST-05.

---

## O problema

JavaScript usa IEEE 754 (ponto flutuante) para números. Isso causa erros silenciosos em cálculos fiscais:

```js
1.064 * 39680
// Esperado: 42219.52
// IEEE 754: 42219.520000000004
```

A SEFAZ rejeita NF-e com erros de validação 629/630 quando `vProd != vUnCom x qCom`. Esse drift de centavos é causado por arredondamento IEEE 754.

O `tributos-br` resolve isso com aritmética em strings de precisão arbitrária. Toda operação é feita sobre dígitos decimais puros, sem conversão para `number` em nenhum ponto intermediário.

---

## Instalação

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

## Uso rápido

```ts
import { calcSt } from 'tributos-br'

const resultado = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.12',
  mva: '0.40',
  aliquotaSt: '0.18',
  valorIpi: '100',
})

resultado.icmsSt.toFixed(2) // '157.20'
resultado.baseSt.toFixed(2) // '1540.00'

// Audit trail — cada etapa do cálculo
resultado.audit
// [
//   { step: "Base ICMS",            formula: "1000",                        value: "1000.00" },
//   { step: "ICMS Próprio",         formula: "1000.00 x 0.1200",            value: "120.00"  },
//   { step: "Base ST (MVA + IPI)",  formula: "(1000.00 + 100.00) x 1.4000", value: "1540.00" },
//   { step: "ICMS-ST",             formula: "1540.00 x 0.1800 - 120.00",   value: "157.20"  },
// ]
```

Todas as funções recebem e retornam valores como `Decimal`, nunca `number`. Use `.toFixed(2)` para formatar e `.toNumber()` apenas para interoperabilidade com APIs externas.

---

## Funções disponíveis

| Função              | Descrição                                     |
| ------------------- | --------------------------------------------- |
| `calcIcms()`        | ICMS próprio (por dentro / por fora)          |
| `calcIpi()`         | IPI sobre produto                             |
| `calcMvaAjustada()` | MVA ajustada interestadual (com FECOP)        |
| `calcSt()`          | ICMS-ST unificada (5 cenários via parâmetros) |
| `calcDifal()`       | DIFAL base única + base dupla (LC 190/2022)   |
| `calcCbs()`         | CBS (reforma tributária, LC 214/2025)         |
| `calcIbs()`         | IBS (reforma tributária, LC 214/2025)         |

Todas as funções são puras, recebem parâmetros (nunca hardcode de alíquotas), retornam objeto com breakdown dos cálculos + audit trail, e usam `Decimal` internamente com arredondamento HALF_UP (padrão SEFAZ).

---

## Exemplos

### ICMS próprio

```ts
import { calcIcms } from 'tributos-br'

// ICMS por fora (padrão, operações interestaduais)
const icms = calcIcms({
  valorProduto: '1000',
  aliquota: '0.18', // 18%
})
// icms.base    → 1000
// icms.imposto → 180

// ICMS por dentro (operações internas, imposto embutido no preço)
const icmsDentro = calcIcms({
  valorProduto: '1000',
  aliquota: '0.18',
  incluirImpostoNaBase: true,
})
// icmsDentro.base    → ~1219.51 (1000 / (1 - 0.18))
// icmsDentro.imposto → ~219.51
```

### IPI

```ts
import { calcIpi } from 'tributos-br'

const ipi = calcIpi({
  valorProduto: '1000',
  aliquota: '0.10', // 10%
})
// ipi.base    → 1000
// ipi.imposto → 100
```

### MVA ajustada

Corrige a MVA original para operações interestaduais, neutralizando o diferencial de alíquota (EC 87/2015).

```ts
import { calcMvaAjustada } from 'tributos-br'

const mva = calcMvaAjustada({
  mvaOriginal: '0.40', // 40%
  aliquotaInterestadual: '0.12', // 12%
  aliquotaInterna: '0.18', // 18%
})
// mva.mvaOriginal → 0.40
// mva.mvaAjustada → ~0.5024 (50,24%)

// Com FECOP (2%)
const mvaFecop = calcMvaAjustada({
  mvaOriginal: '0.40',
  aliquotaInterestadual: '0.12',
  aliquotaInterna: '0.18',
  fecop: '0.02',
})
// mvaFecop.mvaAjustada → 0.54 (54%)
```

### ICMS-ST (Substituição Tributária)

Uma única função que cobre todos os cenários via parâmetros opcionais:

```ts
import { calcSt } from 'tributos-br'

// Cenário básico: operação interna com MVA original
const st = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.18', // 18%
  mva: '0.40', // 40%
  aliquotaSt: '0.18', // 18%
})
// st.baseIcms    → 1000
// st.icmsProprio → 180
// st.baseSt      → 1400 (1000 x 1.40)
// st.icmsSt      → 72   (1400 x 0.18 - 180)

// Cenário interestadual com IPI compondo base ST
const stInter = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.12',
  mva: '0.5024',
  aliquotaSt: '0.18',
  valorIpi: '100',
})
// stInter.baseSt → 1652.64 ((1000 + 100) x 1.5024)
// stInter.icmsSt → 177.47

// Cenário com pauta fiscal (SEFAZ define valor mínimo)
const stPauta = calcSt({
  baseIcms: '500',
  aliquotaIcms: '0.12',
  mva: '0.40',
  aliquotaSt: '0.18',
  pautaFiscal: '15', // R$ 15 por unidade
  quantidade: '100', // 100 unidades
})
// Se pauta (15 x 100 = 1500) > base MVA (500 x 1.40 = 700), usa pauta
// stPauta.baseSt → 1500

// Cenário com redução de base
const stReduzida = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.18',
  mva: '0.40',
  aliquotaSt: '0.18',
  reducaoBase: '0.10', // reduz 10% da base ICMS
  reducaoBaseSt: '0.10', // reduz 10% da base ST
})
// stReduzida.baseIcms → 900 (1000 x 0.90)
// stReduzida.baseSt   → 1400 (base ST antes da redução)
// icmsSt calculado sobre base ST efetiva (1400 x 0.90 = 1260)

// Cenário com FECOP
const stFecop = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.12',
  mva: '0.40',
  aliquotaSt: '0.18',
  fecop: '0.02', // +2% sobre alíquota ST
})
// Alíquota ST efetiva = 0.18 + 0.02 = 0.20
```

### DIFAL (Diferencial de Alíquota)

```ts
import { calcDifal } from 'tributos-br'

// Base única (não-contribuinte, consumidor final)
const difalSimples = calcDifal({
  valorOperacao: '1000',
  aliquotaInterestadual: '0.12',
  aliquotaInternaDestino: '0.18',
  destinatarioContribuinte: false,
})
// difalSimples.icmsOrigem  → 120
// difalSimples.icmsDestino → 180
// difalSimples.difal       → 60
// difalSimples.baseDifal   → 1000

// Base dupla (contribuinte, LC 190/2022)
const difalDupla = calcDifal({
  valorOperacao: '1000',
  aliquotaInterestadual: '0.12',
  aliquotaInternaDestino: '0.18',
  destinatarioContribuinte: true,
})
// difalDupla.baseDifal   → ~1073.17 ((1000 - 120) / (1 - 0.18))
// difalDupla.icmsDestino → ~193.17
// difalDupla.difal       → ~73.17

// Com FECOP
const difalFecop = calcDifal({
  valorOperacao: '1000',
  aliquotaInterestadual: '0.12',
  aliquotaInternaDestino: '0.18',
  destinatarioContribuinte: false,
  fecop: '0.02',
})
// difalFecop.icmsDestino → 200 (1000 x (0.18 + 0.02))
// difalFecop.difal       → 80
```

### CBS e IBS (Reforma Tributária)

```ts
import { calcCbs, calcIbs } from 'tributos-br'

// CBS — substitui PIS/COFINS (LC 214/2025)
const cbs = calcCbs({
  base: '1000',
  aliquota: '0.009', // 0,9% (alíquota teste 2026)
})
// cbs.imposto → 9

// IBS — substitui ICMS/ISS (LC 214/2025)
const ibs = calcIbs({
  base: '1000',
  aliquota: '0.178', // 17,8% (soma estadual + municipal)
})
// ibs.imposto → 178
```

As alíquotas não são hardcoded porque variam por setor e ano-calendário durante a transição.

---

## Precisão Decimal

A lib inclui a classe `Decimal` para aritmética de precisão arbitrária. Pode ser usada independentemente:

```ts
import { Decimal, RoundingMode } from 'tributos-br/precision'

// Criação
const a = Decimal.from('1.064')
const b = Decimal.from('39680')

// Operações (encadeamento imutável)
const resultado = a.mul(b).round(2)
console.log(resultado.toFixed(2)) // '42219.52' (exato!)

// Arredondamento monetário (2 casas, HALF_UP)
Decimal.from('1.235').toMoney().toFixed(2) // '1.24'

// Arredondamento de alíquota (4 casas, HALF_UP)
Decimal.from('0.12345').toRate().toFixed(4) // '0.1235'

// Comparações
Decimal.from('1.23').gt('1.22') // true
Decimal.from('1.23').eq('1.23') // true

// Min/Max
Decimal.max('100', '200', '150').toFixed(0) // '200'
Decimal.min('100', '200', '150').toFixed(0) // '100'
```

### Modos de arredondamento

| Modo        | Descrição                             |
| ----------- | ------------------------------------- |
| `HALF_UP`   | Metade para cima (padrão SEFAZ)       |
| `HALF_EVEN` | Metade para o par (Banker's rounding) |
| `HALF_DOWN` | Metade para baixo                     |
| `UP`        | Para longe do zero                    |
| `DOWN`      | Para o zero (trunca)                  |
| `CEILING`   | Para +Infinity                        |
| `FLOOR`     | Para -Infinity                        |

---

## Entry points

| Import                  | Conteúdo                                               |
| ----------------------- | ------------------------------------------------------ |
| `tributos-br`           | Calculadoras (ICMS, IPI, DIFAL, ST, CBS/IBS) + Decimal |
| `tributos-br/precision` | Apenas `Decimal` + `RoundingMode`                      |

```ts
// Se você só precisa de Decimal (sem calculadoras)
import { Decimal } from 'tributos-br/precision'

// Se precisa das calculadoras (Decimal também incluso)
import { calcIcms, Decimal } from 'tributos-br'
```

---

## Compatibilidade

- Node.js >= 20
- ESM e CommonJS
- TypeScript strict

---

## Motivação

A motivação veio de experiência real com cálculo de ICMS e IPI em código de produção. Arredondamentos IEEE 754 causavam rejeições de NF-e por centavos de diferença — erro 629, valor total não bate com preço unitário vezes quantidade.

Em vez de corrigir caso a caso com `toFixed`, a solução foi trocar a base: fazer aritmética em strings de dígitos, sem nunca passar por `number` nos cálculos intermediários. O resultado é uma engine de cálculo tributário que produz os mesmos valores que a SEFAZ espera, sem surpresas.

---

## Licença

[MIT](./LICENSE)
