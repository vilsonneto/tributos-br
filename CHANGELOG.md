# tributos-br

## 0.1.0

### Minor Changes

- Primeira release: motor de precisao decimal arbitraria.

  Classe `Decimal` imutavel com aritmetica sobre strings (zero IEEE 754),
  7 modos de arredondamento (HALF_UP padrao SEFAZ), e API completa:
  `add`, `sub`, `mul`, `div`, `round`, `toMoney`, `toRate`, comparacoes,
  `toFixed`, `toString`, `toJSON`.

  Zero dependencias externas. Compativel com Node >= 18.
