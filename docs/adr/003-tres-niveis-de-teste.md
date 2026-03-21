# ADR-003: Três níveis de teste e conformidade SEFAZ

## Status

Aceito

## Contexto

O tributos-br opera num domínio onde "teste passando" não significa "cálculo correto". Um teste unitário pode validar que `1000 x 0.18 = 180` e ainda assim produzir uma NF-e rejeitada pela SEFAZ por divergência de arredondamento de R$0,01 (rejeição 528).

Além disso, as fontes de verdade para cálculos fiscais têm níveis de autoridade diferentes:

- A legislação (LC 87/96, RICMS, EC 87/2015) define as fórmulas.
- A SEFAZ valida matemática parcial na autorização (vICMS = vBC x pICMS, tolerância R$0,01), mas NÃO valida MVA, benefício fiscal ou redução de base.
- Uma NF-e autorizada (cStat 100) é evidência empírica de que o cálculo foi aceito, não prova de corretude jurídica (pode ser glosada em auditoria posterior, até 5 anos).
- O MOC 7.0 (Manual de Orientação do Contribuinte) é especificação de schema XML e regras de validação. Não contém exemplos numéricos de cálculo.

Essas distinções exigem que os testes sejam organizados por nível de confiança, não apenas por módulo.

## Decisão

### Três níveis de teste

| Nível                  | Arquivo                          | Fonte de verdade                   | Escopo                                                                                                                  |
| ---------------------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **E2E fiscal**         | `nfe-ground-truth.test.ts`       | NF-e reais (cStat 100)            | Nota inteira: todos os tributos presentes no documento testados juntos. Nunca fatiar por calculadora.                    |
| **Conformidade SEFAZ** | `sefaz-validation-rules.test.ts` | Regras de validação do MOC/NTs     | Valida que nenhum output viola rejeições da SEFAZ (528, 529, 530, 534, 536, 694-696).                                   |
| **Unitário**           | `[calculadora].test.ts`          | Legislação, fórmulas, edge cases   | Fórmula isolada, validação de input, regressão. Prefixo `[MOC]` no describe quando o caso vem de documento normativo.   |

### Hierarquia de confiança

Quando há conflito entre fontes: Legislação > NT SEFAZ > NF-e real > Unitário.

Justificativa por nível:

- **Legislação prevalece sobre tudo** (art. 97 CTN). Regras de validação do MOC não têm força de lei.
- **NT SEFAZ** atualiza o MOC e pode adicionar/alterar regras de validação. Sempre prevalece sobre o MOC base.
- **NF-e real** é evidência de aceitação prática. Se NF-e diverge do unitário, o unitário está errado. Se NF-e diverge da legislação, documentar como divergência conhecida.
- **Unitário** é derivado da interpretação do implementador sobre a legislação. É o nível mais frágil.

### NF-e como documento atômico

Uma NF-e é um fato fiscal indivisível. Ela contém ICMS, IPI, PIS, COFINS, DIFAL, CBS, IBS, todos interdependentes. Fatiar por calculadora destrói a coerência que torna o ground truth valioso.

Quando o arquivo crescer para 15-20+ NF-e, dividir por perfil de operação (interestadual, ST, DIFAL), não por calculadora.

### Tolerâncias de arredondamento SEFAZ

| Rejeição | Campo         | Regra                          | Tolerância | Escopo   |
| -------- | ------------- | ------------------------------ | ---------- | -------- |
| 528      | vICMS         | vBC x pICMS                    | R$0,01     | Por item |
| 529      | vICMSST       | baseST x pICMSST - icmsPróprio | R$0,01     | Por item |
| 530      | vIPI          | vBC x pIPI                     | R$0,01     | Por item |
| 534      | vPIS          | vBC x pPIS                     | R$0,01     | Por item |
| 536      | vCOFINS       | vBC x pCOFINS                  | R$0,01     | Por item |
| 694-696  | DIFAL/FCP     | Regras específicas             | R$0,01     | Por item |
| 631-652  | Totalizadores | Soma dos itens                 | Variável   | Por nota |

A lib deve calcular pela legislação com precisão máxima e usar a tolerância apenas como rede de segurança, nunca como alvo.

### O que o MOC NÃO é

O MOC 7.0 é especificação de schema XML + regras de validação. Não é manual de cálculo. Não contém exemplos numéricos passo a passo. As fontes de cálculo são: legislação, NTs e NF-e reais.

## Consequências

- Cada arquivo de teste tem header explícito dizendo o que pertence e o que NÃO pertence.
- Contributors sabem exatamente onde colocar cada tipo de teste (árvore de decisão de 3 perguntas no CONTRIBUTING.md).
- Divergências entre níveis são documentadas com `TODO(nfe-divergencia)` e issue aberta.
- Feature futura identificada: `validarResultado()` exportada pela lib, replicando regras de validação SEFAZ como diferencial competitivo.
