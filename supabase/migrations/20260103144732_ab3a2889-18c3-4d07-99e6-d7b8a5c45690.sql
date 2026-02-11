-- Insert default legal terms configurations
INSERT INTO configuracoes_sistema (chave, valor, categoria) VALUES 
('termos_uso', '# Termos de Uso do Sistema

**Nota:** Este documento estabelece as regras para o uso da plataforma pelos colaboradores, corretores e parceiros da Seven Group 360.

## 1. Aceitação dos Termos

Ao acessar o Sistema de Gestão Seven Group 360, o usuário concorda em cumprir estes termos e todas as leis aplicáveis. O acesso é restrito a usuários autorizados e mediante autenticação única.

## 2. Descrição do Serviço

O sistema consiste em uma plataforma de gestão imobiliária integrada, abrangendo:

- Gestão de leads e clientes;
- Pipeline de negociações e propostas;
- Geração e assinatura digital de contratos;
- Controle de comissões e lançamentos financeiros;
- Gestão de demandas de marketing e eventos.

## 3. Responsabilidades do Usuário

**Segurança da Conta:** O usuário é responsável por manter a confidencialidade de suas credenciais de acesso.

**Veracidade dos Dados:** O usuário garante que todas as informações inseridas (especialmente em contratos e propostas) são verídicas.

**Uso Ético:** É proibido o uso do sistema para fins ilícitos, extração de dados não autorizada (scraping) ou compartilhamento de acesso com terceiros não vinculados à empresa.

## 4. Propriedade Intelectual

Todo o código-fonte, design, logotipos e metodologias (incluindo a lógica de cálculo de comissões e automações de fluxo) são de propriedade exclusiva da Seven Group 360.

## 5. Limitação de Responsabilidade

O sistema é fornecido "como está". Embora busquemos 100% de disponibilidade, não nos responsabilizamos por interrupções decorrentes de falhas nos serviços de infraestrutura (como Supabase/AWS) ou conexão de internet do usuário.', 'legal'),
('politica_privacidade', '# Política de Privacidade

## 1. Finalidade da Coleta de Dados

Em conformidade com o Art. 7º da LGPD, coletamos dados para:

**Execução de Contrato:** Processar a compra e venda de imóveis e gerar instrumentos jurídicos.

**Legítimo Interesse:** Gerir o relacionamento com o cliente (CRM) e otimizar o pipeline comercial.

**Cumprimento de Obrigação Legal:** Emissão de Notas Fiscais e registros de auditoria financeira.

## 2. Dados Coletados

**Dados Pessoais:** Nome, CPF, RG, e-mail, telefone, endereço, estado civil e profissão (coletados no módulo de Clientes).

**Dados Financeiros:** Renda mensal (para qualificação de crédito) e dados bancários (para pagamento de comissões).

**Dados de Navegação:** Endereço IP, data/hora de acesso e logs de alterações (armazenados no módulo de Auditoria).

## 3. Compartilhamento de Dados

Os dados poderão ser compartilhados com:

**Provedores de Infraestrutura:** Supabase (armazenamento de banco de dados e arquivos).

**Órgãos Públicos:** Quando necessário para registro de incorporação ou obrigações fiscais.

**Parceiros:** Imobiliárias e corretores, estritamente limitados aos dados necessários para a negociação em que estão vinculados.

## 4. Direitos do Titular (Art. 18 da LGPD)

O titular dos dados (cliente ou colaborador) pode solicitar a qualquer momento:

- Confirmação da existência de tratamento;
- Acesso e correção de dados incompletos ou inexatos;
- Anonimização ou eliminação de dados desnecessários;
- Revogação do consentimento (quando aplicável).

## 5. Segurança da Informação e Salvaguardas

Implementamos medidas técnicas para garantir a proteção dos dados:

**Criptografia:** Dados em repouso e em trânsito (SSL/TLS).

**RLS (Row Level Security):** Políticas de banco de dados que garantem que um corretor só veja os seus próprios clientes e negociações.

**Logs de Auditoria:** Rastreabilidade total de quem visualizou, editou ou excluiu qualquer dado no sistema.

## 6. Retenção de Dados

Os dados serão mantidos pelo período necessário para cumprir as finalidades descritas ou conforme prazos legais de prescrição (ex: 5 anos para documentos fiscais/contratuais).', 'legal')
ON CONFLICT (chave) DO NOTHING;