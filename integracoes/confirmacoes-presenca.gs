/**
 * EPOWER 2026 · Inscrições (formulário "Confirmar presença" da página principal) → planilha "Inscrições EPower"
 *
 * Grava cada inscrição na PRIMEIRA aba da planilha, mantendo o cabeçalho que já existia
 * (Nome Completo, WhatsApp, Você é de alguma igreja?, Nome da igreja), com a caixa "Compareceu?"
 * na frente (check-in no dia) e uma coluna de Observação. Linhas marcadas ficam verdes.
 * A aba "Resumo" mostra totais e as inscrições por origem (?ref= de cada regional).
 *
 * Como publicar (uma vez):
 * 1. Na planilha: Extensões → Apps Script. Cole este arquivo inteiro e salve.
 * 2. Rode a função "configurar".
 * 3. Implantar → Nova implantação → App da Web · Executar como: Eu · Acesso: Qualquer pessoa
 * 4. Cole a URL (/exec) em planilhaEndpoint, no topo de site/index.html.
 */

const ABA_RESUMO = "Resumo";
const CABECALHO = [
  "Compareceu?", "Nome Completo", "WhatsApp", "Você é de alguma igreja?", "Nome da igreja",
  "Data da inscrição", "Chamar no WhatsApp", "Observação", "Origem", "Página", "ID",
];
const COL = Object.fromEntries(CABECALHO.map((h, i) => [h, i + 1]));

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const p = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!p.nome || !p.whatsapp) return json_({ ok: false, error: "Dados incompletos" });

    const sh = abaInscricoes_();
    const zap = String(p.whatsapp).replace(/\D/g, "");
    const id = "IN" + Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 900 + 100);
    sh.appendRow([
      false,
      limpar_(p.nome, 120),
      formatarTel_(zap),
      limpar_(p.temIgreja, 3),
      limpar_(p.igreja, 160),
      new Date(),
      "", // link do WhatsApp, preenchido abaixo
      "",
      limpar_(p.origem, 80),
      limpar_(p.pagina, 300),
      id,
    ]);
    const r = sh.getLastRow();
    if (zap) {
      // link como texto rico: funciona em planilha de qualquer idioma (fórmula daria #ERROR! em pt-BR)
      sh.getRange(r, COL["Chamar no WhatsApp"]).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText("Abrir conversa").setLinkUrl("https://wa.me/55" + zap).build());
    }
    sh.getRange(r, COL["Compareceu?"]).insertCheckboxes();
    sh.getRange(r, COL["Data da inscrição"]).setNumberFormat("dd/MM/yyyy HH:mm");
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// abrir a URL /exec no navegador deve mostrar {"ok":true,"status":"online"}
function doGet() {
  return json_({ ok: true, status: "online" });
}

/** Rode uma vez pelo editor: cabeçalho, formatação e resumo. */
function configurar() {
  const sh = abaInscricoes_();
  const ss = sh.getParent();
  sh.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO])
    .setFontWeight("bold").setBackground("#071C38").setFontColor("#FFFFFF").setWrap(true)
    .setVerticalAlignment("middle").setHorizontalAlignment("center");
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  sh.setRowHeight(1, 42);
  const larguras = { "Compareceu?": 100, "Nome Completo": 220, "WhatsApp": 135, "Você é de alguma igreja?": 120, "Nome da igreja": 200,
    "Data da inscrição": 140, "Chamar no WhatsApp": 130, "Observação": 260, "Origem": 120, "Página": 220, "ID": 150 };
  Object.entries(larguras).forEach(([h, w]) => sh.setColumnWidth(COL[h], w));
  sh.getRange(1, COL["Compareceu?"], sh.getMaxRows(), 1).setHorizontalAlignment("center");
  sh.getRange(2, COL["Observação"], sh.getMaxRows() - 1, 1).setBackground("#FFF8E6").setWrap(true);

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

  const rs = ss.getSheetByName(ABA_RESUMO) || ss.insertSheet(ABA_RESUMO);
  rs.clear();
  const A = "'" + sh.getName() + "'!";
  const L = (h) => columnLetter_(COL[h]);
  const ig = A + L("Você é de alguma igreja?") + "2:" + L("Você é de alguma igreja?");
  const origem = A + L("Origem") + "2:" + L("Origem");
  const linhas = [
    ["Resumo das inscrições", ""],
    ["Inscrições", "=COUNTA(" + A + "B2:B)"],
    ["São de alguma igreja", "=COUNTIF(" + ig + ",\"Sim\")"],
    ["Não são de igreja", "=COUNTIF(" + ig + ",\"Não\")"],
    ["Compareceram", "=COUNTIF(" + A + "A2:A,TRUE)"],
  ];
  // rótulos como valores; fórmulas com o separador do idioma da planilha (pt-BR usa ";")
  rs.getRange(1, 1, linhas.length, 1).setValues(linhas.map((l) => [l[0]]));
  linhas.forEach((l, i) => { if (l[1]) rs.getRange(i + 1, 2).setFormula(f_(l[1])); });
  rs.getRange("A7").setValue("Inscrições por origem (?ref=)").setFontWeight("bold");
  const consulta = "select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label Col1 'Origem', count(Col1) 'Inscrições'";
  rs.getRange("A8").setFormula(f_("=IFERROR(QUERY({" + origem + "},\"" + consulta + "\",0),\"Sem dados ainda\")"));
  rs.getRange("A1").setFontSize(14).setFontWeight("bold");
  rs.getRange(2, 1, 4, 1).setFontWeight("bold");
  rs.setColumnWidth(1, 240);
  rs.setColumnWidth(2, 140);
  ss.setActiveSheet(sh);
}

// sempre a primeira aba (onde já estava o cabeçalho original)
function abaInscricoes_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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
