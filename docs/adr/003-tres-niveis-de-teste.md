# ADR-003: Tres niveis de teste e conformidade SEFAZ

## Status

Aceito

## Contexto

O tributos-br opera num dominio onde "teste passando" nao significa "calculo correto". Um teste unitario pode validar que `1000 x 0.18 = 180` e ainda assim produzir uma NF-e rejeitada pela SEFAZ por divergencia de arredondamento de R$0.01 (rejeicao 528).

Alem disso, as fontes de verdade para calculos fiscais tem niveis de autoridade diferentes:

- A legislacao (LC 87/96, RICMS, EC 87/2015) define as formulas.
- A SEFAZ valida matematica parcial na autorizacao (vICMS = vBC x pICMS, tolerancia R$0.01), mas NAO valida MVA, beneficio fiscal ou reducao de base.
- Uma NF-e autorizada (cStat 100) e evidencia empirica de que o calculo foi aceito, nao prova de corretude juridica (pode ser glosada em auditoria posterior, ate 5 anos).
- O MOC 7.0 (Manual de Orientacao do Contribuinte) e especificacao de schema XML e regras de validacao. Nao contem exemplos numericos de calculo.

Essas distincoes exigem que os testes sejam organizados por nivel de confianca, nao apenas por modulo.

## Decisao

### Tres niveis de teste

| Nivel                  | Arquivo                          | Fonte de verdade                 | Escopo                                                                                                                |
| ---------------------- | -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **E2E fiscal**         | `nfe-ground-truth.test.ts`       | NF-e reais (cStat 100)           | Nota inteira: todos os tributos presentes no documento testados juntos. Nunca fatiar por calculadora.                 |
| **Conformidade SEFAZ** | `sefaz-validation-rules.test.ts` | Regras de validacao do MOC/NTs   | Valida que nenhum output viola rejeicoes da SEFAZ (528, 529, 530, 534, 536, 694-696).                                 |
| **Unitario**           | `[calculadora].test.ts`          | Legislacao, formulas, edge cases | Formula isolada, validacao de input, regressao. Prefixo `[MOC]` no describe quando o caso vem de documento normativo. |

### Hierarquia de confianca

Quando ha conflito entre fontes: Legislacao > NT SEFAZ > NF-e real > Unitario.

Justificativa por nivel:

- **Legislacao prevalece sobre tudo** (art. 97 CTN). Regras de validacao do MOC nao tem forca de lei.
- **NT SEFAZ** atualiza o MOC e pode adicionar/alterar regras de validacao. Sempre prevalece sobre o MOC base.
- **NF-e real** e evidencia de aceitacao pratica. Se NF-e diverge do unitario, o unitario esta errado. Se NF-e diverge da legislacao, documentar como divergencia conhecida.
- **Unitario** e derivado da interpretacao do implementador sobre a legislacao. E o nivel mais fragil.

### NF-e como documento atomico

Uma NF-e e um fato fiscal indivisivel. Ela contem ICMS, IPI, PIS, COFINS, DIFAL, CBS, IBS, todos interdependentes. Fatiar por calculadora destroi a coerencia que torna o ground truth valioso.

Quando o arquivo crescer para 15-20+ NF-e, dividir por perfil de operacao (interestadual, ST, DIFAL), nao por calculadora.

### Tolerancias de arredondamento SEFAZ

| Rejeicao | Campo         | Regra                          | Tolerancia | Escopo   |
| -------- | ------------- | ------------------------------ | ---------- | -------- |
| 528      | vICMS         | vBC x pICMS                    | R$0.01     | Por item |
| 529      | vICMSST       | baseST x pICMSST - icmsProprio | R$0.01     | Por item |
| 530      | vIPI          | vBC x pIPI                     | R$0.01     | Por item |
| 534      | vPIS          | vBC x pPIS                     | R$0.01     | Por item |
| 536      | vCOFINS       | vBC x pCOFINS                  | R$0.01     | Por item |
| 694-696  | DIFAL/FCP     | Regras especificas             | R$0.01     | Por item |
| 631-652  | Totalizadores | Soma dos itens                 | Variavel   | Por nota |

A lib deve calcular pela legislacao com precisao maxima e usar a tolerancia apenas como rede de seguranca, nunca como alvo.

### O que o MOC NAO e

O MOC 7.0 e especificacao de schema XML + regras de validacao. Nao e manual de calculo. Nao contem exemplos numericos passo a passo. As fontes de calculo sao: legislacao, NTs e NF-e reais.

## Consequencias

- Cada arquivo de teste tem header explicito dizendo o que pertence e o que NAO pertence.
- Contributors sabem exatamente onde colocar cada tipo de teste (arvore de decisao de 3 perguntas no CLAUDE.md/CONTRIBUTING.md).
- Divergencias entre niveis sao documentadas com `TODO(nfe-divergencia)` e issue aberta.
- Feature futura identificada: `validarResultado()` exportada pela lib, replicando regras de validacao SEFAZ como diferencial competitivo.
