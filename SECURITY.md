# Política de Segurança

## Versões suportadas

| Versão | Suporte |
|---|---|
| >= 1.0.0 | Patches de segurança |
| < 1.0.0 | Sem suporte (pré-release) |

## Como reportar uma vulnerabilidade

**Não abra um issue público para vulnerabilidades de segurança.**

Use uma das opções abaixo:

1. **GitHub Private Vulnerability Reporting** (recomendado) — acesse a aba "Security" do repositório e clique em "Report a vulnerability"
2. **Email** — envie para **vilson.neto57@gmail.com** com o assunto `[SECURITY] tributos-br`

### O que incluir no relatório

- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto esperado (ex: cálculo incorreto, rejeição SEFAZ)
- Versão do tributos-br afetada

## Prazo de resposta

| Etapa | Prazo |
|---|---|
| Confirmação de recebimento | Até 48 horas |
| Avaliação inicial | Até 7 dias |
| Patch para vulnerabilidades confirmadas | Até 30 dias |

## Escopo

Consideramos vulnerabilidades de segurança:

- **Erros de cálculo** que produzem resultados fiscalmente incorretos (ex: ICMS, IPI, ST, DIFAL com valores errados)
- **Comportamento não documentado** que causa rejeições SEFAZ em produção (erros 629/630)
- **Problemas de precisão** onde a classe `Decimal` produz resultados diferentes do esperado pela norma

## Divulgação responsável

Após a correção ser publicada, o relatório será divulgado publicamente como um advisory do GitHub com crédito ao pesquisador (se autorizado).
