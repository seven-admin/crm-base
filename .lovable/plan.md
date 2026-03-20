

# Corrigir validação de CPF para estrangeiros

## Problema
Dois pontos de validação exigem CPF incondicionalmente, bloqueando propostas de clientes estrangeiros:

1. **`src/hooks/useValidacaoFichaProposta.ts`** (linha 35): `if (!cliente.cpf)` → pendência "CPF do cliente não preenchido"
2. **`src/lib/validarContrato.ts`** (linha 26): `if (!contrato.cliente?.cpf)` → pendência "CPF do cliente não informado"

O tipo `Cliente` já possui os campos `nacionalidade` e `passaporte`, e o formulário de cadastro (`ClienteForm.tsx`) já trata corretamente a lógica brasileiro/estrangeiro (exige passaporte em vez de CPF). O problema é que as validações de proposta/contrato ignoram a nacionalidade.

## Solução

### 1. `src/hooks/useValidacaoFichaProposta.ts`
Substituir a validação fixa de CPF por lógica condicional:

```typescript
const isBrasileiro = !cliente.nacionalidade || cliente.nacionalidade.toLowerCase() === 'brasileira';
if (isBrasileiro) {
  if (!cliente.cpf) pendencias.push('CPF do cliente não preenchido');
} else {
  if (!cliente.passaporte) pendencias.push('Passaporte do cliente não preenchido');
}
```

### 2. `src/lib/validarContrato.ts`
Mesma lógica: se brasileiro, exigir CPF; se estrangeiro, exigir passaporte.

### Arquivos a modificar
- `src/hooks/useValidacaoFichaProposta.ts`
- `src/lib/validarContrato.ts`

