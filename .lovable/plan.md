
# Corrigir botao Salvar do formulario de Empreendimento

## Problema identificado

O formulario usa `form.handleSubmit(onSubmit)` sem um callback de erro. Quando a validacao Zod falha (por exemplo, um campo obrigatorio no passo 1), o botao "Salvar" no passo 3 simplesmente nao faz nada - sem toast, sem indicacao visual.

## Solucao

Duas alteracoes no arquivo `src/components/empreendimentos/EmpreendimentoForm.tsx`:

### 1. Adicionar callback de erro no handleSubmit

Passar um segundo argumento para `form.handleSubmit` que:
- Mostra um toast de erro informando que ha campos invalidos
- Navega automaticamente para o passo que contem o primeiro erro

```typescript
const onError = (errors: any) => {
  // Campos do passo 1
  const step1Fields = ['nome', 'tipo', 'status', 'incorporadora_id', 'responsavel_comercial_id', 'descricao_curta', 'descricao_completa', 'legenda_status_visiveis', 'mapa_label_formato'];
  // Campos do passo 2
  const step2Fields = ['endereco_logradouro', 'endereco_numero', 'endereco_complemento', 'endereco_bairro', 'endereco_cidade', 'endereco_uf', 'endereco_cep'];
  
  const errorKeys = Object.keys(errors);
  if (errorKeys.some(k => step1Fields.includes(k))) {
    setCurrentStep(1);
  } else if (errorKeys.some(k => step2Fields.includes(k))) {
    setCurrentStep(2);
  } else {
    setCurrentStep(3);
  }
  toast.error('Verifique os campos obrigatorios');
};
```

E alterar o form para:
```html
<form onSubmit={form.handleSubmit(onSubmit, onError)} ...>
```

### 2. Adicionar log de debug no onSubmit

Adicionar um `console.log` temporario no inicio do `onSubmit` para confirmar que esta sendo chamado:
```typescript
const onSubmit = async (values) => {
  console.log('Form submitted with values:', values);
  // ... resto do codigo
};
```

## Arquivo afetado

| Arquivo | Alteracao |
|---|---|
| `src/components/empreendimentos/EmpreendimentoForm.tsx` | Adicionar callback `onError` no `handleSubmit` + toast de erro + navegacao para o passo com erro |
