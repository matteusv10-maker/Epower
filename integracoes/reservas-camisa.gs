/**
 * EPOWER 2026 · Reservas da camisa → planilha "Camisas EPower26"
 *
 * Recebe cada reserva enviada por site/camisa/ e grava uma linha na aba "Reservas",
 * com a caixa "Pagamento realizado?" na frente e uma coluna de Observação.
 * Linhas pagas ficam verdes. A aba "Resumo" soma camisas por tamanho e valores.
 *
 * Como publicar (uma vez):
 * 1. Na planilha: Extensões → Apps Script. Cole este arquivo inteiro e salve.
 * 2. Rode a função "configurar" (cria as abas, cabeçalho e formatação).
 * 3. Implantar → Nova implantação → App da Web
 *      Executar como: Eu · Quem pode acessar: Qualquer pessoa
 * 4. Copie a URL (termina em /exec) e cole em RESERVA.endpoint, no topo de site/camisa/index.html.
 * Depois de mudar o código: Implantar → Gerenciar implantações → editar → Nova versão.
 */

const ABA = "Reservas";
const ABA_RESUMO = "Resumo";
const TAMANHOS = ["PP", "P", "M", "G", "GG"];
const CABECALHO = [
  "Pagamento realizado?", "Data do pedido", "Nome", "WhatsApp", "Chamar no WhatsApp",
  "Quantidade", "Tamanhos (por camisa)", "PP", "P", "M", "G", "GG",
  "Valor unitário", "Valor total", "Observação", "Origem", "Página", "ID do pedido",
];
const COL = Object.fromEntries(CABECALHO.map((h, i) => [h, i + 1]));

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const p = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!p.nome || !p.whatsapp || !p.quantidade) return json_({ ok: false, error: "Dados incompletos" });

    const sh = abaReservas_();
    const zap = String(p.whatsapp).replace(/\D/g, "");
    const qtd = Math.max(1, Math.min(50, Number(p.quantidade) || 1));
    const unit = Number(p.valorUnitario) || 60;
    const id = "EP" + Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 900 + 100);

    const linha = [
      false,
      new Date(),
      limpar_(p.nome, 120),
      formatarTel_(zap),
      "", // link do WhatsApp, preenchido abaixo
      qtd,
      limpar_(p.tamanhos, 200),
      ...TAMANHOS.map((t) => Number(p["qtd" + t]) || 0),
      unit,
      qtd * unit,
      "",
      limpar_(p.origem, 80),
      limpar_(p.pagina, 300),
      id,
    ];
    sh.appendRow(linha);
    const r = sh.getLastRow();
    if (zap) {
      // link como texto rico: funciona em planilha de qualquer idioma (fórmula daria #ERROR! em pt-BR)
      sh.getRange(r, COL["Chamar no WhatsApp"]).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("Abrir conversa").setLinkUrl("https://wa.me/55" + zap).build());
    }
    sh.getRange(r, COL["Pagamento realizado?"]).insertCheckboxes();
    sh.getRange(r, COL["Data do pedido"]).setNumberFormat("dd/MM/yyyy HH:mm");
    sh.getRange(r, COL["Valor unitário"], 1, 2).setNumberFormat('"R$" #,##0.00');
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Teste rápido no navegador: abrir a URL /exec deve mostrar {"ok":true,"status":"online"}
function doGet() {
  return json_({ ok: true, status: "online" });
}

/** Rode uma vez pelo editor: cria abas, cabeçalho, formatação e resumo. */
function configurar() {
  const sh = abaReservas_();
  const ss = sh.getParent();
  sh.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO])
    .setFontWeight("bold").setBackground("#071C38").setFontColor("#FFFFFF").setWrap(true).setVerticalAlignment("middle");
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  sh.setRowHeight(1, 42);
  const larguras = { "Pagamento realizado?": 110, "Data do pedido": 130, "Nome": 220, "WhatsApp": 135, "Chamar no WhatsApp": 130,
    "Quantidade": 90, "Tamanhos (por camisa)": 170, "Valor unitário": 100, "Valor total": 100, "Observação": 260, "Origem": 110, "Página": 220, "ID do pedido": 150 };
  Object.entries(larguras).forEach(([h, w]) => sh.setColumnWidth(COL[h], w));
  TAMANHOS.forEach((t) => sh.setColumnWidth(COL[t], 48));
  sh.getRange(1, COL["Pagamento realizado?"], sh.getMaxRows(), 1).setHorizontalAlignment("center");
  sh.getRange(2, COL["Observação"], sh.getMaxRows() - 1, 1).setBackground("#FFF8E6").setWrap(true);

  // linha inteira verde quando o pagamento estiver marcado
  const regra = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=$A2=TRUE").setBackground("#D9F2E3")
    .setRanges([sh.getRange(2, 1, sh.getMaxRows() - 1, CABECALHO.length)]).build();
  sh.setConditionalFormatRules([regra]);

  // refaz o link "Abrir conversa" das linhas que já existem
  const ultima = sh.getLastRow();
  if (ultima > 1) {
    const tels = sh.getRange(2, COL["WhatsApp"], ultima - 1, 1).getDisplayValues();
    tels.forEach(([t], i) => {
      const d = String(t).replace(/\D/g, "");
      if (d) sh.getRange(i + 2, COL["Chamar no WhatsApp"]).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("Abrir conversa").setLinkUrl("https://wa.me/55" + d).build());
    });
  }

  // aba de resumo
  const rs = ss.getSheetByName(ABA_RESUMO) || ss.insertSheet(ABA_RESUMO);
  rs.clear();
  const A = "'" + ABA + "'!";
  const col = (h) => columnLetter_(COL[h]);
  const linhas = [
    ["Resumo das reservas", ""],
    ["Pedidos", "=COUNTA(" + A + "C2:C)"],
    ["Camisas reservadas", "=SUM(" + A + col("Quantidade") + "2:" + col("Quantidade") + ")"],
    ...TAMANHOS.map((t) => ["Tamanho " + t, "=SUM(" + A + col(t) + "2:" + col(t) + ")"]),
    ["Valor total reservado", "=SUM(" + A + col("Valor total") + "2:" + col("Valor total") + ")"],
    ["Pedidos pagos", "=COUNTIF(" + A + "A2:A,TRUE)"],
    ["Camisas pagas", "=SUMIF(" + A + "A2:A,TRUE," + A + col("Quantidade") + "2:" + col("Quantidade") + ")"],
    ["Valor recebido", "=SUMIF(" + A + "A2:A,TRUE," + A + col("Valor total") + "2:" + col("Valor total") + ")"],
    ["Falta receber", "=B" + (4 + TAMANHOS.length) + "-B" + (7 + TAMANHOS.length)],
  ];
  // rótulos como valores; fórmulas com o separador do idioma da planilha (pt-BR usa ";")
  rs.getRange(1, 1, linhas.length, 1).setValues(linhas.map((l) => [l[0]]));
  linhas.forEach((l, i) => { if (l[1]) rs.getRange(i + 1, 2).setFormula(f_(l[1])); });
  rs.getRange("A1").setFontSize(14).setFontWeight("bold");
  rs.getRange(2, 1, linhas.length - 1, 1).setFontWeight("bold");
  [4 + TAMANHOS.length, 7 + TAMANHOS.length, 8 + TAMANHOS.length].forEach((r) => rs.getRange(r, 2).setNumberFormat('"R$" #,##0.00'));
  rs.setColumnWidth(1, 200);
  rs.setColumnWidth(2, 140);
  ss.setActiveSheet(sh);
}

function abaReservas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    const primeira = ss.getSheets()[0];
    // planilha nova e vazia: reaproveita a primeira aba
    if (ss.getSheets().length === 1 && primeira.getLastRow() === 0) { primeira.setName(ABA); sh = primeira; }
    else sh = ss.insertSheet(ABA, 0);
  }
  if (sh.getLastRow() === 0) sh.appendRow(CABECALHO);
  return sh;
}

function formatarTel_(d) {
  if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
  return d;
}

// Evita que alguém injete fórmulas na planilha (ex.: "=IMPORTXML(...)")
function limpar_(valor, max) {
  const texto = String(valor || "").trim().slice(0, max);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

// Fórmulas gravadas pelo script seguem o idioma da planilha: em pt-BR o separador é ";".
// Escreva com vírgula e passe por f_(): troca as vírgulas fora de aspas pelo separador certo.
function f_(formula) {
  const loc = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetLocale() || "";
  if (/^(en|ja|zh|ko|th|he|hi)/.test(loc)) return formula;
  let out = "", aspas = false;
  for (const ch of formula) { if (ch === '"') aspas = !aspas; out += ch === "," && !aspas ? ";" : ch; }
  return out;
}

function columnLetter_(n) {
  let s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
