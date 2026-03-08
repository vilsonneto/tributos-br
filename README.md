<p align="center">
  <img src=".github/logo.svg" width="420" alt="tributos-br f(x)">
</p>

<p align="center">
  <strong>Correto, testado, sem surpresas.</strong><br>
  Motor de calculo tributario brasileiro com precisao decimal arbitraria. Zero dependencias.
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

1. **Audit trail em cada calculo** — quando a SEFAZ rejeita, voce sabe exatamente onde o arredondamento causou a divergencia. Cada funcao retorna um array de steps com formula e valor de cada etapa.

2. **DIFAL base dupla (LC 190/2022)** — a maioria dos ERPs menores calcula DIFAL apenas com base unica. tributos-br implementa ambos os metodos e seleciona via parametro.

3. **FECOP na MVA Ajustada** — ALQ Intra Efetiva = ALQ Interna + FECOP. Ignorar FECOP gera diferenca de ~4pp na MVA. Estados: RJ, MG, CE, PE, BA, GO, MT, PI.

4. **ST unificada** — uma unica `calcSt()` cobre todos os 5 cenarios de Substituicao Tributaria via parametros opcionais. Sem nomenclatura ST-01 a ST-05.

---

## O problema

JavaScript usa IEEE 754 (ponto flutuante) para numeros. Isso causa erros silenciosos em calculos fiscais:

```js
1.064 * 39680
// Esperado: 42219.52
// IEEE 754: 42219.520000000004
```

A SEFAZ rejeita NF-e com erros de validacao 629/630 quando `vProd != vUnCom x qCom`. Esse drift de centavos eh causado por arredondamento IEEE 754.

O `tributos-br` resolve isso com aritmetica em strings de precisao arbitraria. Toda operacao eh feita sobre digitos decimais puros, sem conversao para `number` em nenhum ponto intermediario.

---

## Instalacao

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

## Uso rapido

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

// Audit trail — cada etapa do calculo
resultado.audit
// [
//   { step: "Base ICMS",            formula: "1000",                        value: "1000.00" },
//   { step: "ICMS Proprio",         formula: "1000.00 x 0.1200",            value: "120.00"  },
//   { step: "Base ST (MVA + IPI)",  formula: "(1000.00 + 100.00) x 1.4000", value: "1540.00" },
//   { step: "ICMS-ST",             formula: "1540.00 x 0.1800 - 120.00",   value: "157.20"  },
// ]
```

Todas as funcoes recebem e retornam valores como `Decimal`, nunca `number`. Use `.toFixed(2)` para formatar e `.toNumber()` apenas para interoperabilidade com APIs externas.

---

## Funcoes disponiveis

| Funcao              | Descricao                                     |
| ------------------- | --------------------------------------------- |
| `calcIcms()`        | ICMS proprio (por dentro / por fora)          |
| `calcIpi()`         | IPI sobre produto                             |
| `calcMvaAjustada()` | MVA ajustada interestadual (com FECOP)        |
| `calcSt()`          | ICMS-ST unificada (5 cenarios via parametros) |
| `calcDifal()`       | DIFAL base unica + base dupla (LC 190/2022)   |
| `calcCbs()`         | CBS (reforma tributaria, LC 214/2025)         |
| `calcIbs()`         | IBS (reforma tributaria, LC 214/2025)         |

Todas as funcoes sao puras, recebem parametros (nunca hardcode de aliquotas), retornam objeto com breakdown dos calculos + audit trail, e usam `Decimal` internamente com arredondamento HALF_UP (padrao SEFAZ).

---

## Exemplos

### ICMS proprio

```ts
import { calcIcms } from 'tributos-br'

// ICMS por fora (padrao, operacoes interestaduais)
const icms = calcIcms({
  valorProduto: '1000',
  aliquota: '0.18', // 18%
})
// icms.base    → 1000
// icms.imposto → 180

// ICMS por dentro (operacoes internas, imposto embutido no preco)
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

Corrige a MVA original para operacoes interestaduais, neutralizando o diferencial de aliquota (EC 87/2015).

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

### ICMS-ST (Substituicao Tributaria)

Uma unica funcao que cobre todos os cenarios via parametros opcionais:

```ts
import { calcSt } from 'tributos-br'

// Cenario basico: operacao interna com MVA original
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

// Cenario interestadual com IPI compondo base ST
const stInter = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.12',
  mva: '0.5024',
  aliquotaSt: '0.18',
  valorIpi: '100',
})
// stInter.baseSt → 1652.64 ((1000 + 100) x 1.5024)
// stInter.icmsSt → 177.47

// Cenario com pauta fiscal (SEFAZ define valor minimo)
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

// Cenario com reducao de base
const stReduzida = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.18',
  mva: '0.40',
  aliquotaSt: '0.18',
  reducaoBase: '0.10', // reduz 10% da base ICMS
  reducaoBaseSt: '0.10', // reduz 10% da base ST
})
// stReduzida.baseIcms → 900 (1000 x 0.90)
// stReduzida.baseSt   → 1400 (base ST antes da reducao)
// icmsSt calculado sobre base ST efetiva (1400 x 0.90 = 1260)

// Cenario com FECOP
const stFecop = calcSt({
  baseIcms: '1000',
  aliquotaIcms: '0.12',
  mva: '0.40',
  aliquotaSt: '0.18',
  fecop: '0.02', // +2% sobre aliquota ST
})
// Aliquota ST efetiva = 0.18 + 0.02 = 0.20
```

### DIFAL (Diferencial de Aliquota)

```ts
import { calcDifal } from 'tributos-br'

// Base unica (nao-contribuinte, consumidor final)
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

### CBS e IBS (Reforma Tributaria)

```ts
import { calcCbs, calcIbs } from 'tributos-br'

// CBS — substitui PIS/COFINS (LC 214/2025)
const cbs = calcCbs({
  base: '1000',
  aliquota: '0.009', // 0,9% (aliquota teste 2026)
})
// cbs.imposto → 9

// IBS — substitui ICMS/ISS (LC 214/2025)
const ibs = calcIbs({
  base: '1000',
  aliquota: '0.178', // 17,8% (soma estadual + municipal)
})
// ibs.imposto → 178
```

As aliquotas nao sao hardcoded porque variam por setor e ano-calendario durante a transicao.

---

## Precisao Decimal

A lib inclui a classe `Decimal` para aritmetica de precisao arbitraria. Pode ser usada independentemente:

```ts
import { Decimal, RoundingMode } from 'tributos-br/precision'

// Criacao
const a = Decimal.from('1.064')
const b = Decimal.from('39680')

// Operacoes (encadeamento imutavel)
const resultado = a.mul(b).round(2)
console.log(resultado.toFixed(2)) // '42219.52' (exato!)

// Arredondamento monetario (2 casas, HALF_UP)
Decimal.from('1.235').toMoney().toFixed(2) // '1.24'

// Arredondamento de aliquota (4 casas, HALF_UP)
Decimal.from('0.12345').toRate().toFixed(4) // '0.1235'

// Comparacoes
Decimal.from('1.23').gt('1.22') // true
Decimal.from('1.23').eq('1.23') // true

// Min/Max
Decimal.max('100', '200', '150').toFixed(0) // '200'
Decimal.min('100', '200', '150').toFixed(0) // '100'
```

### Modos de arredondamento

| Modo        | Descricao                             |
| ----------- | ------------------------------------- |
| `HALF_UP`   | Metade para cima (padrao SEFAZ)       |
| `HALF_EVEN` | Metade para o par (Banker's rounding) |
| `HALF_DOWN` | Metade para baixo                     |
| `UP`        | Para longe do zero                    |
| `DOWN`      | Para o zero (trunca)                  |
| `CEILING`   | Para +Infinity                        |
| `FLOOR`     | Para -Infinity                        |

---

## Entry points

| Import                  | Conteudo                                               |
| ----------------------- | ------------------------------------------------------ |
| `tributos-br`           | Calculadoras (ICMS, IPI, DIFAL, ST, CBS/IBS) + Decimal |
| `tributos-br/precision` | Apenas `Decimal` + `RoundingMode`                      |

```ts
// Se voce so precisa de Decimal (sem calculadoras)
import { Decimal } from 'tributos-br/precision'

// Se precisa das calculadoras (Decimal tambem incluso)
import { calcIcms, Decimal } from 'tributos-br'
```

---

## Compatibilidade

- Node.js >= 20
- ESM e CommonJS
- TypeScript strict

---

## Motivacao

Essa lib nasceu de codigo de producao em um ERP de comercio. Ao migrar calculos tributarios de planilhas Excel para JavaScript, os arredondamentos IEEE 754 comecaram a causar rejeicoes de NF-e por centavos de diferenca.

Em vez de corrigir caso a caso com `toFixed`, a solucao foi trocar a base: fazer aritmetica em strings de digitos, sem nunca passar por `number` nos calculos intermediarios. O resultado eh uma engine de calculo tributario que produz os mesmos valores que a SEFAZ espera, sem surpresas.

---

## Licenca

[MIT](./LICENSE)
