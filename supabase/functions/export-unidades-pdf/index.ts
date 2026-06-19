// Edge Function: export-unidades-pdf
// Recebe filtros (principalmente empreendimento_id + telefone_corretor), gera PDF
// com tabela de unidades e devolve URL assinada.
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  empreendimento_id: z.string().uuid(),
  telefone_corretor: z.string().min(8).max(20),
  status: z.enum(["disponivel", "reservada", "vendida", "bloqueada", "negociacao", "contrato"]).optional(),
  bloco_id: z.string().uuid().optional(),
  quartos: z.number().int().min(0).max(20).optional(),
  valor_min: z.number().nonnegative().optional(),
  valor_max: z.number().nonnegative().optional(),
});

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

const fmtBRL = (v: number | null | undefined) => {
  if (v == null) return "-";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // 1. Token compartilhado
  const apiToken = Deno.env.get("N8N_API_TOKEN");
  const provided = req.headers.get("x-api-token");
  if (!apiToken || provided !== apiToken) {
    return json(401, { error: "Token inválido" });
  }

  // 2. Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return json(400, { error: "Parâmetros inválidos", details: parsed.error.flatten().fieldErrors });
  }
  const input = parsed.data;
  const statusFiltro = input.status ?? "disponivel";

  // 3. Cliente service role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 4. Validar corretor pelo telefone (compara só dígitos)
  const telDigits = onlyDigits(input.telefone_corretor);
  if (telDigits.length < 8) return json(400, { error: "Telefone inválido" });

  // Normaliza: remove código país BR (55) e possível 9º dígito para gerar variantes
  const variants = new Set<string>();
  variants.add(telDigits);
  if (telDigits.startsWith("55") && telDigits.length >= 12) variants.add(telDigits.slice(2));
  // últimos 10 e 11 dígitos
  if (telDigits.length >= 11) variants.add(telDigits.slice(-11));
  if (telDigits.length >= 10) variants.add(telDigits.slice(-10));
  if (telDigits.length >= 9) variants.add(telDigits.slice(-9));
  if (telDigits.length >= 8) variants.add(telDigits.slice(-8));

  console.log("[validar-corretor] telefone recebido:", input.telefone_corretor, "digitos:", telDigits, "variantes:", [...variants]);

  const { data: corretores, error: corretorErr } = await supabase
    .from("corretores")
    .select("id, nome_completo, telefone, whatsapp, is_active")
    .eq("is_active", true);

  if (corretorErr) {
    console.error("Erro consultando corretores:", corretorErr);
    return json(500, { error: "Erro ao validar corretor" });
  }

  const matches = (raw: string | null | undefined) => {
    const d = onlyDigits(raw ?? "");
    if (!d) return false;
    if (variants.has(d)) return true;
    for (const v of variants) {
      if (v.length >= 8 && (d.endsWith(v) || v.endsWith(d))) return true;
    }
    return false;
  };

  const corretor = (corretores ?? []).find((c) => matches(c.telefone) || matches(c.whatsapp));

  if (!corretor) {
    console.warn("[validar-corretor] NÃO encontrado. Total corretores ativos:", corretores?.length, "primeiros telefones:", corretores?.slice(0, 3).map((c) => ({ t: c.telefone, w: c.whatsapp })));
    return json(403, { error: "Corretor não encontrado ou inativo", telefone_recebido: telDigits });
  }

  console.log("[validar-corretor] OK:", corretor.nome_completo, "id:", corretor.id);

  // 5. Buscar empreendimento
  const { data: emp, error: empErr } = await supabase
    .from("empreendimentos")
    .select("id, nome, endereco_cidade, endereco_uf, texto_rodape_relatorio, is_active")
    .eq("id", input.empreendimento_id)
    .maybeSingle();

  if (empErr || !emp) return json(404, { error: "Empreendimento não encontrado" });
  if (!emp.is_active) return json(403, { error: "Empreendimento inativo" });

  // 6. Buscar unidades
  let q = supabase
    .from("unidades")
    .select(`
      id, numero, andar, area_privativa, valor, status,
      bloco:blocos(nome),
      tipologia:tipologias(nome, quartos, suites, vagas)
    `)
    .eq("empreendimento_id", input.empreendimento_id)
    .eq("is_active", true)
    .eq("status", statusFiltro);

  if (input.bloco_id) q = q.eq("bloco_id", input.bloco_id);
  if (input.valor_min != null) q = q.gte("valor", input.valor_min);
  if (input.valor_max != null) q = q.lte("valor", input.valor_max);

  const { data: unidadesRaw, error: unErr } = await q.limit(2000);
  if (unErr) {
    console.error("Erro consultando unidades:", unErr);
    return json(500, { error: "Erro ao buscar unidades" });
  }

  let unidades = (unidadesRaw ?? []) as any[];
  if (input.quartos != null) {
    unidades = unidades.filter((u) => u.tipologia?.quartos === input.quartos);
  }

  // ordenar bloco / andar / numero
  unidades.sort((a, b) => {
    const ba = (a.bloco?.nome ?? "").localeCompare(b.bloco?.nome ?? "");
    if (ba !== 0) return ba;
    const aa = (a.andar ?? 0) - (b.andar ?? 0);
    if (aa !== 0) return aa;
    return String(a.numero ?? "").localeCompare(String(b.numero ?? ""));
  });

  // 7. Gerar PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 842; // A4 paisagem
  const pageHeight = 595;
  const margin = 30;

  const headers = ["Bloco", "Andar", "Unidade", "Tipologia", "Q", "Sui", "Vg", "Área m²", "Valor", "Status"];
  const colWidths = [70, 45, 60, 130, 30, 35, 35, 60, 110, 80];

  const drawHeader = (page: any, y: number) => {
    page.drawText(`Tabela de Unidades — ${emp.nome}`, {
      x: margin, y: pageHeight - margin, size: 14, font: fontBold, color: rgb(0, 0, 0),
    });
    const sub = `${emp.endereco_cidade ?? ""}${emp.endereco_uf ? "/" + emp.endereco_uf : ""}  ·  Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}  ·  Corretor: ${corretor.nome_completo}`;
    page.drawText(sub, { x: margin, y: pageHeight - margin - 16, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

    // table header
    let x = margin;
    page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 18, color: rgb(0.92, 0.92, 0.92) });
    headers.forEach((h, i) => {
      page.drawText(h, { x: x + 4, y: y, size: 9, font: fontBold, color: rgb(0, 0, 0) });
      x += colWidths[i];
    });
    return y - 18;
  };

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin - 40;
  y = drawHeader(page, y);

  const rowHeight = 14;
  for (const u of unidades) {
    if (y < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin - 40;
      y = drawHeader(page, y);
    }
    const row = [
      u.bloco?.nome ?? "-",
      u.andar != null ? String(u.andar) : "-",
      u.numero ?? "-",
      u.tipologia?.nome ?? "-",
      u.tipologia?.quartos != null ? String(u.tipologia.quartos) : "-",
      u.tipologia?.suites != null ? String(u.tipologia.suites) : "-",
      u.tipologia?.vagas != null ? String(u.tipologia.vagas) : "-",
      u.area_privativa != null ? Number(u.area_privativa).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "-",
      fmtBRL(u.valor != null ? Number(u.valor) : null),
      String(u.status ?? "-"),
    ];
    let x = margin;
    row.forEach((cell, i) => {
      const maxChars = Math.floor(colWidths[i] / 5);
      const text = cell.length > maxChars ? cell.slice(0, maxChars - 1) + "…" : cell;
      page.drawText(text, { x: x + 4, y, size: 8, font, color: rgb(0.1, 0.1, 0.1) });
      x += colWidths[i];
    });
    y -= rowHeight;
  }

  // rodapé
  const footerLines = [
    `Total: ${unidades.length} unidade(s) — Status filtrado: ${statusFiltro}`,
  ];
  if (emp.texto_rodape_relatorio) footerLines.push(emp.texto_rodape_relatorio);

  let fy = margin + (footerLines.length - 1) * 10;
  for (const line of footerLines) {
    page.drawText(line, { x: margin, y: fy, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    fy -= 10;
  }

  const pdfBytes = await pdfDoc.save();

  // 8. Upload no storage
  const path = `relatorios-ia/${emp.id}/${Date.now()}-${crypto.randomUUID()}.pdf`;
  const { error: upErr } = await supabase.storage
    .from("empreendimentos-documentos")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });

  if (upErr) {
    console.error("Erro upload PDF:", upErr);
    return json(500, { error: "Erro ao salvar PDF" });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("empreendimentos-documentos")
    .createSignedUrl(path, 3600);

  if (signErr || !signed) {
    console.error("Erro signed URL:", signErr);
    return json(500, { error: "Erro ao gerar URL" });
  }

  return json(200, {
    url: signed.signedUrl,
    path,
    total: unidades.length,
    empreendimento: emp.nome,
    status: statusFiltro,
    expira_em: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
});
