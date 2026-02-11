import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  FileSpreadsheet,
  DollarSign,
  MinusCircle,
  PlusCircle,
  Calculator,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useLancamentos } from '@/hooks/useFinanceiro';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

// Estrutura da DRE
interface DREData {
  receitaBruta: number;
  impostosFaturamento: number;
  receitaLiquida: number;
  custosDirectos: number;
  lucroBruto: number;
  despesasOperacionais: {
    administrativas: number;
    comerciais: number;
    marketing: number;
    financeiras: number;
  };
  totalDespesasOperacionais: number;
  resultadoOperacional: number;
  irpjCsll: number;
  lucroLiquido: number;
}

// Categorias para mapeamento
const CATEGORIAS_DRE = {
  receitaBruta: ['Recebimentos de Clientes', 'Aportes', 'Outras Entradas'],
  impostosFaturamento: ['ISS', 'Simples'],
  custosDirectos: ['Comissões', 'Terceiros'],
  despesasAdministrativas: ['Aluguel', 'Sistema', 'Contador', 'Pessoal'],
  despesasComerciais: ['CRM', 'Telefone', 'Transporte'],
  marketing: ['Tráfego', 'Designer', 'Mídia'],
  despesasFinanceiras: ['Juros', 'Tarifas Bancárias'],
  irpjCsll: ['IRPJ', 'CSLL'],
};

export default function DRE() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, 'yyyy-MM'));
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<string>('all');
  
  const { data: empreendimentos = [] } = useEmpreendimentos();
  
  // Calcular datas do mês selecionado
  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');
  
  const { data: lancamentos = [] } = useLancamentos({
    data_inicio: startDate,
    data_fim: endDate,
    empreendimento_id: selectedEmpreendimento !== 'all' ? selectedEmpreendimento : undefined
  });

  // Calcular DRE a partir dos lançamentos
  const calcularDRE = (): DREData => {
    // Filtrar por tipo correto: 'receber' para entradas e 'pagar' para saídas
    const entradas = lancamentos.filter(l => l.tipo === 'receber' && l.status === 'pago');
    const saidas = lancamentos.filter(l => l.tipo === 'pagar' && l.status === 'pago');
    
    const receitaBruta = entradas.reduce((acc, l) => acc + (l.valor || 0), 0);
    
    // Calcular por categoria_fluxo dos lançamentos
    const calcularPorCategoria = (categorias: string[]) => {
      return saidas
        .filter(l => categorias.some(cat => 
          l.categoria_fluxo?.toLowerCase().includes(cat.toLowerCase()) ||
          l.subcategoria?.toLowerCase().includes(cat.toLowerCase()) ||
          l.descricao?.toLowerCase().includes(cat.toLowerCase())
        ))
        .reduce((acc, l) => acc + (l.valor || 0), 0);
    };
    
    // Mapear categorias reais dos lançamentos
    const impostosFaturamento = calcularPorCategoria(['imposto', 'iss', 'simples', 'pis', 'cofins', 'tributo']);
    const custosDirectos = calcularPorCategoria(['comissão', 'comissao', 'corretor', 'terceiro', 'custo direto']);
    const administrativas = calcularPorCategoria(['aluguel', 'contador', 'pessoal', 'sistema', 'folha', 'administrativ']);
    const comerciais = calcularPorCategoria(['crm', 'telefone', 'transporte', 'vendas', 'comercial']);
    const marketing = calcularPorCategoria(['marketing', 'tráfego', 'trafego', 'mídia', 'midia', 'designer', 'publicidade']);
    const financeiras = calcularPorCategoria(['juros', 'tarifa', 'bancári', 'bancario', 'iof', 'financeira']);
    const irpjCsll = calcularPorCategoria(['irpj', 'csll', 'ir', 'imposto de renda']);
    
    // Despesas não categorizadas vão para outras despesas operacionais
    const categorizadas = impostosFaturamento + custosDirectos + administrativas + 
                          comerciais + marketing + financeiras + irpjCsll;
    const totalSaidas = saidas.reduce((acc, l) => acc + (l.valor || 0), 0);
    const naoCategorizadas = totalSaidas - categorizadas;
    
    const despesasOperacionais = {
      administrativas: administrativas + naoCategorizadas,
      comerciais,
      marketing,
      financeiras
    };
    
    const receitaLiquida = receitaBruta - impostosFaturamento;
    const lucroBruto = receitaLiquida - custosDirectos;
    const totalDespesasOperacionais = Object.values(despesasOperacionais).reduce((a, b) => a + b, 0);
    const resultadoOperacional = lucroBruto - totalDespesasOperacionais;
    const lucroLiquido = resultadoOperacional - irpjCsll;
    
    return {
      receitaBruta,
      impostosFaturamento,
      receitaLiquida,
      custosDirectos,
      lucroBruto,
      despesasOperacionais,
      totalDespesasOperacionais,
      resultadoOperacional,
      irpjCsll,
      lucroLiquido,
    };
  };

  const dre = calcularDRE();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPercentual = (value: number, base: number) => {
    if (base === 0) return '0%';
    return `${((value / base) * 100).toFixed(1)}%`;
  };

  // Gerar lista de meses para seleção (12 anteriores + 6 futuros)
  const monthOptions = Array.from({ length: 18 }, (_, i) => {
    const date = addMonths(currentDate, i - 12);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR })
    };
  }).sort((a, b) => b.value.localeCompare(a.value));

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(format(subMonths(new Date(y, m - 1), 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(format(addMonths(new Date(y, m - 1), 1), 'yyyy-MM'));
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const element = document.getElementById('dre-content');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `DRE_${selectedMonth}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = [
      ['DEMONSTRATIVO DE RESULTADOS DO EXERCÍCIO'],
      [`Período: ${format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR })}`],
      [''],
      ['Descrição', 'Valor', '% Receita'],
      ['RECEITA BRUTA', dre.receitaBruta, '100%'],
      ['(-) Impostos sobre Faturamento', -dre.impostosFaturamento, getPercentual(dre.impostosFaturamento, dre.receitaBruta)],
      ['= RECEITA LÍQUIDA', dre.receitaLiquida, getPercentual(dre.receitaLiquida, dre.receitaBruta)],
      ['(-) Custos Diretos', -dre.custosDirectos, getPercentual(dre.custosDirectos, dre.receitaBruta)],
      ['= LUCRO BRUTO', dre.lucroBruto, getPercentual(dre.lucroBruto, dre.receitaBruta)],
      ['(-) Despesas Administrativas', -dre.despesasOperacionais.administrativas, getPercentual(dre.despesasOperacionais.administrativas, dre.receitaBruta)],
      ['(-) Despesas Comerciais', -dre.despesasOperacionais.comerciais, getPercentual(dre.despesasOperacionais.comerciais, dre.receitaBruta)],
      ['(-) Marketing', -dre.despesasOperacionais.marketing, getPercentual(dre.despesasOperacionais.marketing, dre.receitaBruta)],
      ['(-) Despesas Financeiras', -dre.despesasOperacionais.financeiras, getPercentual(dre.despesasOperacionais.financeiras, dre.receitaBruta)],
      ['= RESULTADO OPERACIONAL', dre.resultadoOperacional, getPercentual(dre.resultadoOperacional, dre.receitaBruta)],
      ['(-) IRPJ/CSLL', -dre.irpjCsll, getPercentual(dre.irpjCsll, dre.receitaBruta)],
      ['= LUCRO LÍQUIDO', dre.lucroLiquido, getPercentual(dre.lucroLiquido, dre.receitaBruta)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DRE');
    XLSX.writeFile(wb, `DRE_${selectedMonth}.xlsx`);
  };

  const DRERow = ({ 
    label, 
    value, 
    isTotal = false, 
    isPositive = true,
    indent = false,
    baseValue = dre.receitaBruta
  }: { 
    label: string; 
    value: number; 
    isTotal?: boolean;
    isPositive?: boolean;
    indent?: boolean;
    baseValue?: number;
  }) => (
    <div className={cn(
      'flex items-center justify-between py-3 px-4',
      isTotal && 'bg-muted font-semibold',
      indent && 'pl-8'
    )}>
      <span className={cn(indent && 'text-muted-foreground')}>
        {label}
      </span>
      <div className="flex items-center gap-4">
        <span className={cn(
          'font-mono',
          value < 0 && 'text-destructive',
          value > 0 && isPositive && 'text-green-600'
        )}>
          {formatCurrency(value)}
        </span>
        <Badge variant="secondary" className="w-16 justify-center">
          {getPercentual(Math.abs(value), baseValue)}
        </Badge>
      </div>
    </div>
  );

  return (
    <MainLayout title="DRE" subtitle="Demonstrativo de Resultados do Exercício">
      <div className="space-y-6">
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
                disabled={selectedMonth === format(new Date(), 'yyyy-MM')}
              >
                Hoje
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedEmpreendimento} onValueChange={setSelectedEmpreendimento}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os empreendimentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os empreendimentos</SelectItem>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PlusCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Bruta</p>
                  <p className="text-xl font-bold">{formatCurrency(dre.receitaBruta)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                  <p className="text-xl font-bold">{formatCurrency(dre.lucroBruto)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resultado Operacional</p>
                  <p className="text-xl font-bold">{formatCurrency(dre.resultadoOperacional)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={dre.lucroLiquido >= 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  dre.lucroLiquido >= 0 ? 'bg-green-100' : 'bg-red-100'
                )}>
                  {dre.lucroLiquido >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                  <p className={cn(
                    'text-xl font-bold',
                    dre.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(dre.lucroLiquido)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DRE Detalhada */}
        <Card id="dre-content">
          <CardHeader>
            <CardTitle>Demonstrativo de Resultados</CardTitle>
            <CardDescription>
              {format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })}
              {selectedEmpreendimento !== 'all' && 
                ` - ${empreendimentos.find(e => e.id === selectedEmpreendimento)?.nome}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <DRERow label="RECEITA BRUTA" value={dre.receitaBruta} isTotal />
              <DRERow label="(-) Impostos sobre Faturamento" value={-dre.impostosFaturamento} indent isPositive={false} />
              <DRERow label="= RECEITA LÍQUIDA" value={dre.receitaLiquida} isTotal />
              <DRERow label="(-) Custos Diretos" value={-dre.custosDirectos} indent isPositive={false} />
              <DRERow label="= LUCRO BRUTO" value={dre.lucroBruto} isTotal />
              
              <div className="py-2 px-4 bg-muted/50">
                <span className="text-sm font-medium text-muted-foreground">DESPESAS OPERACIONAIS</span>
              </div>
              <DRERow label="(-) Despesas Administrativas" value={-dre.despesasOperacionais.administrativas} indent isPositive={false} />
              <DRERow label="(-) Despesas Comerciais" value={-dre.despesasOperacionais.comerciais} indent isPositive={false} />
              <DRERow label="(-) Marketing" value={-dre.despesasOperacionais.marketing} indent isPositive={false} />
              <DRERow label="(-) Despesas Financeiras" value={-dre.despesasOperacionais.financeiras} indent isPositive={false} />
              
              <DRERow label="= RESULTADO OPERACIONAL" value={dre.resultadoOperacional} isTotal />
              <DRERow label="(-) IRPJ/CSLL" value={-dre.irpjCsll} indent isPositive={false} />
              
              <div className={cn(
                'flex items-center justify-between py-4 px-4 font-bold text-lg',
                dre.lucroLiquido >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                <span>= LUCRO LÍQUIDO</span>
                <div className="flex items-center gap-4">
                  <span>{formatCurrency(dre.lucroLiquido)}</span>
                  <Badge className={cn(
                    'w-16 justify-center',
                    dre.lucroLiquido >= 0 ? 'bg-green-600' : 'bg-red-600'
                  )}>
                    {getPercentual(dre.lucroLiquido, dre.receitaBruta)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
