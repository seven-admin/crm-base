

# Corrigir qtd_participantes com dados reais dos comentários

## Dados identificados

Comparando `qtd_participantes` atual vs número real nos comentários:

| Atividade | Atual | Comentário (real) | Ação |
|-----------|-------|-------------------|------|
| ANTONIAZZI | NULL | 4 | Preencher |
| FABIANO PAYNES | NULL | 4 | Preencher |
| SANTA IMÓVEIS | NULL | 11 | Preencher |
| MOI CAMOBI | NULL | 13 | Preencher |
| CONECTA | 8 | 7 | Corrigir |
| EDER RIBEIRO | 12 | 10 | Corrigir |
| ESPLENDI | 8 | 3 | Corrigir |
| BITENCOURT | 4 | 2 | Corrigir |
| INVISTA | 8 | 6 | Corrigir |
| ITAIMBÉ | 5 | 4 | Corrigir |

**Total: 10 registros** (4 NULL + 6 divergentes)

## Solução

Executar UPDATE via insert tool para cada registro usando os IDs das atividades já identificados:

```sql
UPDATE atividades SET qtd_participantes = 4 WHERE id = '6b19c07d-...';  -- ANTONIAZZI
UPDATE atividades SET qtd_participantes = 4 WHERE id = '6116b100-...';  -- FABIANO PAYNES
UPDATE atividades SET qtd_participantes = 11 WHERE id = '2af137d7-...'; -- SANTA IMÓVEIS
UPDATE atividades SET qtd_participantes = 13 WHERE id = '4da4ef1b-...'; -- MOI CAMOBI
UPDATE atividades SET qtd_participantes = 7 WHERE id = '458d6e22-...';  -- CONECTA
UPDATE atividades SET qtd_participantes = 10 WHERE id = 'c8b9252a-...'; -- EDER RIBEIRO
UPDATE atividades SET qtd_participantes = 3 WHERE id = 'b44070f2-...';  -- ESPLENDI
UPDATE atividades SET qtd_participantes = 2 WHERE id = '633b92af-...';  -- BITENCOURT
UPDATE atividades SET qtd_participantes = 6 WHERE id = '574ffa9f-...';  -- INVISTA
UPDATE atividades SET qtd_participantes = 4 WHERE id = '6f64e784-...';  -- ITAIMBÉ
```

Sem alterações de código. Apenas data update.

