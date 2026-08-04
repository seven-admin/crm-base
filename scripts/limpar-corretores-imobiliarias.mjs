#!/usr/bin/env node
// Remoção PERMANENTE de corretores + imobiliárias + usuários auth vinculados.
// Uso:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/limpar-corretores-imobiliarias.mjs --yes
//
// Sem --yes ele só mostra o que faria (dry-run). Faça backup antes:
//   pg_dump "$SUPABASE_DB_URL" -t public.seven_corretores -t public.seven_imobiliarias \
//     -t public.seven_empreendimento_imobiliarias --data-only --column-inserts > backup.sql
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONFIRM = process.argv.includes('--yes');

if (!URL || !KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

async function main() {
  const { data: corretores, error: e1 } = await db
    .from('seven_corretores')
    .select('id, user_id, nome_completo');
  if (e1) throw e1;
  const { count: qtdImob } = await db
    .from('seven_imobiliarias')
    .select('id', { count: 'exact', head: true });

  const userIds = [...new Set(corretores.map((c) => c.user_id).filter(Boolean))];
  console.log(`Corretores: ${corretores.length} | com usuário auth: ${userIds.length} | imobiliárias: ${qtdImob}`);

  if (!CONFIRM) {
    console.log('\nDRY-RUN. Nada foi alterado. Rode de novo com --yes para executar.');
    return;
  }

  // 1) libera os clientes (FK NO ACTION bloqueia os deletes)
  for (const col of ['corretor_id', 'imobiliaria_id']) {
    const { error } = await db.from('seven_clientes').update({ [col]: null }).not(col, 'is', null);
    if (error) throw new Error(`Falha ao limpar seven_clientes.${col}: ${error.message}`);
  }
  console.log('Clientes liberados (corretor_id/imobiliaria_id = null).');

  // 2) apaga os usuários do auth (cascateia profiles; seven_corretores.user_id vira NULL)
  let ok = 0, fail = 0;
  for (const id of userIds) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) { fail++; console.warn(`auth ${id}: ERRO ${error.message}`); }
    else { ok++; }
  }
  console.log(`Usuários auth apagados: ${ok} ok, ${fail} com erro.`);

  // 3) apaga corretores e imobiliárias (cascata cuida dos vínculos)
  const delC = await db.from('seven_corretores').delete().not('id', 'is', null);
  if (delC.error) throw new Error(`Falha ao apagar corretores: ${delC.error.message}`);
  const delI = await db.from('seven_imobiliarias').delete().not('id', 'is', null);
  if (delI.error) throw new Error(`Falha ao apagar imobiliárias: ${delI.error.message}`);

  console.log('Corretores e imobiliárias apagados. Concluído.');
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
