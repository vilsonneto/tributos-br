# Contribuindo com tributos-br

Obrigado por considerar contribuir! Este guia explica como configurar o ambiente, as convenções do projeto e o que esperamos de PRs.

## Pré-requisitos

- Node.js 22+ (recomendado) ou no mínimo Node 18
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

## Convenção de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar cálculo de DIFAL base dupla
fix: corrigir arredondamento HALF_UP para 4 casas
test: adicionar cenários de ST com FECOP
docs: documentar fórmula MVA Ajustada
chore: atualizar dependências
refactor: extrair lógica de precisão para módulo separado
```

## Changesets

Todo PR que altera comportamento da lib deve incluir um changeset:

```bash
npx changeset add
```

O comando vai perguntar:
1. Qual pacote foi alterado (`tributos-br`)
2. Tipo de mudança (`patch`, `minor` ou `major`)
3. Descrição da mudança

Isso gera um arquivo em `.changeset/` que deve ser commitado junto com o PR.

PRs de infra/docs/chore que não alteram a API pública não precisam de changeset.

## Critérios para fórmulas tributárias

Se você está propondo uma correção ou nova fórmula:

1. **Base legal obrigatória** — cite o Convênio ICMS, Lei Complementar, Portaria SEFAZ ou outro normativo que fundamenta a fórmula. Inclua no comentário do código.

2. **Testes com valores reais** — use valores de NF-e reais (ou baseados em cenários reais), não valores inventados. Isso garante que a fórmula funciona na prática.

3. **Cobertura >= 95%** — a cobertura de testes deve ser mantida acima de 95% em statements, branches, functions e lines após sua mudança.

4. **Precisão decimal** — use a classe `Decimal` para todos os cálculos. Nunca use `number` do JavaScript para valores monetários ou alíquotas.

## Checklist do PR

Antes de abrir o PR, verifique:

```bash
npm run typecheck    # tipos corretos
npm run lint         # código limpo
npm run format:check # formatação consistente
npm run test         # testes passam
```

O template de PR no GitHub já inclui essa checklist.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm test` | Roda todos os testes com Vitest |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |
| `npm run typecheck` | Verificação de tipos (tsc) |
| `npm run lint` | ESLint |
| `npm run format` | Formata com Prettier |
| `npm run format:check` | Verifica formatação |
| `npm run build` | Build via tsup (ESM + CJS) |

## Dúvidas?

Abra uma [issue](https://github.com/vilsonneto/tributos-br/issues) ou inicie uma [discussion](https://github.com/vilsonneto/tributos-br/discussions).
