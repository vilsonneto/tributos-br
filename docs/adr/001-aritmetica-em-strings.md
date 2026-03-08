# ADR-001: Aritmética decimal sobre strings

## Status

Aceito

## Contexto

A SEFAZ valida notas fiscais eletrônicas (NF-e) com regras rigorosas de precisão.
Os erros de rejeição **629** e **630** ocorrem quando:

```
vProd != vUnCom x qCom
```

Essa diferença é causada por **drift de ponto flutuante IEEE 754**.
Exemplo clássico:

```js
0.1 + 0.2 // 0.30000000000000004
1.064 * 39680 // 42219.52000000001 (espera-se 42219.52)
```

Em cenários tributários, esses erros se acumulam em:

- Cálculo de ICMS por dentro: `vBC = vProd / (1 - aliq)`
- MVA ajustada: `MVA_aj = ((1 + MVA) * (1 - ALQ_inter) / (1 - ALQ_intra)) - 1`
- Rateio de frete proporcional entre itens

O `Number` do JavaScript usa IEEE 754 double (64 bits), com apenas ~15 dígitos significativos.
`BigInt` resolve inteiros mas não tem ponto decimal nativo — seria necessário reimplementar
a aritmética decimal sobre BigInt de qualquer forma.

## Decisão

Todas as operações aritméticas do motor (soma, subtração, multiplicação, divisão)
operam **exclusivamente sobre strings de dígitos**. Nenhum valor intermediário passa
por `Number` como representação de valor monetário.

A representação interna é:

```ts
{ sign: 1 | -1, digits: string, exponent: number }
// -12.345 -> { sign: -1, digits: "12345", exponent: -3 }
// valor real = sign x int(digits) x 10^exponent
```

Os algoritmos usados são os clássicos de aritmética escolar:

- **Soma/subtração**: alinhamento por expoente + soma/subtração dígito a dígito com carry/borrow
- **Multiplicação**: long multiplication O(n\*m)
- **Divisão**: divisão longa com precisão configurável

## Consequências

### Positivas

- **Precisão exata**: `0.1 + 0.2 = 0.3`, sem surpresas
- **Zero dependências**: não depende de libs como decimal.js, big.js, etc.
- **Conformidade SEFAZ**: elimina rejeições 629/630 por drift
- **Auditável**: cada operação pode ser rastreada dígito a dígito
- **Tree-shakeable**: consumidores importam apenas o que usam

### Negativas

- **Performance**: O(n\*m) para multiplicação vs O(1) amortizado de IEEE 754
- **Complexidade de implementação**: mais código que usar `Number`
- **Tamanho do bundle**: maior que uma solução baseada em `Number`

### Mitigação de performance

Para o caso de uso tributário (valores monetários com 2-10 casas decimais
e quantidades com até 15 dígitos), a performance é mais que suficiente.
O gargalo real em sistemas fiscais é I/O (rede, banco de dados), não aritmética.

## Alternativas consideradas

| Alternativa                  | Por que não                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `Number` (IEEE 754)          | Drift causa rejeição SEFAZ. Inaceitável.                                |
| `BigInt` com fator de escala | Requer reimplementar aritmética decimal. Mesma complexidade, sem ganho. |
| `decimal.js` / `big.js`      | Dependência externa. Projeto tem meta de zero deps.                     |
| Decimal128 (proposta TC39)   | Ainda em Stage 1 (mar/2026). Não disponível em Node 18.                 |

## Referências

- [Manual de Integração NF-e](https://www.nfe.fazenda.gov.br/) — regras de validação
- [Rejeição 629/630](https://www.nfe.fazenda.gov.br/) — vProd divergente
- [IEEE 754 Double Precision](https://en.wikipedia.org/wiki/Double-precision_floating-point_format)
- [TC39 Decimal Proposal](https://github.com/tc39/proposal-decimal)
