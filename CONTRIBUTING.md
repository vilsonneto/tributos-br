# Contribuindo com tributos-br

Obrigado por considerar contribuir! Este guia explica como configurar o ambiente, as convenções do projeto e o que esperamos de PRs.

## Pré-requisitos

- Node.js 22+ (recomendado) ou no mínimo Node 20
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

2. **Testes derivados da lei, nunca da implementação** — escreva os testes a partir da tipagem da função e do normativo antes de olhar a implementação. O processo esperado é:
   - Entender a regra pelo normativo.
   - Escrever todos os testes.
   - Implementar a função até os testes passarem.

   Se não consegue escrever os testes sem olhar a implementação, a regra não está clara o suficiente para ser implementada com segurança. Revise a regra primeiro.

3. **Ground truth são NF-e aceitas pela SEFAZ** — use valores de NF-e reais autorizadas ou exemplos numéricos de documentos oficiais da SEFAZ. A legislação é frequentemente ambígua sobre ordem de arredondamento intermediário; uma NF-e autorizada elimina essa ambiguidade. Inclua no comentário do teste a fonte do valor de referência.

4. **Testes fiscais só mudam quando a lei muda** — nunca ajuste o valor esperado em um `expect` para corresponder ao output da função. Se um teste falha, há exatamente três causas:
   - A regra foi mal entendida → pare, revise o normativo, corrija o teste.
   - A função está incorreta → corrija a implementação.
   - A lei admite duas interpretações legítimas → documente a escolha no código e, se for significativa, em um ADR.

5. **Cobertura >= 95%** — necessária, mas não suficiente. O que importa é que os valores produzidos estão corretos segundo o normativo, não apenas que o código é exercitado. Mantenha cobertura acima de 95% em statements, branches, functions e lines após sua mudança.

6. **Precisão decimal** — use a classe `Decimal` para todos os cálculos. Nunca use `number` do JavaScript para valores monetários ou alíquotas.

Veja também: [ADR-002 — Estratégia de validação de cálculos fiscais](docs/adr/002-estrategia-de-validacao-fiscal.md)

## Branches

Usamos GitHub Flow: feature branches direto da `main`, sempre via Pull Request.

| Prefixo    | Uso                       | Exemplo                           |
| ---------- | ------------------------- | --------------------------------- |
| `feat/*`   | Nova funcionalidade       | `feat/calc-transicao`             |
| `fix/*`    | Correção de bug           | `fix/arredondamento-difal`        |
| `chore/*`  | Infra, CI, dependências   | `chore/atualizar-node-matrix`     |
| `docs/*`   | Documentação              | `docs/exemplos-st`                |
| `test/*`   | Testes sem mudança de API | `test/cenarios-fecop`             |

Regras:

- Sempre crie branch a partir de `main`
- Sempre abra PR para mergear na `main`
- CI deve estar verde antes do merge
- PRs que alteram a API pública precisam de changeset

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

| Comando                 | Descrição                       |
| ----------------------- | ------------------------------- |
| `npm test`              | Roda todos os testes com Vitest |
| `npm run test:watch`    | Testes em modo watch            |
| `npm run test:coverage` | Testes com cobertura            |
| `npm run typecheck`     | Verificação de tipos (tsc)      |
| `npm run lint`          | ESLint                          |
| `npm run format`        | Formata com Prettier            |
| `npm run format:check`  | Verifica formatação             |
| `npm run build`         | Build via tsup (ESM + CJS)      |

## Dúvidas?

Abra uma [issue](https://github.com/vilsonneto/tributos-br/issues) ou inicie uma [discussion](https://github.com/vilsonneto/tributos-br/discussions).
