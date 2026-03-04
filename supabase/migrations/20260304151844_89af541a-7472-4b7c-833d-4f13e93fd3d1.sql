
-- Corrigir qtd_participantes com dados reais dos comentários (10 registros)

-- 4 registros NULL → preencher
UPDATE atividades SET qtd_participantes = 4 WHERE id = '6b19c07d-cb34-4ceb-b769-3487fd63981a';  -- ANTONIAZZI
UPDATE atividades SET qtd_participantes = 4 WHERE id = '6116b100-ef64-4854-9f9c-b50c3bf73f2b';  -- FABIANO PAYNES
UPDATE atividades SET qtd_participantes = 11 WHERE id = '2af137d7-c9d6-44a3-b603-89034f75d04a'; -- SANTA IMÓVEIS
UPDATE atividades SET qtd_participantes = 13 WHERE id = '4da4ef1b-2070-4af4-be96-499a0f881fc2'; -- MOI CAMOBI

-- 6 registros divergentes → corrigir para valor real
UPDATE atividades SET qtd_participantes = 7 WHERE id = '458d6e22-5bba-42b2-bd86-10512375c78f';  -- CONECTA
UPDATE atividades SET qtd_participantes = 10 WHERE id = 'c8b9252a-1064-4114-8c34-f8e61c4e849c'; -- EDER RIBEIRO
UPDATE atividades SET qtd_participantes = 3 WHERE id = 'b44070f2-677e-499a-a311-f1c09bdfc4b4';  -- ESPLENDI
UPDATE atividades SET qtd_participantes = 2 WHERE id = '633b92af-d912-4421-8c8f-cb5d1992403c';  -- BITENCOURT
UPDATE atividades SET qtd_participantes = 6 WHERE id = '574ffa9f-6b49-4104-84c9-903993990c4c';  -- INVISTA
UPDATE atividades SET qtd_participantes = 4 WHERE id = '6f64e784-aebf-4751-9e61-c487cbf9c29c';  -- ITAIMBÉ
