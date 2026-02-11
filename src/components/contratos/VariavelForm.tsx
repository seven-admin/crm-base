import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateContratoVariavel, useUpdateContratoVariavel, type ContratoVariavel } from '@/hooks/useContratoVariaveis';

interface VariavelFormProps {
  variavel?: ContratoVariavel | null;
  onClose: () => void;
  open?: boolean;
}

const CATEGORIAS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'empreendimento', label: 'Empreendimento' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'geral', label: 'Geral / Customizado' },
];

const TIPOS = [
  { value: 'texto', label: 'Texto' },
  { value: 'data', label: 'Data' },
  { value: 'moeda', label: 'Moeda (R$)' },
  { value: 'numero', label: 'Número' },
];

const ORIGENS = [
  { value: '', label: 'Manual (sem origem)' },
  { value: 'clientes', label: 'Tabela: Clientes' },
  { value: 'empreendimentos', label: 'Tabela: Empreendimentos' },
  { value: 'unidades', label: 'Tabela: Unidades' },
  { value: 'blocos', label: 'Tabela: Blocos' },
  { value: 'contratos', label: 'Tabela: Contratos' },
];

// Mapeamento de colunas disponíveis por tabela
const COLUNAS_POR_TABELA: Record<string, { value: string; label: string }[]> = {
  clientes: [
    { value: 'nome', label: 'Nome' },
    { value: 'cpf', label: 'CPF' },
    { value: 'rg', label: 'RG' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'data_nascimento', label: 'Data de Nascimento' },
    { value: 'estado_civil', label: 'Estado Civil' },
    { value: 'profissao', label: 'Profissão' },
    { value: 'nacionalidade', label: 'Nacionalidade' },
    { value: 'nome_mae', label: 'Nome da Mãe' },
    { value: 'nome_pai', label: 'Nome do Pai' },
    { value: 'renda_mensal', label: 'Renda Mensal' },
    { value: 'endereco_logradouro', label: 'Logradouro' },
    { value: 'endereco_numero', label: 'Número' },
    { value: 'endereco_complemento', label: 'Complemento' },
    { value: 'endereco_bairro', label: 'Bairro' },
    { value: 'endereco_cidade', label: 'Cidade' },
    { value: 'endereco_uf', label: 'UF' },
    { value: 'endereco_cep', label: 'CEP' },
  ],
  empreendimentos: [
    { value: 'nome', label: 'Nome' },
    { value: 'descricao_curta', label: 'Descrição Curta' },
    { value: 'matricula_mae', label: 'Matrícula Mãe' },
    { value: 'registro_incorporacao', label: 'Registro de Incorporação' },
    { value: 'incorporadora', label: 'Incorporadora' },
    { value: 'construtora', label: 'Construtora' },
    { value: 'endereco_logradouro', label: 'Logradouro' },
    { value: 'endereco_numero', label: 'Número' },
    { value: 'endereco_bairro', label: 'Bairro' },
    { value: 'endereco_cidade', label: 'Cidade' },
    { value: 'endereco_uf', label: 'UF' },
    { value: 'endereco_cep', label: 'CEP' },
  ],
  unidades: [
    { value: 'numero', label: 'Número da Unidade' },
    { value: 'andar', label: 'Andar' },
    { value: 'valor', label: 'Valor' },
    { value: 'area_privativa', label: 'Área Privativa' },
    { value: 'area_total', label: 'Área Total' },
    { value: 'fracao_ideal', label: 'Fração Ideal' },
    { value: 'vagas_garagem', label: 'Vagas de Garagem' },
    { value: 'posicao_solar', label: 'Posição Solar' },
    { value: 'descricao', label: 'Descrição/Memorial' },
  ],
  blocos: [
    { value: 'nome', label: 'Nome do Bloco' },
    { value: 'total_andares', label: 'Total de Andares' },
    { value: 'unidades_por_andar', label: 'Unidades por Andar' },
  ],
  contratos: [
    { value: 'numero', label: 'Número do Contrato' },
    { value: 'valor_contrato', label: 'Valor do Contrato' },
    { value: 'data_geracao', label: 'Data de Geração' },
    { value: 'data_assinatura', label: 'Data de Assinatura' },
    { value: 'observacoes', label: 'Observações' },
  ],
};

export function VariavelForm({ variavel, onClose, open = true }: VariavelFormProps) {
  const { mutate: createVariavel, isPending: isCreating } = useCreateContratoVariavel();
  const { mutate: updateVariavel, isPending: isUpdating } = useUpdateContratoVariavel();

  const [chave, setChave] = useState(variavel?.chave || '');
  const [label, setLabel] = useState(variavel?.label || '');
  const [exemplo, setExemplo] = useState(variavel?.exemplo || '');
  const [categoria, setCategoria] = useState(variavel?.categoria || 'geral');
  const [tipo, setTipo] = useState(variavel?.tipo || 'texto');
  const [origem, setOrigem] = useState(variavel?.origem || '');
  const [campoOrigem, setCampoOrigem] = useState(variavel?.campo_origem || '');
  const [isActive, setIsActive] = useState(variavel?.is_active ?? true);

  useEffect(() => {
    if (variavel) {
      setChave(variavel.chave);
      setLabel(variavel.label);
      setExemplo(variavel.exemplo || '');
      setCategoria(variavel.categoria);
      setTipo(variavel.tipo);
      setOrigem(variavel.origem || '');
      setCampoOrigem(variavel.campo_origem || '');
      setIsActive(variavel.is_active);
    }
  }, [variavel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      chave: chave.toLowerCase().replace(/\s+/g, '_'),
      label,
      exemplo: exemplo || undefined,
      categoria,
      tipo,
      origem: origem || undefined,
      campo_origem: campoOrigem || undefined,
      is_active: isActive,
    };

    if (variavel) {
      updateVariavel({ id: variavel.id, data }, { onSuccess: onClose });
    } else {
      createVariavel(data, { onSuccess: onClose });
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {variavel ? 'Editar Variável' : 'Nova Variável de Contrato'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chave">Chave *</Label>
              <Input
                id="chave"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder="nome_campo"
                pattern="[a-zA-Z0-9_]+"
                title="Apenas letras, números e underline"
                required
                disabled={!!variavel}
              />
              <p className="text-xs text-muted-foreground">
                Será usado como: {`{{${chave || 'chave'}}}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nome descritivo"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exemplo">Exemplo de Valor</Label>
            <Input
              id="exemplo"
              value={exemplo}
              onChange={(e) => setExemplo(e.target.value)}
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Dado</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origem">Origem dos Dados</Label>
              <Select 
                value={origem || '__none__'} 
                onValueChange={(v) => {
                  const originValue = v === '__none__' ? '' : v;
                  setOrigem(originValue);
                  setCampoOrigem('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Manual" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (
                    <SelectItem key={o.value || '__none__'} value={o.value || '__none__'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {origem && (
              <div className="space-y-2">
                <Label htmlFor="campo_origem">Campo na Tabela</Label>
                <Select 
                  value={campoOrigem || '__none__'} 
                  onValueChange={(v) => setCampoOrigem(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o campo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione...</SelectItem>
                    {(COLUNAS_POR_TABELA[origem] || []).map((col) => (
                      <SelectItem key={col.value} value={col.value}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is-active">Variável ativa</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !chave.trim() || !label.trim()}>
              {isSaving ? 'Salvando...' : variavel ? 'Salvar Alterações' : 'Criar Variável'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
