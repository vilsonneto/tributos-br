---
'tributos-br': minor
---

FCP como campo separado em calcIcms e calcDifal

- `calcIcms` aceita `fcp?: DecimalInput` e retorna `fcp?: Decimal` no resultado, com audit step "FCP". Corresponde a vFCP no XML da NF-e.
- `calcDifal` com `fecop` agora retorna `fcp` separado (= vFCPUFDest) e `difal` sem FCP (= vICMSUFDest). O FECOP continua no denominador da base dupla/reduzida.
- NF-e #9 adicionada ao ground truth (primeira com vFCPUFDest > 0).
- NF-e #6 atualizada para usar a API nativa ao inves do workaround.

**Breaking (correcao fiscal):** `calcDifal` com `fecop` retornava `difal` incluindo FCP. Agora `difal` exclui FCP, que vem no campo `fcp`. O comportamento anterior era fiscalmente incorreto (SEFAZ valida vICMSUFDest e vFCPUFDest como campos separados).
