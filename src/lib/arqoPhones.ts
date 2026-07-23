import type { ArqoLeadWithRelations } from '@/types/arqo.types';

export interface ArqoPhoneOption {
  value: string;
  label: string;
}

function phoneKey(value: string) {
  return value.replace(/\D/g, '');
}

export function arqoLeadPhoneOptions(lead: Pick<ArqoLeadWithRelations, 'cliente' | 'telefones_adicionais'>): ArqoPhoneOption[] {
  const candidates = [
    { value: lead.cliente?.telefone, label: 'Telefone principal' },
    { value: lead.cliente?.whatsapp, label: 'WhatsApp' },
    ...(lead.telefones_adicionais ?? []).map((value, index) => ({
      value,
      label: `Telefone adicional ${index + 1}`,
    })),
  ];
  const seen = new Set<string>();

  return candidates.flatMap(({ value, label }) => {
    const trimmed = value?.trim();
    const key = trimmed ? phoneKey(trimmed) : '';
    if (!trimmed || !key || seen.has(key)) return [];
    seen.add(key);
    return [{ value: trimmed, label }];
  });
}
