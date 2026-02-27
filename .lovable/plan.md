
# Alterar configuracao de CPF: obrigatoriedade vs validacao

## Resumo

Atualmente, o toggle "Validar CPF" controla se o CPF e validado ou nao. O usuario quer mudar o comportamento para:

- **Toggle controla se o CPF e obrigatorio** (exigir preenchimento ou nao)
- **Validacao de formato sempre acontece** quando um CPF for informado, independente do toggle

## Alteracoes

### 1. Configuracoes.tsx - Atualizar texto e chave

Renomear a configuracao para refletir o novo comportamento:

- Chave: `exigir_cpf_clientes` (nova) ou reutilizar `validar_cpf_clientes` mudando apenas o texto
- Titulo: "Exigir CPF no cadastro de clientes"
- Descricao: "Quando ativado, o CPF sera obrigatorio no cadastro. A validacao de formato sera feita sempre que um CPF for informado."

### 2. ClienteForm.tsx - Ajustar schema de validacao

Modificar `createClienteSchema` para receber `exigirCpf` em vez de `validarCpf`:

- **Se `exigirCpf = true`**: CPF e obrigatorio para brasileiros + validacao de formato
- **Se `exigirCpf = false`**: CPF e opcional, mas se preenchido, valida o formato
- **Validacao de formato sempre ativa**: `validarCPF()` e chamado sempre que houver valor no campo

```text
function createClienteSchema(exigirCpf: boolean) {
  return formSchemaBase.superRefine((data, ctx) => {
    const isBrasileiro = isBrasileiroNacionality(data.nacionalidade);

    if (isBrasileiro) {
      const cpfDigits = data.cpf?.replace(/\D/g, '') || '';

      // Se exigir CPF, campo obrigatorio
      if (exigirCpf && cpfDigits.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF é obrigatório',
          path: ['cpf'],
        });
      }

      // Sempre validar formato quando preenchido
      if (cpfDigits.length > 0 && !validarCPF(data.cpf!)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF inválido',
          path: ['cpf'],
        });
      }
    }

    // ... passaporte para estrangeiros (sem mudanca)
  });
}
```

### 3. Label do campo CPF no formulario

Quando `exigirCpf` estiver ativo, mostrar asterisco (*) no label do campo CPF para indicar obrigatoriedade.

### Arquivos modificados

- `src/pages/Configuracoes.tsx` -- texto e descricao do toggle
- `src/components/clientes/ClienteForm.tsx` -- logica do schema e label condicional
