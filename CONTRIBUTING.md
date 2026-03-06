# Contribuindo com tributos-br

Obrigado por considerar contribuir! Este guia explica como configurar o ambiente, as convencoes do projeto e o que esperamos de PRs.

## Pre-requisitos

- Node.js 22+ (recomendado) ou no minimo Node 18
- npm 10+
- nvm (opcional, mas recomendado)

## Setup local

```bash
git clone https://github.com/vilsonneto/tributos-br.git
cd tributos-br
nvm use          # usa Node 22 via .nvmrc
npm install
npm test         # roda todos os testes
npm run typecheck # verifica tipos
```

## Convencao de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar calculo de DIFAL base dupla
fix: corrigir arredondamento HALF_UP para 4 casas
test: adicionar cenarios de ST com FECOP
docs: documentar formula MVA Ajustada
chore: atualizar dependencias
refactor: extrair logica de precisao para modulo separado
```

## Changesets

Todo PR que altera comportamento da lib deve incluir um changeset:

```bash
npx changeset add
```

O comando vai perguntar:
1. Qual pacote foi alterado (`tributos-br`)
2. Tipo de mudanca (`patch`, `minor` ou `major`)
3. Descricao da mudanca

Isso gera um arquivo em `.changeset/` que deve ser commitado junto com o PR.

PRs de infra/docs/chore que nao alteram a API publica nao precisam de changeset.

## Criterios para formulas tributarias

Se voce esta propondo uma correcao ou nova formula:

1. **Base legal obrigatoria** — cite o Convenio ICMS, Lei Complementar, Portaria SEFAZ ou outro normativo que fundamenta a formula. Inclua no comentario do codigo.

2. **Testes com valores reais** — use valores de NF-e reais (ou baseados em cenarios reais), nao valores inventados. Isso garante que a formula funciona na pratica.

3. **Cobertura >= 95%** — a cobertura de testes deve ser mantida acima de 95% em statements, branches, functions e lines apos sua mudanca.

4. **Precisao decimal** — use a classe `Decimal` para todos os calculos. Nunca use `number` do JavaScript para valores monetarios ou aliquotas.

## Checklist do PR

Antes de abrir o PR, verifique:

```bash
npm run typecheck    # tipos corretos
npm run lint         # codigo limpo
npm run format:check # formatacao consistente
npm run test         # testes passam
```

O template de PR no GitHub ja inclui essa checklist.

## Scripts disponiveis

| Comando | Descricao |
|---|---|
| `npm test` | Roda todos os testes com Vitest |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |
| `npm run typecheck` | Verificacao de tipos (tsc) |
| `npm run lint` | ESLint |
| `npm run format` | Formata com Prettier |
| `npm run format:check` | Verifica formatacao |
| `npm run build` | Build via tsup (ESM + CJS) |

## Duvidas?

Abra uma [issue](https://github.com/vilsonneto/tributos-br/issues) ou inicie uma [discussion](https://github.com/vilsonneto/tributos-br/discussions).
