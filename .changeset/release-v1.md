---
"tributos-br": major
---

Motor de calculo tributario brasileiro v1.0.0

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
