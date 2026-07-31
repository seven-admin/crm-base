// Mapeia o JSON de uma proposta do NEXA (outro projeto Supabase) para os valores das
// variáveis do contrato. Retorna só o que veio preenchido — o merge no assistente não
// sobrescreve um campo do contrato com vazio da proposta.

import { formatarTelefone } from './documentUtils';

type Any = Record<string, any>;

// Telefone da proposta pode vir cru com DDI ("5555997073647") ou já formatado.
// Remove o 55 do país (quando há 12–13 dígitos) e aplica o formato padrão do CRM.
function fmtTelefone(v: unknown): string {
  let d = String(v ?? '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return d ? formatarTelefone(d) : '';
}

// Casa uma linha de pagamento (por trecho do nome do componente) com a chave da variável.
const PAGAMENTO_MAP: Array<[RegExp, string]> = [
  [/porta de entrada/i, 'pagamento_subsidio_entrada'],
  [/subs[ií]dio/i, 'pagamento_subsidio'],
  [/fgts/i, 'pagamento_fgts'],
  [/sinal/i, 'pagamento_sinal'],
  [/ato|recursos pr/i, 'pagamento_ato'],
  [/mensa/i, 'pagamento_mensais'],
  [/bal[ãa]o/i, 'pagamento_baloes'],
  [/da[çc][ãa]o/i, 'pagamento_dacao'],
  [/financiamento/i, 'pagamento_financiamento'],
  [/total geral/i, 'pagamento_total'],
];

// "R$ 120.000,00" (com espaço não-quebrável) -> 120000.00
function valorNumerico(s: string): number {
  return parseFloat(s.replace(/[^0-9,]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

export function propostaParaVariaveis(data: Any): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (k: string, v: unknown) => {
    const s = v == null ? '' : String(v).trim();
    if (s) out[k] = s;
  };

  const unit = data?.unit ?? {};
  const buyer = data?.buyer ?? {};
  const addr = buyer?.address ?? {};
  const spouse = data?.spouse ?? {};
  const broker = data?.broker ?? {};

  // Comprador
  set('nome_cliente', buyer.name);
  set('cpf_cliente', buyer.cpf);
  set('rg_cliente', [buyer.rg, buyer.rgIssuer].filter(Boolean).join(' '));
  set('email_cliente', buyer.email);
  set('telefone_cliente', fmtTelefone(buyer.phone));
  set('profissao_cliente', buyer.profession);
  set('renda_cliente', buyer.grossIncome);
  set('nacionalidade_cliente', buyer.nationality);
  set('estado_civil_cliente', buyer.maritalStatus);
  set('regime_bens', buyer.propertyRegime);
  set('nascimento_cliente', buyer.birthDate);
  set('endereco_cliente', [
    addr.street, addr.number, addr.complement, addr.city && addr.state ? `${addr.city}/${addr.state}` : addr.city, addr.zipCode,
  ].filter(Boolean).join(', '));

  // Cônjuge (só quando habilitado na proposta)
  if (spouse?.enabled) {
    set('conjuge_nome', spouse.name);
    set('conjuge_cpf', spouse.cpf);
    set('conjuge_rg', [spouse.rg, spouse.rgIssuer].filter(Boolean).join(' '));
    set('conjuge_email', spouse.email);
    set('conjuge_profissao', spouse.profession);
    set('conjuge_renda', spouse.grossIncome);
    set('conjuge_nascimento', spouse.birthDate);
  }

  // Unidade / empreendimento
  set('empreendimento', broker.projectName);
  set('unidade_numero', unit.unitNumber);
  set('unidade_tipologia', unit.typology);
  set('unidade_area', unit.privateArea);
  set('unidade_fase', unit.towerPhase);
  set('unidade_vagas', unit.parkingSpots);
  set('valor_unidade', unit.totalUnitValue);
  set('valor_contrato', unit.totalUnitValue);

  // Corretor / imobiliária
  set('corretor_nome', broker.brokerName);
  set('corretor_creci', broker.creci);
  set('corretor_telefone', fmtTelefone(broker.brokerPhone));
  set('imobiliaria', broker.realEstateTeam);
  set('proposta_codigo', broker.proposalCode);

  // Plano de pagamento — só linhas com valor > 0
  for (const row of data?.payment?.rows ?? []) {
    const comp = String(row?.component ?? '');
    const total = String(row?.total ?? '').trim();
    if (valorNumerico(total) === 0) continue;
    const hit = PAGAMENTO_MAP.find(([re]) => re.test(comp));
    if (hit) set(hit[1], total);
  }

  return out;
}
