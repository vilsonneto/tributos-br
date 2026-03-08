# tributos-br

## 1.0.0

### Major Changes

- 4b239a2: Motor de cálculo tributário brasileiro v1.0.0

  Calculadoras implementadas:
  - calcIcms() — ICMS próprio (por dentro / por fora)
  - calcIpi() — IPI sobre produto
  - calcMvaAjustada() — MVA ajustada interestadual (com FECOP)
  - calcSt() — ICMS-ST unificada (5 cenários via parâmetros)
  - calcDifal() — DIFAL base única + base dupla (LC 190/2022)
  - calcCbs() — CBS (reforma tributária, LC 214/2025)
  - calcIbs() — IBS (reforma tributária, LC 214/2025)

  Novidades:
  - Audit trail em todas as calculadoras (AuditStep[] com step, formula e value)
  - Logo SVG com suporte light/dark mode
  - README com exemplos de todos os cenários
  - 265 testes, coverage 95%+

## 0.1.0

### Minor Changes

- Primeira release: motor de precisão decimal arbitrária.

  Classe `Decimal` imutável com aritmética sobre strings (zero IEEE 754),
  7 modos de arredondamento (HALF_UP padrão SEFAZ), e API completa:
  `add`, `sub`, `mul`, `div`, `round`, `toMoney`, `toRate`, comparações,
  `toFixed`, `toString`, `toJSON`.

  Zero dependências externas. Compatível com Node >= 18.
