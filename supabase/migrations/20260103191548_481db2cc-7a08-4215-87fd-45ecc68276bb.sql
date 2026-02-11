-- Atualizar variável descricao_unidade para apontar para unidades.descricao
UPDATE contrato_variaveis 
SET origem = 'unidades', campo_origem = 'descricao'
WHERE chave = 'descricao_unidade';

-- Adicionar variável para observações da unidade
INSERT INTO contrato_variaveis (chave, label, categoria, origem, campo_origem, is_sistema, is_active, exemplo, tipo)
VALUES ('observacoes_unidade', 'Observações da Unidade', 'unidade', 'unidades', 'observacoes', true, true, 'Matrícula 6.987 do Cartório de Registro de Imóveis', 'texto')
ON CONFLICT (chave) DO NOTHING;