-- Variáveis de sistema derivadas do valor do contrato, escritas por extenso.
-- Resolvidas em resolverValoresAutomaticos a partir de contrato.valor (numeroExtenso.ts).
INSERT INTO public.nexa_contrato_variaveis (chave, label, descricao, tipo, is_sistema, is_active, fonte_sugerida)
SELECT 'valor_contrato_extenso', 'Valor do Contrato (por extenso)',
       'Valor total do contrato escrito por extenso', 'texto', true, true, 'contrato.valor'
WHERE NOT EXISTS (SELECT 1 FROM public.nexa_contrato_variaveis WHERE chave = 'valor_contrato_extenso');

INSERT INTO public.nexa_contrato_variaveis (chave, label, descricao, tipo, is_sistema, is_active, fonte_sugerida)
SELECT 'valor_contrato_completo', 'Valor do Contrato (R$ + por extenso)',
       'Ex.: R$ 1.234.567,89 (um milhão... reais e oitenta e nove centavos)', 'texto', true, true, 'contrato.valor'
WHERE NOT EXISTS (SELECT 1 FROM public.nexa_contrato_variaveis WHERE chave = 'valor_contrato_completo');
