import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, KeyRound } from 'lucide-react';
import { EMPRESA_LABELS, ROLE_LABELS } from '@/types/auth.types';

export default function MeuPerfil() {
  const { profile, user, role, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Perfil atualizado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com sucesso');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MainLayout title="Meu Perfil" subtitle="Suas informações e credenciais">
      <div className="max-w-4xl space-y-5">
        <Card className="border-0 bg-[#201a17] text-white">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-[#ff7417]/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {profile?.full_name || 'Usuário'}
                </CardTitle>
                <CardDescription className="text-white/45">{profile?.email}</CardDescription>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {profile?.empresa && (
                    <Badge variant="secondary">
                      Empresa: {EMPRESA_LABELS[profile.empresa]}
                    </Badge>
                  )}
                  {role && (
                    <Badge variant="outline">
                      {ROLE_LABELS[role] || role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={profile?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Alterar senha
            </CardTitle>
            <CardDescription>Mínimo de 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova senha</Label>
              <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar nova senha</Label>
              <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="pt-2">
              <Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword}>
                {isChangingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Alterando...</> : 'Alterar senha'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
