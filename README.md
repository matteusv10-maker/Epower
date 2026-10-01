# Conferência EPOWER 2026 · Landing Page

LP da conferência de jovens do **Ello Eterno · AD Brás**. Tema **ASSUMIR ou SEGUIR** (Jonas 1:8).
Site estático (HTML + CSS + JS, sem build). **Para publicar, suba só o conteúdo da pasta `site/`.**

```
site/                       O SITE: é isto que vai para a hospedagem
  index.html                página + CONFIGURAÇÃO DO EVENTO (topo do arquivo)
  assets/css/style.css      visual (paleta e fontes da ID Visual do Figma)
  assets/js/main.js         contagem, formulário, agenda (.ics), animações
  assets/img/               logos, texturas de mar, imagem de compartilhamento
dist/epower-2026.html       a LP inteira num arquivo só (gerado pelo tools/gerar-html-unico.mjs)
tools/gerar-html-unico.mjs  gera o dist/epower-2026.html
docs/                       relatório de revisão UX/UI (Baziotti)
```

## 1. Editar as informações do evento

Tudo fica no bloco `window.EPOWER`, no topo do `site/index.html`:

| Campo | O que é |
|---|---|
| `temaA` / `temaB` | Palavras do tema (hoje ASSUMIR / SEGUIR) |
| `data` | `2026-11-07` (sábado). Alimenta a contagem e o "Adicionar à agenda" |
| `hora` | Horário de início, ex.: `"19:00"`. Vazio = contagem até o dia e evento de dia inteiro na agenda |
| `duracaoHoras` | Duração usada na agenda quando `hora` estiver preenchida |
| `dataTexto`, `horarioTexto` | Como a data e o horário aparecem escritos na página |
| `localNome`, `localEndereco` | Local e endereço |
| `mapsLink` | Link do Google Maps para o botão "Como chegar" (o botão só aparece quando preenchido) |
| `mapsEmbed` | Google Maps → Compartilhar → Incorporar mapa → copie só o valor de `src="..."` |
| `agendaLink` | Link do evento no Google Agenda usado nos botões "Adicionar à agenda" (vazio = baixa .ics) |
| `formEndpoint` | Webhook do Make que recebe as confirmações (passo 3) |
| `instagram` | Link do perfil do Ello Eterno |

## 2. Colocar as fotos (preletores, cantores, direção, camisas)

Os espaços estão marcados no HTML com comentários. Para cada um, troque o bloco
`<div class="photo-slot">…</div>` por uma imagem:

```html
<img src="assets/img/convidados/nome.jpg" alt="Nome do preletor">
```

As fotos vão dentro de `site/assets/img/` (crie as pastas `convidados/` e `direcao/`).

Tamanhos recomendados (JPG ou WebP, até ~200 KB cada):
- **Hero (pregadores e cantores):** PNG recortado com fundo transparente, 1200 px de largura. Pode substituir os 3 arcos por uma única arte.
- **Line-up:** 900 × 1200 px (3:4), rosto no terço superior (o topo é arredondado).
- **Direção:** 600 × 600 px (quadrado, vira círculo).
- **Camisas:** 1200 × 900 px.

Quando todos os convidados estiverem confirmados, apague o bloco `guests__note` ("Os nomes são anunciados…").

## 3. Formulário (Make)

As confirmações vão para o webhook do Make configurado em `formEndpoint`
(`https://hook.us2.make.com/ma2okpak0ts18lqcshby91g34jfevmlw`), em JSON:

```json
{
  "evento": "EPOWER 2026",
  "nome": "Maria Souza",
  "whatsapp": "11987654321",
  "whatsappInternacional": "+5511987654321",
  "temIgreja": "Sim",
  "igreja": "AD Brás Setor 3",
  "origem": "setor-3",
  "pagina": "https://.../?ref=setor-3",
  "enviadoEm": "2026-10-01T04:08:59.497Z"
}
```

A página só mostra "Presença confirmada" quando o Make responde com sucesso; se falhar, mostra o erro e mantém os dados preenchidos.
Para o Make reconhecer os campos, envie uma confirmação de teste pelo site com o cenário em "Run once".

Dica para as regionais: mande o link com `?ref=nome-da-regional` (ex.: `https://seusite/?ref=setor-3`).
O campo **origem** mostra de onde veio cada confirmação.

## 4. HTML único (arquivo só)

`dist/epower-2026.html` tem tudo embutido (CSS, JS e imagens, ~900 KB): abre com dois cliques e pode ser enviado ou subido onde só aceita um arquivo.
Depois de editar qualquer coisa em `site/`, gere de novo:

```bash
node tools/gerar-html-unico.mjs
```

Para o site no ar, prefira publicar a pasta inteira (as imagens ficam em cache e o celular baixa só as versões leves).

## 5. Publicar

**No ar:** https://matteusv10-maker.github.io/Epower/ (repositório `matteusv10-maker/Epower`).
Cada `git push` na branch `main` publica a pasta `site/` automaticamente (GitHub Actions).

Outras opções:

Qualquer hospedagem estática serve. A mais simples: arraste a pasta **`site/`** em **app.netlify.com/drop**.
Nas outras hospedagens, envie o conteúdo de `site/` (o `index.html` fica na raiz).
Também funciona em Vercel, GitHub Pages ou na hospedagem do site da igreja.

Depois de publicar, no `site/index.html`, troque `og:url` e `og:image` pelo endereço completo
(ex.: `https://epower.adbras.com.br/assets/img/og-epower.jpg`). Sem isso, a prévia do link no WhatsApp não aparece.

## 6. Fonte dos títulos

A ID Visual usa **Tusker Grotesk 4700 Bold** (fonte paga). A página usa **Anton** (gratuita, muito parecida) como substituta.
Com a licença, coloque o `.woff2` em `site/assets/fonts/` e descomente o `@font-face` no topo do `style.css`.

## Rodar localmente

```bash
npx http-server site -p 5173 -c-1
```

## Checklist antes de publicar

- [ ] Tema confirmado (a arte do Figma diz **ASSUMIR ou FUGIR**; a LP está com **ASSUMIR ou SEGUIR**)
- [x] Data (sábado, 7/11) e local (AD Brás · Av. Celso Garcia, 560) com mapa
- [x] Horário: a partir das 17h (`hora: "17:00"`)
- [x] `formEndpoint`: webhook do Make
- [ ] Teste real: uma confirmação pelo site chegando no Make
- [x] Instagram: @elloeterno
- [ ] Fotos de preletores, cantores, direção e camisas
- [x] `og:url` e `og:image`: https://matteusv10-maker.github.io/Epower/
- [ ] Resposta do FAQ sobre o sorteio revisada
- [ ] Rodar `node tools/gerar-html-unico.mjs` de novo se for usar o arquivo único
