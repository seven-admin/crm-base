import { useState, useMemo } from 'react';
import { useCorretoresUsuarios, useUpdateCorretorUsuario, useDeleteCorretorUsuario, useCreateCorretorVinculo, CorretorUsuario } from '@/hooks/useCorretoresUsuarios';
import { useActivateCorretor, useBulkActivateCorretores } from '@/hooks/useActivateCorretor';
import { UserEmpreendimentosTab } from './UserEmpreendimentosTab';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Search, 
  Edit, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Trash2,
  Building2,
  UserCheck,
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  Link
} from 'lucide-react';

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Formatação de CPF
const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Formatação de telefone
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export function CorretoresUsuariosTab() {
  const { data: corretores = [], isLoading, refetch } = useCorretoresUsuarios();
  const updateMutation = useUpdateCorretorUsuario();
  const deleteMutation = useDeleteCorretorUsuario();
  const createVinculoMutation = useCreateCorretorVinculo();
  const activateCorretor = useActivateCorretor();
  const bulkActivate = useBulkActivateCorretores();

  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPendentes, setShowOnlyPendentes] = useState(false);
  const [showOnlySemVinculo, setShowOnlySemVinculo] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCorretor, setEditingCorretor] = useState<CorretorUsuario | null>(null);
  const [activeTab, setActiveTab] = useState('dados');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Dialog de vinculação
  const [isVinculoDialogOpen, setIsVinculoDialogOpen] = useState(false);
  const [vinculoCorretor, setVinculoCorretor] = useState<CorretorUsuario | null>(null);
  const [vinculoCpf, setVinculoCpf] = useState('');
  const [vinculoCreci, setVinculoCreci] = useState('');

  // Form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editCreci, setEditCreci] = useState('');
  const [editCidade, setEditCidade] = useState('');
  const [editUf, setEditUf] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Stats
  const stats = useMemo(() => ({
    total: corretores.length,
    ativos: corretores.filter(c => c.is_active).length,
    pendentes: corretores.filter(c => !c.is_active).length,
    comImobiliaria: corretores.filter(c => c.imobiliaria_id).length,
    semVinculo: corretores.filter(c => !c.corretor_id).length
  }), [corretores]);

  // Filtered corretores
  const filteredCorretores = useMemo(() => {
    let result = corretores.filter(c =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf?.includes(searchTerm) ||
      c.creci?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (showOnlyPendentes) {
      result = result.filter(c => !c.is_active);
    }

    if (showOnlySemVinculo) {
      result = result.filter(c => !c.corretor_id);
    }
    
    return result;
  }, [corretores, searchTerm, showOnlyPendentes, showOnlySemVinculo]);

  // Selection handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllPendentes = () => {
    const pendentesIds = filteredCorretores.filter(c => !c.is_active).map(c => c.id);
    setSelectedUsers(new Set(pendentesIds));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Edit handlers
  const handleEditCorretor = (corretor: CorretorUsuario) => {
    setEditingCorretor(corretor);
    setEditFullName(corretor.full_name);
    setEditPhone(corretor.whatsapp || corretor.phone || '');
    setEditCpf(corretor.cpf ? formatCpf(corretor.cpf) : '');
    setEditCreci(corretor.creci || '');
    setEditCidade(corretor.cidade || '');
    setEditUf(corretor.uf || '');
    setEditIsActive(corretor.is_active);
    setActiveTab('dados');
    setIsEditDialogOpen(true);
  };

  const handleSaveCorretor = async () => {
    if (!editingCorretor) return;
    
    await updateMutation.mutateAsync({
      userId: editingCorretor.id,
      corretorId: editingCorretor.corretor_id,
      fullName: editFullName,
      phone: editPhone || null,
      isActive: editIsActive,
      cpf: editCpf,
      creci: editCreci,
      cidade: editCidade,
      uf: editUf
    });
    
    setIsEditDialogOpen(false);
    refetch();
  };

  const handleDeleteCorretor = async () => {
    if (!editingCorretor) return;
    
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o corretor ${editingCorretor.email}?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }
    
    await deleteMutation.mutateAsync(editingCorretor.id);
    setIsEditDialogOpen(false);
    refetch();
  };

  const handleResetPassword = async () => {
    if (!editingCorretor) return;
    
    if (!confirm(`Tem certeza que deseja resetar a senha de ${editingCorretor.email}?\n\nA nova senha será: Seven@1234`)) {
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await supabase.functions.invoke('reset-user-password', {
        body: { user_id: editingCorretor.id }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('Senha resetada com sucesso! Nova senha: Seven@1234');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao resetar senha');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Activation handlers
  const handleActivateUser = async (corretor: CorretorUsuario) => {
    await activateCorretor.mutateAsync({
      userId: corretor.id,
      email: corretor.email,
      nome: corretor.full_name,
      cpf: corretor.cpf || undefined,
      creci: corretor.creci || undefined
    });
    refetch();
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) return;
    const usersToActivate = corretores
      .filter(c => selectedUsers.has(c.id))
      .map(c => ({
        userId: c.id,
        email: c.email,
        nome: c.full_name
      }));
    await bulkActivate.mutateAsync(usersToActivate);
    setSelectedUsers(new Set());
    refetch();
  };

  // Vincular corretor handlers
  const handleOpenVinculoDialog = (corretor: CorretorUsuario) => {
    setVinculoCorretor(corretor);
    setVinculoCpf('');
    setVinculoCreci('');
    setIsVinculoDialogOpen(true);
  };

  const handleCreateVinculo = async () => {
    if (!vinculoCorretor) return;
    
    await createVinculoMutation.mutateAsync({
      userId: vinculoCorretor.id,
      email: vinculoCorretor.email,
      nome: vinculoCorretor.full_name,
      cpf: vinculoCpf || undefined,
      creci: vinculoCreci || undefined
    });
    
    setIsVinculoDialogOpen(false);
    refetch();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendentes}</div>
          </CardContent>
        </Card>
        <Card className={stats.semVinculo > 0 ? 'border-warning' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Vínculo</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.semVinculo > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.semVinculo > 0 ? 'text-warning' : ''}`}>{stats.semVinculo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Imobiliária</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comImobiliaria}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for sem vínculo */}
      {stats.semVinculo > 0 && (
        <Alert variant="default" className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="ml-2">
            <strong>{stats.semVinculo} corretor(es)</strong> possuem role "corretor" mas não têm registro profissional. 
            Eles não conseguem acessar o Portal do Corretor. Use o botão "Vincular" para criar o registro.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, CRECI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="pendentes"
              checked={showOnlyPendentes}
              onCheckedChange={(checked) => setShowOnlyPendentes(!!checked)}
            />
            <Label htmlFor="pendentes" className="text-sm whitespace-nowrap cursor-pointer">
              Pendentes
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="semVinculo"
              checked={showOnlySemVinculo}
              onCheckedChange={(checked) => setShowOnlySemVinculo(!!checked)}
            />
            <Label htmlFor="semVinculo" className="text-sm whitespace-nowrap cursor-pointer">
              Sem Vínculo
            </Label>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {stats.pendentes > 0 && (
            <Button variant="outline" size="sm" onClick={selectAllPendentes}>
              Selecionar Pendentes
            </Button>
          )}
          {selectedUsers.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Limpar ({selectedUsers.size})
              </Button>
              <Button 
                size="sm" 
                onClick={handleBulkActivate}
                disabled={bulkActivate.isPending}
              >
                {bulkActivate.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Ativar Selecionados ({selectedUsers.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Corretor</TableHead>
              <TableHead className="hidden md:table-cell">CPF</TableHead>
              <TableHead className="hidden lg:table-cell">CRECI</TableHead>
              <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCorretores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm || showOnlyPendentes ? 'Nenhum corretor encontrado' : 'Nenhum corretor cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCorretores.map((corretor) => (
                <TableRow key={corretor.id}>
                  <TableCell>
                    {!corretor.is_active && (
                      <Checkbox
                        checked={selectedUsers.has(corretor.id)}
                        onCheckedChange={() => toggleUserSelection(corretor.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={corretor.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(corretor.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{corretor.full_name}</p>
                        <p className="text-xs text-muted-foreground">{corretor.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {corretor.cpf ? formatCpf(corretor.cpf) : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {corretor.creci || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {corretor.cidade && corretor.uf 
                      ? `${corretor.cidade}/${corretor.uf}` 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {corretor.is_active ? (
                        <Badge variant="secondary" className="text-success w-fit">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-warning w-fit">
                          <Clock className="mr-1 h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                      {!corretor.corretor_id && (
                        <Badge variant="outline" className="text-warning border-warning w-fit">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Sem vínculo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!corretor.corretor_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenVinculoDialog(corretor)}
                          disabled={createVinculoMutation.isPending}
                          title="Criar vínculo profissional"
                        >
                          {createVinculoMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {!corretor.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateUser(corretor)}
                          disabled={activateCorretor.isPending}
                          title="Ativar corretor"
                        >
                          {activateCorretor.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCorretor(corretor)}
                        title="Editar corretor"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Corretor</DialogTitle>
            <DialogDescription>
              {editingCorretor?.email}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="empreendimentos">Empreendimentos</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input
                      value={editCpf}
                      onChange={(e) => setEditCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CRECI</Label>
                    <Input
                      value={editCreci}
                      onChange={(e) => setEditCreci(e.target.value)}
                      placeholder="00000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={editCidade}
                      onChange={(e) => setEditCidade(e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Select value={editUf} onValueChange={setEditUf}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UF_LIST.map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label>Status do Usuário</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários inativos não podem acessar o sistema
                    </p>
                  </div>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="w-full"
                >
                  {isResettingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Resetar Senha (Seven@1234)
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="empreendimentos" className="mt-4">
              {editingCorretor && (
                <UserEmpreendimentosTab 
                  userId={editingCorretor.id}
                  userScope="empreendimento"
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteCorretor}
              disabled={deleteMutation.isPending}
              className="text-destructive hover:text-destructive"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCorretor}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vincular Dialog */}
      <Dialog open={isVinculoDialogOpen} onOpenChange={setIsVinculoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Vínculo de Corretor</DialogTitle>
            <DialogDescription>
              {vinculoCorretor?.full_name} ({vinculoCorretor?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="default" className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="ml-2 text-sm">
                Este usuário possui role "corretor" mas não tem registro profissional.
                Preencha os dados abaixo para criar o vínculo.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={vinculoCpf}
                onChange={(e) => setVinculoCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label>CRECI</Label>
              <Input
                value={vinculoCreci}
                onChange={(e) => setVinculoCreci(e.target.value)}
                placeholder="00000-F"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVinculoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateVinculo}
              disabled={createVinculoMutation.isPending}
            >
              {createVinculoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link className="mr-2 h-4 w-4" />
              )}
              Criar Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
