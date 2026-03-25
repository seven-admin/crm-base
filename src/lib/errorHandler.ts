/**
 * Tratamento seguro de erros — oculta dados sensíveis do banco de dados.
 * 
 * Gera um código de erro único para rastreamento via console do navegador.
 * Apenas admins/devs com acesso ao DevTools conseguem ver os detalhes técnicos.
 */

function generateErrorCode(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `ERR-${timestamp}-${random}`;
}

const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /row-level security/i, message: 'Você não tem permissão para esta ação' },
  { pattern: /duplicate key|unique constraint|already exists/i, message: 'Registro duplicado. Verifique os dados informados' },
  { pattern: /foreign key|violates.*reference/i, message: 'Registro vinculado não encontrado' },
  { pattern: /not.null|null value/i, message: 'Campos obrigatórios não preenchidos' },
  { pattern: /check constraint/i, message: 'Dados informados são inválidos' },
  { pattern: /timeout|statement canceled/i, message: 'A operação demorou demais. Tente novamente' },
  { pattern: /network|fetch|failed to fetch|ERR_NETWORK/i, message: 'Erro de conexão. Verifique sua internet' },
];

/**
 * Sanitiza a mensagem de erro para exibição ao usuário.
 * Detalhes técnicos ficam apenas no console.error.
 * 
 * @param error - Erro bruto (Error, string, ou qualquer objeto)
 * @param contexto - Descrição amigável da ação (ex: "cadastrar cliente")
 * @returns Mensagem segura para exibição ao usuário
 */
export function sanitizeErrorMessage(error: unknown, contexto: string): string {
  const errorCode = generateErrorCode();
  const rawMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : JSON.stringify(error);

  // Log completo no console para admins/devs
  console.error(`[${errorCode}] Erro ao ${contexto}:`, {
    mensagem: rawMessage,
    erro: error,
    timestamp: new Date().toISOString(),
  });

  // Verifica padrões conhecidos para mensagem mais útil
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return `${message}. (Código: ${errorCode})`;
    }
  }

  // Mensagem genérica
  return `Não foi possível ${contexto}. (Código: ${errorCode})`;
}
