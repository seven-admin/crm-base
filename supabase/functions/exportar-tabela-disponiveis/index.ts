// Edge Function: exportar-tabela-disponiveis
// Recebe { empreendimento_id } + token compartilhado e gera PDF replicando
// o layout do botão "Exportar Disponíveis (PDF)" da tela de Empreendimentos.
// Sempre filtra unidades com status='disponivel'.
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  empreendimento_id: z.string().uuid(),
}).passthrough();

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const fmtBRL = (v: number | null | undefined) => {
  if (v == null) return "-";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
};

const fmtArea = (v: number | null | undefined) => {
  if (v == null) return "-";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDataHora = (d: Date) => {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
};

const fmtDataArquivo = (d: Date) => {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric",
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")}`;
};

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const ell = "…";
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const slice = text.slice(0, mid) + ell;
    if (font.widthOfTextAtSize(slice, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ell;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const para of paragraphs) {
    if (para.trim() === "") { out.push(""); continue; }
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      const trial = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        line = trial;
      } else {
        if (line) out.push(line);
        if (font.widthOfTextAtSize(w, size) > maxWidth) {
          out.push(truncate(w, font, size, maxWidth));
          line = "";
        } else {
          line = w;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiToken = Deno.env.get("N8N_API_TOKEN");
  const provided = req.headers.get("x-api-token");
  if (!apiToken || provided !== apiToken) {
    return json(401, { error: "Token inválido" });
  }

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
  const { empreendimento_id } = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: emp, error: empErr } = await supabase
    .from("empreendimentos")
    .select("id, nome, tipo, texto_rodape_relatorio, is_active, incorporadora:incorporadoras(nome)")
    .eq("id", empreendimento_id)
    .maybeSingle();

  if (empErr || !emp) return json(404, { error: "Empreendimento não encontrado" });
  if (!emp.is_active) return json(403, { error: "Empreendimento inativo" });

  const incorporadoraNome = (emp as any).incorporadora?.nome ?? null;
  const headerTitulo = incorporadoraNome ? `CRM - ${incorporadoraNome}` : "CRM";

  const isLoteamento = emp.tipo === "loteamento";
  const blocoLabel = isLoteamento ? "Quadra" : "Bloco";
  const unidLabel = isLoteamento ? "Lote" : "Número";

  const { data: unidadesRaw, error: unErr } = await supabase
    .from("unidades")
    .select(`
      id, numero, andar, area_privativa, valor,
      bloco:blocos(nome),
      tipologia:tipologias(nome)
    `)
    .eq("empreendimento_id", empreendimento_id)
    .eq("is_active", true)
    .eq("status", "disponivel")
    .limit(2000);

  if (unErr) {
    console.error("Erro consultando unidades:", unErr);
    return json(500, { error: "Erro ao buscar unidades" });
  }

  const unidades = (unidadesRaw ?? []) as any[];

  const unidadeIds = unidades.map(u => u.id);
  const boxesPorUnidade = new Map<string, string>();
  if (unidadeIds.length > 0) {
    const { data: boxesRaw } = await supabase
      .from("boxes")
      .select("numero, tipo, unidade_id")
      .in("unidade_id", unidadeIds)
      .eq("is_active", true);
    for (const b of (boxesRaw ?? []) as any[]) {
      const lbl = `${b.numero} (${b.tipo})`;
      const cur = boxesPorUnidade.get(b.unidade_id);
      boxesPorUnidade.set(b.unidade_id, cur ? `${cur}, ${lbl}` : lbl);
    }
  }

  const cmpNat = (a: string, b: string) =>
    a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
  unidades.sort((a, b) => {
    const ba = cmpNat(a.bloco?.nome ?? "", b.bloco?.nome ?? "");
    if (ba !== 0) return ba;
    const aa = (a.andar ?? 0) - (b.andar ?? 0);
    if (aa !== 0) return aa;
    return cmpNat(String(a.numero ?? ""), String(b.numero ?? ""));
  });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentW = pageWidth - margin * 2;

  const cBorder = rgb(0.67, 0.67, 0.67);
  const cHeadBg = rgb(0.898, 0.898, 0.898);
  const cHeadBottom = rgb(0.333, 0.333, 0.333);
  const cRowSep = rgb(0.8, 0.8, 0.8);
  const cText = rgb(0.2, 0.2, 0.2);
  const cMuted = rgb(0.47, 0.47, 0.47);
  const cSub = rgb(0.33, 0.33, 0.33);

  const colWidths = [55, 70, 45, 110, 100, 60, 83.28];
  const aligns: ("center"|"left"|"right")[] = ["center","left","center","left","center","center","right"];
  const headers = [unidLabel, blocoLabel, "Andar", "Tipologia", "Box", "Área (m²)", "Valor (R$)"];

  const headerTitleSize = 12;
  const headerSubSize = 8;
  const headerNameSize = 10;
  const headerGenSize = 8;
  const tableHeadSize = 8;
  const tableCellSize = 7.5;
  const rowPaddingV = 4;
  const rowMinH = 16;
  const tableHeadH = 18;

  const dataGeracao = fmtDataHora(new Date());

  type Ctx = { page: PDFPage; y: number };

  const drawTopHeader = (ctx: Ctx) => {
    const { page } = ctx;
    const topY = pageHeight - margin;
    page.drawText(headerTitulo, {
      x: margin, y: topY - headerTitleSize, size: headerTitleSize, font: fontBold, color: rgb(0,0,0),
    });
    page.drawText("Plataforma de Gestão Integrada", {
      x: margin, y: topY - headerTitleSize - 12, size: headerSubSize, font, color: cMuted,
    });
    const right = (txt: string, size: number, f: PDFFont, color: any, yLine: number) => {
      const w = f.widthOfTextAtSize(txt, size);
      page.drawText(txt, { x: pageWidth - margin - w, y: yLine, size, font: f, color });
    };
    right("Unidades Disponíveis", headerTitleSize, fontBold, rgb(0,0,0), topY - headerTitleSize);
    right(emp.nome, headerNameSize, font, cSub, topY - headerTitleSize - 13);
    right(`Gerado em ${dataGeracao}`, headerGenSize, font, cMuted, topY - headerTitleSize - 25);

    const lineY = topY - headerTitleSize - 33;
    page.drawRectangle({ x: margin, y: lineY, width: contentW, height: 1.2, color: cBorder });

    ctx.y = lineY - 10;
  };

  const drawTableHead = (ctx: Ctx) => {
    const { page } = ctx;
    const y = ctx.y - tableHeadH;
    page.drawRectangle({ x: margin, y, width: contentW, height: tableHeadH, color: cHeadBg });
    page.drawRectangle({ x: margin, y: y - 0.5, width: contentW, height: 1, color: cHeadBottom });

    let x = margin;
    const textY = y + (tableHeadH - tableHeadSize) / 2 + 1;
    headers.forEach((h, i) => {
      const w = colWidths[i];
      const tw = fontBold.widthOfTextAtSize(h, tableHeadSize);
      let tx = x + 4;
      if (aligns[i] === "center") tx = x + (w - tw) / 2;
      else if (aligns[i] === "right") tx = x + w - tw - 4;
      page.drawText(h, { x: tx, y: textY, size: tableHeadSize, font: fontBold, color: rgb(0,0,0) });
      x += w;
    });
    ctx.y = y - 1;
  };

  const newPage = (): Ctx => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const ctx: Ctx = { page, y: pageHeight - margin };
    drawTopHeader(ctx);
    drawTableHead(ctx);
    return ctx;
  };

  let ctx = newPage();

  for (const u of unidades) {
    const cells = [
      u.numero ?? "-",
      u.bloco?.nome ?? "-",
      u.andar != null ? `${u.andar}º` : "-",
      u.tipologia?.nome ?? "-",
      boxesPorUnidade.get(u.id) ?? "-",
      fmtArea(u.area_privativa),
      fmtBRL(u.valor != null ? Number(u.valor) : null),
    ].map(c => String(c));

    if (ctx.y - rowMinH < margin + 40) {
      ctx = newPage();
    }

    const rowH = rowMinH;
    const rowTop = ctx.y;
    const rowBottom = rowTop - rowH;

    let x = margin;
    const textY = rowBottom + (rowH - tableCellSize) / 2 + 1;
    cells.forEach((cell, i) => {
      const w = colWidths[i];
      const text = truncate(cell, font, tableCellSize, w - 8);
      const tw = font.widthOfTextAtSize(text, tableCellSize);
      let tx = x + 4;
      if (aligns[i] === "center") tx = x + (w - tw) / 2;
      else if (aligns[i] === "right") tx = x + w - tw - 4;
      ctx.page.drawText(text, { x: tx, y: textY, size: tableCellSize, font, color: cText });
      x += w;
    });

    ctx.page.drawRectangle({ x: margin, y: rowBottom, width: contentW, height: 0.5, color: cRowSep });

    ctx.y = rowBottom - rowPaddingV;
  }

  const reservaRodape = 30 + (emp.texto_rodape_relatorio ? 80 : 0);
  if (ctx.y < margin + reservaRodape) {
    ctx = newPage();
  }
  {
    const size = 9;
    const label = "Total de unidades disponíveis: ";
    const numero = String(unidades.length);
    const lw = font.widthOfTextAtSize(label, size);
    const nw = fontBold.widthOfTextAtSize(numero, size);
    const totalW = lw + nw;
    const tx = pageWidth - margin - totalW;
    const y = ctx.y - 14;
    ctx.page.drawText(label, { x: tx, y, size, font, color: cSub });
    ctx.page.drawText(numero, { x: tx + lw, y, size, font: fontBold, color: cSub });
    ctx.y = y - 8;
  }

  if (emp.texto_rodape_relatorio) {
    const sepY = ctx.y - 6;
    ctx.page.drawRectangle({ x: margin, y: sepY, width: contentW, height: 0.5, color: cRowSep });
    let y = sepY - 12;
    const size = 7.5;
    const lineH = size * 1.6;
    const lines = wrapText(String(emp.texto_rodape_relatorio), font, size, contentW);
    for (const ln of lines) {
      if (y < margin + 10) {
        ctx = newPage();
        y = ctx.y - 12;
      }
      ctx.page.drawText(ln, { x: margin, y, size, font, color: cSub });
      y -= lineH;
    }
    ctx.y = y;
  }

  const pdfBytes = await pdfDoc.save();

  const nomeArquivoBase = String(emp.nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_");
  const fileName = `Unidades_Disponiveis_${nomeArquivoBase}_${fmtDataArquivo(new Date())}.pdf`;
  const path = `relatorios-ia/${emp.id}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

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
    incorporadora: incorporadoraNome,
    status: "disponivel",
    expira_em: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
});
