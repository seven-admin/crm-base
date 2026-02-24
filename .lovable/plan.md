
# Separação Completa: Forecast na aba Comercial + Diário de Bordo

## Status: ✅ IMPLEMENTADO

## O que foi feito

1. **Sidebar reorganizado** — "Atividades" aparece em dois grupos com contexto diferente:
   - Comercial → `/atividades?contexto=forecast`
   - Diário de Bordo → `/atividades?contexto=diario`

2. **Página `/atividades` filtra por contexto** — lê `?contexto=` da URL, aplica `TIPOS_FORECAST` ou `TIPOS_DIARIO`, título e subtítulo dinâmicos

3. **Hook `useAtividades`** — suporta `tipos?: AtividadeTipo[]` no filtro, aplicando `.in('tipo', tipos)` na query

4. **Formulário `AtividadeForm`** — recebe `tiposPermitidos` e só mostra os tipos permitidos no grid de seleção

5. **Forecast e Diário de Bordo** — cada página passa `tiposPermitidos` ao form de criação de atividades
