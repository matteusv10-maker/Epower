# Auditoria de LP · Conferência EPOWER 2026 · 26/09/2026

Vamos ser diretos? A LP está pronta de código. Não está pronta de conteúdo. Nota, evidência e plano abaixo.

**Brandbook de referência:** ID Visual EPOWER no Figma (Ello Eterno · AD Brás), página "E Power".
Paleta `#071C38` `#0B3876` `#1B519C` `#57CAFF` `#D9D9D9` + laranja `#EB7221`. Títulos Tusker Grotesk, subtítulos Playfair Display Semibold Italic, texto Raleway. Elementos: raio, setas em losango sempre na horizontal, texturas de mar e grão.
Regra zero-azul **não se aplica**: ela é do V4 Bilinski. Aqui o azul É a marca.

**Discovery 5W**
1. Faz: conferência de jovens do Ello Eterno (ministério de jovens da AD Brás).
2. Vende: presença gratuita + sorteio de camisas EPOWER e UMADESP.
3. Para quem: jovens das igrejas e regionais, mais os amigos que não são de igreja.
4. Com quem fala: coordenadores de regional que distribuem o link no WhatsApp e no Instagram.
5. Quando: fase de Divulgação (set/out) e de Confirmação (últimas semanas de outubro).

Nível de consciência: baixo a médio. Linguagem simples, poucos elementos, guia na mão. Atendido.

---

## Score · 8 dimensões (depois das correções)

| Dimensão | Nota | Evidência |
|---|---|---|
| Brandbook | 8.5 | Paleta, raio, setas, texturas e grão fiéis ao Figma. Tusker Grotesk trocada por Anton (licença). Tema diverge do Figma (ver VETO, item 1). |
| CRUD Usuário (formulário) | 9.0 | Validação inline com `aria-invalid` e mensagem por campo, máscara de WhatsApp, "Nome da igreja" só aparece no "Sim", foco no primeiro erro, estado de sucesso e "Confirmar outra pessoa". |
| Loading States | 8.0 | Botão com "Enviando…" e bloqueio de duplo envio. Hero com `preload` e cor de fundo de fallback. |
| Empty States | 8.5 | Fotos pendentes com ícone + rótulo + CTA "Acompanhar no Instagram". Mapa pendente com placeholder explicativo. Contagem sem data mostra "Data em breve". |
| Error Handling | 9.0 | Sucesso só com resposta 2xx do webhook (Make), timeout de 15 s, mensagem de erro clara. Modo demonstração avisa na tela. Zero falha silenciosa. |
| Carga Cognitiva | 9.0 | 4 itens de menu, 3 ou 4 campos no formulário, 1 CTA por seção (Lei de Hick). |
| Hierarquia Visual | 8.5 | 1 elemento dominante por viewport. F-pattern no desktop. Ponto de atenção: o laranja divide espaço entre "ASSUMIR" e o CTA (Von Restorff). Mantido porque é regra da marca. |
| Mobile | 9.0 | Sem rolagem horizontal de 320 a 1440 px. Toques ≥ 44 px. CTA acima da dobra até em 360 × 640. Barra fixa de ação. `prefers-reduced-motion` respeitado. |
| **Global** | **8.7** | **Produção-ready no código** |

## As 4 regras de LP

1. **Above the fold claro:** logo EPOWER + tema + CTA visíveis sem scroll em 360 × 640 e 375 × 812. OK.
2. **Hierarquia visual:** logo domina, tema segundo, CTA laranja terceiro. OK.
3. **CTA estratégico:** o primeiro botão ("Quero participar ↓") rola para "Sobre" e guia a jornada. O atalho direto ao formulário fica no cabeçalho (desktop) e na barra fixa (celular), que aparece assim que o hero sai da tela. Corrigido.
4. **Storytelling:** Tema → Contagem (urgência) → O que é + Jonas 1:8 (dilema) → Line-up (autoridade) → Sorteio (incentivo) → Local (logística) → Formulário (ação) → Direção (confiança) → FAQ (objeções) → CTA final. Sem buracos.

## O que foi corrigido nesta revisão

| # | Severidade | Problema | Correção |
|---|---|---|---|
| 1 | HIGH | Primeiro CTA pulava direto para o formulário (regra 3) | "Quero participar ↓" leva à próxima seção. Barra fixa e cabeçalho viram o atalho |
| 2 | HIGH | Rolagem horizontal de 13 px em celulares de 360 px (mapa com `min-height` + `aspect-ratio`) | Mapa com `width: 100%` e proporção 1:1 |
| 3 | HIGH | Envio com `no-cors` sucedia mesmo se o destino falhasse (falha silenciosa) | Envio em JSON com leitura da resposta; só confirma com 2xx do webhook |
| 4 | MEDIUM | `backdrop-filter` sobre fundos animados (custo de GPU em Android de entrada) | Fundos sólidos semitransparentes no hero, arcos, contagem e bloco do tema |
| 5 | MEDIUM | Texturas de 1400 a 1600 px baixadas também no celular | Versões `-m.jpg` (80 a 90 KB) no mobile, completas só a partir de 900 px |
| 6 | MEDIUM | Links "Adicionar à agenda" com 38 px de altura (Lei de Fitts) | `min-height: 44px` |
| 7 | MEDIUM | Placeholders de foto sem CTA (empty state incompleto) | "Os nomes são anunciados primeiro no Instagram" + botão |
| 8 | MEDIUM | Sorteio sem gatilho de perda | "Só concorre quem confirmar." (aversão à perda) |
| 9 | LOW | Revelação a 800 ms e brilho do CTA infinito | 600 ms ease-out, stagger de 90 ms; brilho roda 3 vezes (função: atenção, não decoração) |
| 10 | LOW | Placeholder dos campos com contraste de 3.2:1 | `#66758C` |
| 11 | LOW | Fontes não usadas (Raleway 400, Playfair 700) | Removidas do carregamento |

Contraste verificado (WCAG AA): texto `#071C38` sobre CTA `#EB7221` = 5.6:1. Texto secundário sobre fundo escuro ≈ 8.9:1. Subtítulo laranja escuro `#C4521A` sobre papel = 3.8:1 (texto grande, passa).

---

## VETO de publicação · 4 fixes obrigatórios (conteúdo, não código)

1. **Tema:** o Figma e a explicação da paleta falam em **ASSUMIR ou FUGIR** (a fuga de Jonas). A LP está com **ASSUMIR ou SEGUIR**, como pedido. Falei, mostrei: arte e página têm que dizer a mesma coisa. Decidir e trocar em `temaA`/`temaB`.
2. **Horário** em `window.EPOWER.hora`. Data (sábado, 7/11) e local (Av. Celso Garcia, 560, com mapa) já estão na página; a contagem vai até o dia.
3. **`formEndpoint`** configurado e testado. Sem isso, as confirmações não são salvas.
4. **`og:url` e `og:image` com URL absoluta.** O link vai circular no WhatsApp, e sem prévia a taxa de clique cai.

Depois disso: fotos (line-up, direção, camisas), @ do Instagram e licença da Tusker Grotesk. Nenhum desses bloqueia.

## Próximo Frankenstein (depois do lançamento)

- Instalar mapa de calor (Microsoft Clarity, gratuito) e medir: quantos clicam em "Quero participar" e quantos vão direto pela barra fixa.
- Com as primeiras 50 confirmações, adicionar prova social no hero ("+ de 50 jovens já confirmaram"). Priming positivo no topo do F.
- Testar A/B o texto do CTA da barra fixa: "Confirmar" contra "Garantir minha camisa".

Baziotti · Brand Chief · Auditado contra brandbook EPOWER (Ello Eterno · AD Brás)
