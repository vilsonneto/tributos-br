# ADR-001: Aritmetica decimal sobre strings

## Status

Aceito

## Contexto

A SEFAZ valida notas fiscais eletronicas (NF-e) com regras rigorosas de precisao.
Os erros de rejeicao **629** e **630** ocorrem quando:

```
vProd != vUnCom x qCom
```

Essa diferenca e causada por **drift de ponto flutuante IEEE 754**.
Exemplo classico:

```js
0.1 + 0.2 // 0.30000000000000004
1.064 * 39680 // 42219.52000000001 (espera-se 42219.52)
```

Em cenarios tributarios, esses erros se acumulam em:

- Calculo de ICMS por dentro: `vBC = vProd / (1 - aliq)`
- MVA ajustada: `MVA_aj = ((1 + MVA) * (1 - ALQ_inter) / (1 - ALQ_intra)) - 1`
- Rateio de frete proporcional entre itens

O `Number` do JavaScript usa IEEE 754 double (64 bits), com apenas ~15 digitos significativos.
`BigInt` resolve inteiros mas nao tem ponto decimal nativo — seria necessario reimplementar
a aritmetica decimal sobre BigInt de qualquer forma.

## Decisao

Todas as operacoes aritmeticas do motor (soma, subtracao, multiplicacao, divisao)
operam **exclusivamente sobre strings de digitos**. Nenhum valor intermediario passa
por `Number` como representacao de valor monetario.

A representacao interna e:

```ts
{ sign: 1 | -1, digits: string, exponent: number }
// -12.345 -> { sign: -1, digits: "12345", exponent: -3 }
// valor real = sign x int(digits) x 10^exponent
```

Os algoritmos usados sao os classicos de aritmetica escolar:

- **Soma/subtracao**: alinhamento por expoente + soma/subtracao digito a digito com carry/borrow
- **Multiplicacao**: long multiplication O(n\*m)
- **Divisao**: divisao longa com precisao configuravel

## Consequencias

### Positivas

- **Precisao exata**: `0.1 + 0.2 = 0.3`, sem surpresas
- **Zero dependencias**: nao depende de libs como decimal.js, big.js, etc.
- **Conformidade SEFAZ**: elimina rejeicoes 629/630 por drift
- **Auditavel**: cada operacao pode ser rastreada digito a digito
- **Tree-shakeable**: consumidores importam apenas o que usam

### Negativas

- **Performance**: O(n\*m) para multiplicacao vs O(1) amortizado de IEEE 754
- **Complexidade de implementacao**: mais codigo que usar `Number`
- **Tamanho do bundle**: maior que uma solucao baseada em `Number`

### Mitigacao de performance

Para o caso de uso tributario (valores monetarios com 2-10 casas decimais
e quantidades com ate 15 digitos), a performance e mais que suficiente.
O gargalo real em sistemas fiscais e I/O (rede, banco de dados), nao aritmetica.

## Alternativas consideradas

| Alternativa                  | Por que nao                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `Number` (IEEE 754)          | Drift causa rejeicao SEFAZ. Inaceitavel.                                |
| `BigInt` com fator de escala | Requer reimplementar aritmetica decimal. Mesma complexidade, sem ganho. |
| `decimal.js` / `big.js`      | Dependencia externa. Projeto tem meta de zero deps.                     |
| Decimal128 (proposta TC39)   | Ainda em Stage 1 (mar/2026). Nao disponivel em Node 18.                 |

## Referencias

- [Manual de Integracao NF-e](https://www.nfe.fazenda.gov.br/) — regras de validacao
- [Rejeicao 629/630](https://www.nfe.fazenda.gov.br/) — vProd divergente
- [IEEE 754 Double Precision](https://en.wikipedia.org/wiki/Double-precision_floating-point_format)
- [TC39 Decimal Proposal](https://github.com/tc39/proposal-decimal)
