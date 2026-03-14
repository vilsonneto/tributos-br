# tributos-br

## 1.2.0

### Minor Changes

- 5dfa982: FCP como campo separado em calcIcms e calcDifal
  - `calcIcms` aceita `fcp?: DecimalInput` e retorna `fcp?: Decimal` no resultado, com audit step "FCP". Corresponde a vFCP no XML da NF-e.
  - `calcDifal` com `fecop` agora retorna `fcp` separado (= vFCPUFDest) e `difal` sem FCP (= vICMSUFDest). O FECOP continua no denominador da base dupla/reduzida.
  - NF-e #9 adicionada ao ground truth (primeira com vFCPUFDest > 0).
  - NF-e #6 atualizada para usar a API nativa ao inves do workaround.

  **Breaking (correcao fiscal):** `calcDifal` com `fecop` retornava `difal` incluindo FCP. Agora `difal` exclui FCP, que vem no campo `fcp`. O comportamento anterior era fiscalmente incorreto (SEFAZ valida vICMSUFDest e vFCPUFDest como campos separados).

## 1.1.0

### Minor Changes

- calcDifal() — novo modo `baseReduzida` para ICMS CST 20 com benefício fiscal

  Quando há redução de base de cálculo (pRedBC), a base do DIFAL de destino
  precisa ser recalculada via ICMS "por dentro", com intermediários arredondados
  a 2 casas (campos monetários do XML da NF-e).

  Descoberto a partir de NF-e real (EMANX, SEFAZ/MG, cStat 100): sem este modo,
  o calcDifal retornava DIFAL de R$ 0,73 quando o valor correto é R$ 1,22.

  Uso:

  ```ts
  calcDifal({
    valorOperacao: '12.20', // base já reduzida pelo caller
    aliquotaInterestadual: '0.12',
    aliquotaInternaDestino: '0.18',
    destinatarioContribuinte: false,
    baseReduzida: true, // ← novo parâmetro
  })
  ```

- NF-e ground truth: 8 NF-e reais, 53 testes rastreáveis a documentos aceitos pela SEFAZ
- ADR-002 atualizado com caso concreto de gap descoberto por NF-e real

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
