import { Building2, CreditCard, Landmark, Loader2, User, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useProposta, PROPOSTA_STATUS_LABEL, type PropostaFeedItem } from '@/hooks/useNexaPropostas';
import { formatarTelefone } from '@/lib/documentUtils';

interface Props {
  item: PropostaFeedItem | null;
  onOpenChange: (v: boolean) => void;
}

function tel(v: unknown): string {
  let d = String(v ?? '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return d ? formatarTelefone(d) : '';
}

function money(v: unknown): string {
  if (v == null || v === '') return '';
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9,-]/g, '').replace(/\./g, '').replace(',', '.'));
  if (Number.isFinite(n) && n !== 0) return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return String(v);
}

function Field({ label, value }: { label: string; value: unknown }) {
  const v = value == null ? '' : String(value).trim();
  if (!v) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm">{v}</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/[.07] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-primary">{icon} {title}</p>
      {children}
    </div>
  );
}

export function PropostaDetalheDialog({ item, onOpenChange }: Props) {
  const { data: proposta, isLoading } = useProposta(item?.proposal_code ?? null);
  const d = (proposta?.found ? proposta.data : null) as any;

  const unit = d?.unit ?? {};
  const buyer = d?.buyer ?? {};
  const addr = buyer?.address ?? {};
  const spouse = d?.spouse ?? {};
  const broker = d?.broker ?? {};
  const payment = d?.payment ?? {};
  const financing = d?.financing ?? {};
  const rows = (payment?.rows ?? []).filter((r: any) => r?.component && String(r?.total ?? '').trim() && money(r.total));

  const endereco = [addr.street, addr.number, addr.complement, addr.city && addr.state ? `${addr.city}/${addr.state}` : addr.city, addr.zipCode]
    .filter(Boolean).join(', ');

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {item?.buyer_name || 'Proposta'}
            {item && <Badge variant="outline">{PROPOSTA_STATUS_LABEL[item.status] ?? item.status}</Badge>}
            {item?.tipo === 'analise_credito' && <Badge className="bg-primary/10 text-primary">Análise de crédito</Badge>}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{item?.proposal_code}{item?.empreendimento_nome ? ` · ${item.empreendimento_nome}` : ''}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !proposta?.found ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Não foi possível carregar os detalhes desta proposta.</p>
        ) : (
          <div className="space-y-4">
            <Section icon={<Building2 className="h-3.5 w-3.5" />} title="Unidade">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Empreendimento" value={broker.projectName ?? item?.empreendimento_nome} />
                <Field label="Unidade" value={unit.unitNumber} />
                <Field label="Tipologia" value={unit.typology} />
                <Field label="Área privativa" value={unit.privateArea} />
                <Field label="Vagas" value={unit.parkingSpots} />
                <Field label="Torre/Fase" value={unit.towerPhase} />
                <Field label="Valor da unidade" value={money(unit.totalUnitValue)} />
              </div>
            </Section>

            <Section icon={<User className="h-3.5 w-3.5" />} title="Comprador">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Nome" value={buyer.name} />
                <Field label="CPF" value={buyer.cpf} />
                <Field label="Telefone" value={tel(buyer.phone)} />
                <Field label="E-mail" value={buyer.email} />
                <Field label="Profissão" value={buyer.profession} />
                <Field label="Renda bruta" value={money(buyer.grossIncome)} />
                <Field label="Estado civil" value={buyer.maritalStatus} />
                <Field label="Nascimento" value={buyer.birthDate} />
                <Field label="Endereço" value={endereco} />
              </div>
            </Section>

            {spouse?.enabled && (
              <Section icon={<Users className="h-3.5 w-3.5" />} title="Cônjuge">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Nome" value={spouse.name} />
                  <Field label="CPF" value={spouse.cpf} />
                  <Field label="Renda bruta" value={money(spouse.grossIncome)} />
                </div>
              </Section>
            )}

            <Section icon={<Users className="h-3.5 w-3.5" />} title="Corretor / Imobiliária">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Corretor" value={broker.brokerName} />
                <Field label="CRECI" value={broker.creci} />
                <Field label="Telefone" value={tel(broker.brokerPhone)} />
                <Field label="Imobiliária/Equipe" value={broker.realEstateTeam} />
                <Field label="Representante" value={broker.representativeName} />
              </div>
            </Section>

            <Section icon={<CreditCard className="h-3.5 w-3.5" />} title="Pagamento">
              <Field label="Modalidade" value={payment.modality ?? item?.modality} />
              {rows.length > 0 && (
                <div className="mt-3 divide-y divide-black/[.06]">
                  {rows.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <span className="text-muted-foreground">{r.component}</span>
                      <span className="font-medium tabular-nums">{money(r.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {(financing.cefBankAgency || financing.approvalDeadline) && (
              <Section icon={<Landmark className="h-3.5 w-3.5" />} title="Financiamento">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Agência CEF" value={financing.cefBankAgency} />
                  <Field label="Prazo de aprovação" value={financing.approvalDeadline} />
                </div>
              </Section>
            )}

            {d?.notes && (
              <Section icon={<CreditCard className="h-3.5 w-3.5" />} title="Observações">
                <p className="whitespace-pre-wrap text-sm">{String(d.notes)}</p>
              </Section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
