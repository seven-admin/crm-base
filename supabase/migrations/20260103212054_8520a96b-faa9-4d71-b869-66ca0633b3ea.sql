-- Adicionar variáveis de pagamento ao contrato
INSERT INTO public.contrato_variaveis (chave, label, exemplo, categoria, tipo, is_sistema, is_active) VALUES
('valor_entrada', 'Valor da Entrada', 'R$ 50.000,00 (cinquenta mil reais)', 'pagamento', 'calculado', true, true),
('qtd_parcelas_entrada', 'Quantidade de Parcelas da Entrada', '3 (três)', 'pagamento', 'calculado', true, true),
('qtd_parcelas_mensais', 'Quantidade de Parcelas Mensais', '36 (trinta e seis)', 'pagamento', 'calculado', true, true),
('valor_parcela_mensal', 'Valor da Parcela Mensal', 'R$ 2.500,00 (dois mil e quinhentos reais)', 'pagamento', 'calculado', true, true),
('total_parcelas_mensais', 'Total das Parcelas Mensais', 'R$ 90.000,00 (noventa mil reais)', 'pagamento', 'calculado', true, true),
('qtd_parcelas_anuais', 'Quantidade de Parcelas Anuais', '3 (três)', 'pagamento', 'calculado', true, true),
('valor_parcela_anual', 'Valor da Parcela Anual', 'R$ 10.000,00 (dez mil reais)', 'pagamento', 'calculado', true, true),
('total_parcelas_anuais', 'Total das Parcelas Anuais', 'R$ 30.000,00 (trinta mil reais)', 'pagamento', 'calculado', true, true),
('valor_intermediarias', 'Valor das Intermediárias', 'R$ 30.000,00 (trinta mil reais)', 'pagamento', 'calculado', true, true),
('valor_residual', 'Valor Residual/Saldo Final', 'R$ 180.000,00 (cento e oitenta mil reais)', 'pagamento', 'calculado', true, true),
('indice_correcao', 'Índice de Correção', 'IPCA', 'pagamento', 'texto', true, true),
('data_primeira_parcela', 'Data da Primeira Parcela', '15 de março de 2024', 'pagamento', 'data', true, true)
ON CONFLICT (chave) DO NOTHING;