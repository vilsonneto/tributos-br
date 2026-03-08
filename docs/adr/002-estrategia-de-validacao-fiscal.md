# ADR-002: Estratégia de validação de cálculos fiscais

## Status

Aceito

## Contexto

Aritmética correta (ADR-001) é condição necessária, mas não suficiente para conformidade fiscal. Uma calculadora pode usar precisão decimal exata e ainda assim produzir um resultado errado segundo a SEFAZ — por ter interpretado incorretamente a ordem de arredondamento, a composição da base de cálculo, ou a aplicação de um normativo.

O problema central é que a legislação tributária brasileira frequentemente especifica a fórmula sem especificar detalhes operacionais críticos:

- A base de cálculo intermediária é arredondada antes de ser usada na próxima operação, ou só o resultado final é arredondado?
- Determinado item compõe ou não a base de cálculo dependendo do regime do contribuinte?
- Qual portaria prevalece quando há conflito entre convênios estaduais?

Essas ambiguidades não aparecem em uma sessão de TDD derivada da leitura da lei. Elas só se manifestam quando o resultado calculado diverge de uma NF-e real aceita pela autorizadora SEFAZ.

## Decisão

### O ground truth de um cálculo fiscal é uma NF-e aceita pela SEFAZ autorizadora

Fórmulas derivadas da leitura da legislação podem conter interpretações equivocadas. Um documento aceito pela autorizadora elimina ambiguidades de ordem de arredondamento e composição de base porque o resultado já passou pela validação do fisco.

Sempre que possível, os casos de teste principais de cada calculadora devem ser rastreáveis até um documento real: uma NF-e autorizada, um exemplo oficial da SEFAZ, ou um valor publicado em normativo com exemplo numérico.

### Testes são derivados da lei e de documentos reais, nunca da implementação

O processo correto para implementar uma calculadora:

1. Entender a regra a partir do normativo (Convênio ICMS, Lei Complementar, Portaria SEFAZ).
2. Escrever os testes a partir da tipagem da função e dos valores do documento real — sem olhar para a implementação.
3. Implementar a função até os testes passarem.

Se não é possível escrever os testes sem olhar a implementação, isso indica que a regra de negócio não está clara o suficiente para ser implementada com segurança.

### Testes de calculadoras fiscais só mudam quando a lei muda

Um teste que verifica o resultado de um cálculo fiscal é um contrato com a legislação vigente. Ele não deve ser alterado para acomodar a implementação. Se o teste falha, há exatamente três causas possíveis:

1. **A regra foi mal entendida.** O teste foi construído com uma interpretação incorreta do normativo. Nesse caso, pare a implementação, revise a regra e corrija o teste antes de continuar.

2. **A função está incorreta.** O teste representa o valor correto segundo a lei, mas a implementação diverge. Corrija a função.

3. **A lei admite duas interpretações legítimas.** O teste e a função são coerentes com leituras diferentes do mesmo normativo. Nesse caso, a decisão de qual interpretação adotar deve ser documentada — no código (JSDoc), em um ADR se for significativa, e no teste via comentário explicando o fundamento escolhido.

Em nenhum caso é aceitável ajustar o valor esperado no `expect` para corresponder ao output da função sem antes identificar a qual das três causas acima o caso pertence.

### Cobertura é condição necessária, não suficiente

O threshold de 95% garante que o código está sendo exercitado, mas não garante que os resultados estão corretos segundo a lei. É possível atingir 100% de branch coverage com testes que apenas verificam que a função retorna algo sem validar o valor.

O foco principal é a correção dos resultados. Cobertura é uma métrica de apoio para encontrar código não exercitado, não um objetivo em si.

## Consequências

### Positivas

- **Rastreabilidade:** cada caso de teste principal pode ser auditado contra um documento real ou normativo.
- **Confiança no refactor:** se os testes não mudam quando a lei não mudou, um teste que quebra após refactor indica regressão real.
- **Clareza para contribuidores:** o critério de aceitação de uma implementação é objetivo — produz o mesmo resultado que o documento de referência.

### Negativas

- **Custo de pesquisa:** exige que o implementador encontre ou construa casos reais antes de escrever a função.
- **Ambiguidade de interpretação:** quando não existe NF-e de referência disponível, a escolha da interpretação precisa ser justificada e documentada explicitamente.

## Formato esperado de um caso de teste fiscal

```ts
it('calcula ICMS por dentro — NF-e modelo 55, operação interna SP, alíquota 18%', () => {
  // Fonte: Manual de Orientação do Contribuinte v7.0, Anexo I, exemplo 3.2
  // vProd = 1000.00, alíquota = 18% → BC = vProd / (1 - 0.18) = 1219.51 (HALF_UP, 2 casas)
  // vICMS = BC × 0.18 = 219.51
  const resultado = calcICMS({ vProd: '1000.00', aliquota: '18' })
  expect(resultado.vBC.toMoney()).toBe('1219.51')
  expect(resultado.vICMS.toMoney()).toBe('219.51')
})
```

O comentário deve indicar a fonte do valor de referência e explicitar a ordem de arredondamento quando ela for relevante para o resultado.

## Referências

- [Manual de Orientação do Contribuinte NF-e](https://www.nfe.fazenda.gov.br/) — exemplos numéricos oficiais
- [Convênio ICMS 142/2018](http://www.confaz.fazenda.gov.br/) — ST e DIFAL
- [Lei Complementar 87/1996 (Lei Kandir)](http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm) — base do ICMS
- ADR-001 — por que aritmética em strings ao invés de IEEE 754
