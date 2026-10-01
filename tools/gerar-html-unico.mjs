// Gera dist/epower-2026.html: a LP inteira em UM arquivo (CSS, JS e imagens embutidos).
// Serve para enviar, abrir com dois cliques ou subir onde só aceita um .html.
// Uso (na pasta do projeto):  node tools/gerar-html-unico.mjs
// Sempre que editar site/index.html, CSS ou JS, rode de novo.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const project = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(project, "site"); // pasta do site (index.html + assets)
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };

const cache = new Map();
const dataUri = (rel) => {
  if (!cache.has(rel)) {
    const buf = readFileSync(join(root, rel));
    const ext = extname(rel).toLowerCase();
    cache.set(rel, ext === ".svg"
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buf.toString("utf8"))}`
      : `data:${MIME[ext]};base64,${buf.toString("base64")}`);
  }
  return cache.get(rel);
};

const css = readFileSync(join(root, "assets/css/style.css"), "utf8")
  .replace(/url\("\.\.\/img\/([^"]+)"\)/g, (_, file) => `url("${dataUri(`assets/img/${file}`)}")`);
const js = readFileSync(join(root, "assets/js/main.js"), "utf8");

let html = readFileSync(join(root, "index.html"), "utf8")
  .replace(/\s*<link rel="preload" as="image"[^>]*>/g, "")
  .replace('<link rel="stylesheet" href="assets/css/style.css">', () => `<style>\n${css}\n</style>`);

// Imagens <img>: a primeira ocorrência de cada arquivo leva os dados; as repetidas copiam dela (arquivo menor)
// (comentários do HTML ficam intactos: eles só trazem exemplos de onde colocar fotos)
const seen = new Map();
const inlineImgs = (chunk) => chunk.replace(/<img\b([^>]*?)\ssrc="(assets\/img\/[^"]+)"([^>]*)>/g, (tag, before, src, after) => {
  if (!seen.has(src)) {
    const id = `img-src-${seen.size}`;
    seen.set(src, id);
    return `<img${before} id="${id}" src="${dataUri(src)}"${after}>`;
  }
  return `<img${before} data-copy-src="${seen.get(src)}"${after}>`;
});
html = html.split(/(<!--[\s\S]*?-->)/).map((part, i) => (i % 2 ? part : inlineImgs(part))).join("");

const copyScript = `<script>document.querySelectorAll("img[data-copy-src]").forEach(function(i){var s=document.getElementById(i.getAttribute("data-copy-src"));if(s)i.src=s.src;});</script>`;
html = html.replace('<script src="assets/js/main.js" defer></script>', () => `${copyScript}\n  <script>\n${js}\n</script>`);

if (/(?:src|href)="assets\//.test(html.replace(/<!--[\s\S]*?-->/g, "").replace(/<meta[^>]*>/g, ""))) {
  console.warn("Atenção: ainda há referências a arquivos em assets/ fora de comentários e metatags.");
}

mkdirSync(join(project, "dist"), { recursive: true });
const out = join(project, "dist", "epower-2026.html");
writeFileSync(out, html);
console.log(`Gerado: dist/epower-2026.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
