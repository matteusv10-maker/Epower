# Conferência EPOWER 2026 · Landing Page

LP da conferência de jovens do **Ello Eterno · AD Brás**. Tema **ASSUMIR ou FUGIR** (Jonas 1:8).
Site estático (HTML + CSS + JS, sem build). **Para publicar, suba só o conteúdo da pasta `site/`.**

```
site/                       O SITE: é isto que vai para a hospedagem
  index.html                página + CONFIGURAÇÃO DO EVENTO (topo do arquivo)
  assets/css/style.css      visual (paleta e fontes da ID Visual do Figma)
  assets/js/main.js         contagem, formulário, agenda (.ics), animações
  assets/img/               logos, texturas de mar, imagem de compartilhamento
  camisa/index.html         página de reserva da camisa (+ assets/css/camisa.css e assets/js/camisa.js)
integracoes/                scripts das planilhas (Apps Script): inscrições e reservas da camisa
dist/epower-2026.html       a LP inteira num arquivo só (gerado pelo tools/gerar-html-unico.mjs)
tools/gerar-html-unico.mjs  gera o dist/epower-2026.html
docs/                       relatório de revisão UX/UI (Baziotti)
```

## 1. Editar as informações do evento

Tudo fica no bloco `window.EPOWER`, no topo do `site/index.html`:

| Campo | O que é |
|---|---|
| `temaA` / `temaB` | Palavras do tema (hoje ASSUMIR / FUGIR) |
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
| `camisaLink` | Link da página de pedidos da camisa (botão "Quero minha camisa"). Vazio = o botão não leva a lugar nenhum |
| `camisaPrazo` | Último dia de pedidos (`2026-10-25`). Mostra "Faltam X dias" e, depois da data, troca para "Pedidos encerrados" e esconde o botão |

## 2. Imagens (banners, presenças e camisa)

Para trocar qualquer imagem, substitua o arquivo em `site/assets/img/` **mantendo o mesmo nome**:

| Arquivo | Onde aparece | Tamanho |
|---|---|---|
| `banner-mobile-1080.webp` e `banner-mobile-720.webp` | Topo da página no celular (arte vertical) | 1080 × 1920 e 720 × 1280 |
| `banner-desktop-1920.webp` e `banner-desktop-1280.webp` | Topo da página no computador (arte horizontal) | 1920 × 1080 e 1280 × 720 |
| `liderancas/*.webp` | "Nossas lideranças" (círculos) | quadrada, 360 × 360, rosto no centro |
| `camisa-1-800.webp` … `camisa-4-1080.webp` | Carrossel da camisa oficial (troca a cada 1,5 s) | 4:5, 1080 × 1350 (versões 800 e 1080) |
| `og-epower.jpg` | Prévia do link no WhatsApp | 1200 × 630 |

No topo do celular, o texto começa logo abaixo do logo da arte vertical (a 57% da altura). Se a arte nova mudar essa posição, ajuste `.hero__body { padding-top: 107% }` no `style.css`.

## 3. Formulários e planilhas

### Confirmação de presença (página principal)
Cada inscrição vai para **dois destinos ao mesmo tempo** (configurados no topo de `site/index.html`):
- `planilhaEndpoint`: planilha **Inscrições EPower** (Apps Script `integracoes/confirmacoes-presenca.gs`, projeto "EPOWER Inscrições").
  Colunas: caixa **Compareceu?** (check-in no dia, linha fica verde), Nome Completo, WhatsApp, Você é de alguma igreja?, Nome da igreja,
  data, link **Abrir conversa** (WhatsApp), **Observação**, origem, página e ID. A aba **Resumo** mostra totais e inscrições por origem (`?ref=`).
- `formEndpoint`: webhook do Make (JSON).

A página só mostra "Presença confirmada" se pelo menos um dos destinos confirmar o recebimento.

### Reserva da camisa (`site/camisa/`)
Página com formulário em etapas (dados e quantidade → tamanho de cada camisa → confirmação → "você está na fila").
Configuração no topo de `site/camisa/index.html` (`RESERVA`): preço (R$ 60), prazo (25/10), limite por pedido e `endpoint`.
As reservas vão para a planilha **Camisas EPower26** (Apps Script `integracoes/reservas-camisa.gs`, projeto "EPOWER Reservas Camisa"):
caixa **Pagamento realizado?** na frente (linha fica verde), data, nome, WhatsApp, link **Abrir conversa**, quantidade, tamanhos,
contagem por tamanho, valores, **Observação**, origem, página e ID. A aba **Resumo** soma camisas por tamanho, valor reservado, recebido e o que falta receber.

### Alterar um script
Abra a planilha → Extensões → Apps Script, edite e salve. Depois: **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**.
A URL continua a mesma. Rodar a função `configurar` refaz cabeçalho, formatação e resumo sem apagar dados.

Dica para as regionais: mande o link com `?ref=nome-da-regional` (ex.: `https://matteusv10-maker.github.io/Epower/?ref=setor-3`).

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

- [x] Tema: **ASSUMIR ou FUGIR**
- [x] Data (sábado, 7/11) e local (AD Brás · Av. Celso Garcia, 560) com mapa
- [x] Horário: a partir das 17h (`hora: "17:00"`)
- [x] `formEndpoint`: webhook do Make
- [x] Teste real: inscrição e reserva chegando nas planilhas (linhas "TESTE - pode apagar")
- [ ] Apagar as linhas de teste das duas planilhas
- [ ] Teste no Make com o cenário em "Run once"
- [x] Instagram: @elloeterno
- [x] Banners, fotos das lideranças e carrossel da camisa
- [x] Página de reserva da camisa ligada à planilha Camisas EPower26
- [x] `og:url` e `og:image`: https://matteusv10-maker.github.io/Epower/
- [ ] Rodar `node tools/gerar-html-unico.mjs` de novo se for usar o arquivo único
