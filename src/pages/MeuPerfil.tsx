import { ChangeEvent, useEffect, useRef, useState } from 'react';
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
import { Camera, KeyRound, Loader2, Trash2, User as UserIcon } from 'lucide-react';
import { EMPRESA_LABELS, ROLE_LABELS } from '@/types/auth.types';

export default function MeuPerfil() {
  const { profile, user, role, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarStoragePath = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    const marker = '/storage/v1/object/public/user-avatars/';
    const markerIndex = avatarUrl.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(avatarUrl.slice(markerIndex + marker.length).split('?')[0]);
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;

    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensionByMimeType[file.type];

    if (!extension) {
      toast.error('Envie uma imagem JPG, PNG ou WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5 MB');
      return;
    }

    setIsUploadingAvatar(true);
    const previousPath = getAvatarStoragePath(profile?.avatar_url);
    const avatarPath = `${user.id}/avatar.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(avatarPath, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(avatarPath);
      const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
      if (profileError) throw profileError;

      if (previousPath && previousPath !== avatarPath) {
        await supabase.storage.from('user-avatars').remove([previousPath]);
      }

      await refreshProfile();
      toast.success('Foto de perfil atualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar a foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || !profile?.avatar_url) return;

    setIsUploadingAvatar(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (profileError) throw profileError;

      const avatarPath = getAvatarStoragePath(profile.avatar_url);
      if (avatarPath) {
        const { error: removeError } = await supabase.storage
          .from('user-avatars')
          .remove([avatarPath]);
        if (removeError) throw removeError;
      }

      await refreshProfile();
      toast.success('Foto de perfil removida');
    } catch (error) {
      await refreshProfile();
      toast.error(error instanceof Error ? error.message : 'Erro ao remover a foto');
    } finally {
      setIsUploadingAvatar(false);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MainLayout title="Meu Perfil" subtitle="Suas informações e credenciais">
      <div className="max-w-4xl space-y-5">
        <Card className="border-0 bg-[#201a17] text-white">
          <CardHeader>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-[#ff7417]/20">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={`Foto de ${profile?.full_name || 'usuário'}`} />
                    <AvatarFallback className="bg-[#ff7417] text-lg font-bold text-[#21150d]">{initials}</AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {profile?.avatar_url ? 'Trocar foto' : 'Enviar foto'}
                  </Button>
                  {profile?.avatar_url && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-white/60 hover:bg-white/10 hover:text-white"
                      disabled={isUploadingAvatar}
                      onClick={handleAvatarRemove}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
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
            <CardDescription className="mt-4 text-white/45">
              JPG, PNG ou WebP, com até 5 MB. A foto será exibida no cabeçalho e nos avatares do sistema.
            </CardDescription>
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
