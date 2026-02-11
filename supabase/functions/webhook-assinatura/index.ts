import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  signatario_id: string;
  contrato_id: string;
  link_assinatura: string;
  signatario_nome: string;
  signatario_email?: string;
  signatario_telefone?: string;
  signatario_tipo: string;
  contrato_numero: string;
  cliente_nome: string;
  empreendimento_nome: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: WebhookPayload = await req.json();
    console.log('Webhook assinatura payload:', JSON.stringify(payload, null, 2));

    // Buscar webhooks ativos para o evento 'assinatura_enviada'
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('evento', 'assinatura_enviada')
      .eq('is_active', true);

    if (webhooksError) {
      console.error('Erro ao buscar webhooks:', webhooksError);
      throw new Error('Falha ao buscar webhooks');
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('Nenhum webhook ativo para evento assinatura_enviada');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum webhook configurado para este evento',
          webhooks_disparados: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontrados ${webhooks.length} webhooks para disparar`);

    // Disparar cada webhook
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        console.log(`Disparando webhook para: ${webhook.url}`);
        
        const startTime = Date.now();
        
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              evento: 'assinatura_enviada',
              timestamp: new Date().toISOString(),
              dados: payload,
            }),
          });

          const status = response.status;
          const duration = Date.now() - startTime;
          
          console.log(`Webhook ${webhook.id} respondeu com status ${status} em ${duration}ms`);

          // Atualizar último disparo
          await supabase
            .from('webhooks')
            .update({
              ultimo_disparo: new Date().toISOString(),
              ultimo_status: status,
            })
            .eq('id', webhook.id);

          return { 
            webhook_id: webhook.id, 
            url: webhook.url, 
            status, 
            success: status >= 200 && status < 300,
            duration_ms: duration
          };
        } catch (error) {
          console.error(`Erro ao disparar webhook ${webhook.id}:`, error);
          
          // Atualizar com status de erro
          await supabase
            .from('webhooks')
            .update({
              ultimo_disparo: new Date().toISOString(),
              ultimo_status: 0,
            })
            .eq('id', webhook.id);

          return { 
            webhook_id: webhook.id, 
            url: webhook.url, 
            status: 0, 
            success: false, 
            error: String(error) 
          };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    console.log(`Webhooks disparados: ${successCount}/${webhooks.length} com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} de ${webhooks.length} webhooks disparados com sucesso`,
        webhooks_disparados: successCount,
        total_webhooks: webhooks.length,
        detalhes: results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na edge function webhook-assinatura:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
