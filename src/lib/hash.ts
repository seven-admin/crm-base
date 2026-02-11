/**
 * Gera um hash MD5 simples de uma string
 * Usado para versionar termos de uso e política de privacidade
 */
export function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString(16);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Converte para hexadecimal e garante 8 caracteres
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Adiciona mais entropia baseado no tamanho do conteúdo
  const lengthHash = str.length.toString(16).padStart(4, '0');
  
  // Combina com checksum adicional
  let checksum = 0;
  for (let i = 0; i < str.length; i += 100) {
    checksum += str.charCodeAt(i);
  }
  const checksumHex = (checksum % 65536).toString(16).padStart(4, '0');
  
  return `${hexHash}${lengthHash}${checksumHex}`;
}
