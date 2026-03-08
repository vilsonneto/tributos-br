# tributos-br

## 1.0.0

### Major Changes

- 4b239a2: Motor de calculo tributario brasileiro v1.0.0

  Calculadoras implementadas:
  - calcIcms() — ICMS proprio (por dentro / por fora)
  - calcIpi() — IPI sobre produto
  - calcMvaAjustada() — MVA ajustada interestadual (com FECOP)
  - calcSt() — ICMS-ST unificada (5 cenarios via parametros)
  - calcDifal() — DIFAL base unica + base dupla (LC 190/2022)
  - calcCbs() — CBS (reforma tributaria, LC 214/2025)
  - calcIbs() — IBS (reforma tributaria, LC 214/2025)

  Novidades:
  - Audit trail em todas as calculadoras (AuditStep[] com step, formula e value)
  - Logo SVG com suporte light/dark mode
  - README com exemplos de todos os cenarios
  - 265 testes, coverage 95%+

## 0.1.0

### Minor Changes

- Primeira release: motor de precisao decimal arbitraria.

  Classe `Decimal` imutavel com aritmetica sobre strings (zero IEEE 754),
  7 modos de arredondamento (HALF_UP padrao SEFAZ), e API completa:
  `add`, `sub`, `mul`, `div`, `round`, `toMoney`, `toRate`, comparacoes,
  `toFixed`, `toString`, `toJSON`.

  Zero dependencias externas. Compativel com Node >= 18.
