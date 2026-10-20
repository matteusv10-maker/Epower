/* Conferência EPOWER 2026 · Ello Eterno | AD Brás
   As informações do evento ficam em window.EPOWER (topo do index.html). */
(() => {
  "use strict";

  const C = window.EPOWER || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const pageUrl = location.href.split("#")[0];
  const cap = (s) => s.charAt(0) + s.slice(1).toLowerCase();

  /* ---------- Textos vindos da configuração ---------- */
  $$("[data-cfg]").forEach((el) => {
    const value = C[el.dataset.cfg];
    if (value) el.textContent = value;
  });
  if (C.temaA && C.temaB) {
    document.title = `Conferência EPOWER 2026 · ${cap(C.temaA)} ou ${cap(C.temaB)} · Ello Eterno | AD Brás`;
  }
  // " · 17h" ao lado da data no topo (some se o horário estiver vazio)
  $$("[data-hora-curta]").forEach((el) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(C.hora || "");
    if (m) el.textContent = `· ${+m[1]}h${m[2] === "00" ? "" : m[2]}`;
    else el.hidden = true;
  });
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-instagram]").forEach((el) => (el.href = C.instagram || "#"));

  // "Como chegar" só aparece quando o link do Maps estiver configurado
  $$("[data-maps-link]").forEach((el) => {
    if (C.mapsLink) el.href = C.mapsLink;
    else el.hidden = true;
  });

  // Mapa incorporado
  const map = $("[data-map]");
  if (map && C.mapsEmbed) {
    const iframe = document.createElement("iframe");
    iframe.src = C.mapsEmbed;
    iframe.title = `Mapa: ${C.localNome || "local do evento"}`;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    map.replaceChildren(iframe);
  }

  /* ---------- Camisa oficial: link e prazo dos pedidos ---------- */
  $$("[data-camisa-link]").forEach((a) => {
    if (!C.camisaLink) return; // sem link ainda: o botão fica na própria seção
    a.href = C.camisaLink;
    if (/^https?:/i.test(C.camisaLink) && new URL(C.camisaLink).origin !== location.origin) {
      a.target = "_blank";
      a.rel = "noopener";
    }
  });
  const hojeBR = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10); // data de hoje em Brasília
  if (/^\d{4}-\d{2}-\d{2}$/.test(C.camisaPrazo || "")) {
    const dias = Math.round((Date.parse(C.camisaPrazo) - Date.parse(hojeBR())) / 864e5);
    const titulo = $("[data-prazo-titulo]");
    const restante = $("[data-prazo-restante]");
    if (dias < 0) {
      $$("[data-prazo]").forEach((el) => el.classList.add("is-closed"));
      if (titulo) titulo.textContent = "Pedidos encerrados";
      if (restante) restante.textContent = "Os pedidos da camisa foram aceitos até 25/10.";
      $$("[data-camisa-link]").forEach((el) => (el.hidden = true));
    } else if (restante) {
      restante.textContent = dias === 0 ? "Hoje é o último dia para fazer o pedido."
        : dias === 1 ? "Amanhã é o último dia para fazer o pedido."
        : `Faltam ${dias} dias. Depois disso, não aceitamos mais pedidos.`;
    }
  }

  /* ---------- Carrossel da camisa ----------
     Cada foto fica ~1,5 s e a próxima entra pela direita. Uma cópia da 1ª foto no fim
     faz o loop continuar sempre no mesmo sentido. */
  const carousel = $("[data-carousel]");
  if (carousel) {
    const track = $("[data-track]", carousel);
    const slides = $$(".carousel__slide", track);
    const total = slides.length;
    const dotsWrap = $("[data-dots]", carousel);
    const pauseBtn = $("[data-pause]", carousel);
    const PARADO = 1500, TRANSICAO = 700;
    let atual = 0, timer = null, visivel = false, hover = false, pausado = reduceMotion;

    const clone = slides[0].cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("aria-label");
    $("img", clone).alt = "";
    $("img", clone).loading = "lazy";
    track.append(clone);

    const dots = slides.map((_, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel__dot";
      b.setAttribute("aria-label", `Mostrar foto ${k + 1} de ${total}`);
      b.addEventListener("click", () => { ir(k); reiniciar(); });
      dotsWrap.append(b);
      return b;
    });
    const marcar = () => dots.forEach((d, k) => d.setAttribute("aria-current", String(k === atual % total)));
    const ir = (k, animar = true) => {
      atual = k;
      track.style.transition = animar ? "" : "none";
      track.style.transform = `translateX(${-100 * atual}%)`;
      marcar();
    };
    track.addEventListener("transitionend", () => {
      if (atual !== total) return;
      ir(0, false);           // chegou na cópia da 1ª: volta sem animação
      void track.offsetWidth;
      track.style.transition = "";
    });
    const parar = () => { clearInterval(timer); timer = null; };
    const iniciar = () => {
      if (timer || pausado || hover || !visivel || document.hidden) return;
      timer = setInterval(() => ir(atual + 1), PARADO + TRANSICAO);
    };
    const reiniciar = () => { parar(); iniciar(); };
    const atualizarBotao = () => {
      pauseBtn.setAttribute("aria-label", pausado ? "Retomar fotos" : "Pausar fotos");
      $("[data-icon-pause]", pauseBtn).hidden = pausado;
      $("[data-icon-play]", pauseBtn).hidden = !pausado;
    };
    pauseBtn.addEventListener("click", () => { pausado = !pausado; atualizarBotao(); reiniciar(); });
    carousel.addEventListener("mouseenter", () => { hover = true; parar(); });
    carousel.addEventListener("mouseleave", () => { hover = false; iniciar(); });
    carousel.addEventListener("focusin", () => { hover = true; parar(); });
    carousel.addEventListener("focusout", () => { hover = false; iniciar(); });
    document.addEventListener("visibilitychange", reiniciar);
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; reiniciar(); }, { threshold: 0.3 }).observe(carousel);
    ir(0, false);
    atualizarBotao();
  }

  /* ---------- Sem palavras viúvas ----------
     Junta as duas últimas palavras de cada parágrafo com espaço inquebrável,
     para nenhuma linha terminar com uma palavra sozinha. */
  const noWidow = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let wordSeen = false;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const text = node.nodeValue;
      const body = wordSeen ? text : text.replace(/\s+$/, "");
      const idx = body.search(/\s(?=\S*$)/); // último espaço antes da última palavra
      if (!wordSeen && body.length === 0) continue;
      if (idx >= 0) {
        node.nodeValue = body.slice(0, idx) + "\u00A0" + text.slice(idx + 1);
        return;
      }
      wordSeen = true; // este nó só tem a última palavra: o espaço está no nó anterior
    }
  };
  $$("p, .questions li, .checks li, summary, figcaption, h2, .form-success h3").forEach((el) => {
    if (el.closest("[data-countdown], .theme-title, .sticky-cta, .facts, .site-nav, .leader__name")) return;
    const words = el.textContent.trim().split(/\s+/);
    // títulos grandes: só junta quando sobra espaço (3+ palavras e final curto), para não estourar a largura
    if (/^H\d$/.test(el.tagName) && (words.length < 3 || words.slice(-2).join(" ").length > 14)) return;
    noWidow(el);
  });

  /* ---------- Cabeçalho e barra fixa ---------- */
  const header = $("[data-header]");
  const sticky = $("[data-sticky-cta]");
  const hero = $(".hero");
  const confirmSection = $("#confirmar");
  const footer = $(".site-footer");
  const state = { heroVisible: true, formVisible: false, footerVisible: false };

  const onScroll = () => header.toggleAttribute("data-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const updateSticky = () => {
    const show = !state.heroVisible && !state.formVisible && !state.footerVisible;
    sticky.classList.toggle("is-visible", show);
    sticky.setAttribute("aria-hidden", String(!show));
    const link = $("a", sticky);
    if (link) link.tabIndex = show ? 0 : -1;
  };
  const watch = (el, key, rootMargin = "0px") => {
    if (!el) return;
    new IntersectionObserver(([entry]) => {
      state[key] = entry.isIntersecting;
      updateSticky();
    }, { rootMargin }).observe(el);
  };
  watch(hero, "heroVisible", "0px 0px -35% 0px");
  watch(confirmSection, "formVisible", "0px 0px -20% 0px");
  watch(footer, "footerVisible");

  // Leva ao formulário e, no computador, já coloca o cursor no nome
  $$("[data-cta]").forEach((a) =>
    a.addEventListener("click", () => {
      if (!finePointer) return;
      setTimeout(() => {
        const first = $("#f-nome");
        if (first && !first.closest("[hidden]")) first.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 650);
    })
  );

  /* ---------- Revelar ao rolar ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    revealEls.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      const i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = `${Math.min(i, 4) * 90}ms`;
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));

    // Perguntas de Jonas 1:8 acendem uma a uma
    const qio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-lit");
          qio.unobserve(e.target);
        }
      });
    }, { rootMargin: "-30% 0px -40% 0px" });
    $$(".questions li").forEach((li) => qio.observe(li));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
    $$(".questions li").forEach((li) => li.classList.add("is-lit"));
  }

  /* ---------- Contagem regressiva ---------- */
  // Sem horário definido, conta até o começo do dia (e mostra "É hoje!" o dia inteiro)
  const temHora = /^\d{2}:\d{2}$/.test(C.hora || "");
  const start = Date.parse(`${C.data}T${temHora ? C.hora : "00:00"}:00-03:00`);
  const end = temHora ? start + (C.duracaoHoras || 4) * 36e5 : start + 864e5;
  const cdGrid = $("[data-countdown]");
  const cdDone = $("[data-countdown-done]");
  const cdTitle = $("#countdown-title");
  const cells = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const pad = (n) => String(n).padStart(2, "0");

  const renderCountdown = () => {
    if (!cdGrid) return false;
    if (Number.isNaN(start)) { // data ainda não definida na configuração
      cdGrid.hidden = true;
      cdTitle.textContent = "Data em breve";
      $$("[data-ics]").forEach((b) => (b.hidden = true));
      return false;
    }
    const now = Date.now();
    const diff = start - now;
    if (diff <= 0) {
      cdGrid.hidden = true;
      cdTitle.hidden = true;
      cdDone.hidden = false;
      cdDone.textContent = now < end ? "É hoje! Estamos te esperando." : "Obrigado por viver o EPOWER com a gente!";
      return false;
    }
    const d = Math.floor(diff / 864e5);
    const h = Math.floor((diff % 864e5) / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    const sec = Math.floor((diff % 6e4) / 1e3);
    [["d", d], ["h", h], ["m", m], ["s", sec]].forEach(([k, v]) => {
      const txt = pad(v);
      if (cells[k].textContent !== txt) {
        cells[k].textContent = txt;
        if (!reduceMotion) {
          cells[k].classList.remove("tick");
          void cells[k].offsetWidth;
          cells[k].classList.add("tick");
        }
      }
    });
    cdGrid.setAttribute("aria-label", `O evento começa em ${d} dias, ${h} horas, ${m} minutos e ${sec} segundos`);
    return true;
  };
  // atualiza na virada de cada segundo
  const loop = () => { if (renderCountdown()) setTimeout(loop, 1000 - (Date.now() % 1000) + 5); };
  loop();

  /* ---------- Adicionar à agenda (.ics) ---------- */
  const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const icsDay = (ms) => new Date(ms - 3 * 36e5).toISOString().slice(0, 10).replace(/-/g, ""); // dia no fuso de Brasília
  const icsEsc = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  const temaTxt = `${cap(C.temaA || "Assumir")} ou ${cap(C.temaB || "Fugir")}`;

  const downloadIcs = () => {
    if (Number.isNaN(start)) return;
    const where = [C.localNome, C.localEndereco].filter((v) => v && !/a confirmar/i.test(v)).join(" · ");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ello Eterno//EPOWER//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:epower-${icsDate(start)}@elloeterno`,
      `DTSTAMP:${icsDate(Date.now())}`,
      ...(temHora
        ? [`DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`]
        : [`DTSTART;VALUE=DATE:${C.data.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${icsDay(end)}`]),
      `SUMMARY:${icsEsc(`Conferência EPOWER · ${temaTxt}`)}`,
      `LOCATION:${icsEsc(where)}`,
      `DESCRIPTION:${icsEsc(`Conferência de jovens do Ello Eterno · AD Brás. Jonas 1:8. ${pageUrl}`)}`,
      `URL:${pageUrl}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Amanhã tem EPOWER!", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "epower-2026.ics" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  // Com agendaLink (evento do Google Agenda), os botões abrem o evento; sem ele, baixam um .ics
  const addToCalendar = () => {
    if (C.agendaLink) window.open(C.agendaLink, "_blank", "noopener");
    else downloadIcs();
  };
  $$("[data-ics]").forEach((b) => b.addEventListener("click", addToCalendar));

  /* ---------- Formulário ---------- */
  const form = $("[data-form]");
  if (!form) return;
  const success = $("[data-success]");
  const statusEl = $("[data-form-status]");
  const submitBtn = $("[data-submit]");
  const submitLabel = $("[data-submit-label]");
  const nome = $("#f-nome");
  const whats = $("#f-whats");
  const igrejaWrap = $("[data-igreja]");
  const igreja = $("#f-igreja");
  const choice = $(".choice", form);

  // Máscara (11) 91234-5678
  const maskPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  whats.addEventListener("input", () => { whats.value = maskPhone(whats.value); });

  // Mostra "Nome da igreja" só para quem respondeu Sim
  $$('input[name="temIgreja"]', form).forEach((r) =>
    r.addEventListener("change", () => {
      const yes = form.temIgreja.value === "Sim";
      igrejaWrap.hidden = !yes;
      igreja.required = yes;
      if (!yes) { igreja.value = ""; setError(igreja, "e-igreja", false); }
      setError(choice, "e-igreja-opt", false);
    })
  );

  function setError(el, id, show) {
    const msg = document.getElementById(id);
    el.setAttribute("aria-invalid", show ? "true" : "false");
    if (show) el.setAttribute("aria-describedby", id);
    else el.removeAttribute("aria-describedby");
    if (msg) msg.hidden = !show;
  }
  [nome, whats, igreja].forEach((el) =>
    el.addEventListener("input", () => {
      if (el.getAttribute("aria-invalid") === "true") el.setAttribute("aria-invalid", "false");
      const msg = document.getElementById(el.getAttribute("aria-describedby"));
      if (msg) msg.hidden = true;
    })
  );

  const validate = () => {
    const errors = [];
    const okNome = nome.value.trim().length >= 3;
    setError(nome, "e-nome", !okNome); if (!okNome) errors.push(nome);
    const digits = whats.value.replace(/\D/g, "");
    const okWhats = digits.length === 10 || digits.length === 11;
    setError(whats, "e-whats", !okWhats); if (!okWhats) errors.push(whats);
    const okOpt = !!form.temIgreja.value;
    setError(choice, "e-igreja-opt", !okOpt); if (!okOpt) errors.push($('input[name="temIgreja"]', form));
    if (form.temIgreja.value === "Sim") {
      const okIgreja = igreja.value.trim().length >= 2;
      setError(igreja, "e-igreja", !okIgreja); if (!okIgreja) errors.push(igreja);
    }
    return errors;
  };

  const setLoading = (on) => {
    submitBtn.disabled = on;
    submitLabel.textContent = on ? "Enviando…" : "Confirmar presença";
    const icon = submitBtn.querySelector("svg, .spinner");
    if (on) icon.outerHTML = '<span class="spinner" aria-hidden="true"></span>';
    else if (icon.classList.contains("spinner")) icon.outerHTML = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
  };

  const params = new URLSearchParams(location.search);
  let referrerHost = "";
  try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (_) { /* referrer inválido */ }
  const origem = params.get("ref") || params.get("utm_source") || referrerHost || "direto";

  const showSuccess = (firstName, demo) => {
    form.hidden = true;
    success.hidden = false;
    $("[data-success-name]").textContent = firstName ? `, ${firstName}` : "";
    $("[data-demo-note]").hidden = !demo;
    const text = `Bora comigo no EPOWER 2026? ⚡ Tema: ${temaTxt}. É gratuito! Confirma sua presença aqui: ${pageUrl}`;
    $("[data-share]").href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    success.focus({ preventScroll: true });
    success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    abrirAgendaModal();
  };

  // Pop-up "Marcar na agenda": abre logo depois da confirmação (se o evento ainda não passou)
  const agendaModal = $("[data-agenda-modal]");
  const abrirAgendaModal = () => {
    const eventoPassou = $$("[data-ics]").every((b) => b.hidden);
    if (!agendaModal || typeof agendaModal.showModal !== "function" || eventoPassou) return;
    setTimeout(() => { if (!agendaModal.open) agendaModal.showModal(); }, reduceMotion ? 0 : 700);
  };
  if (agendaModal) {
    const agendaTxt = $("[data-cfg-agenda]", agendaModal);
    if (agendaTxt && C.dataTexto && C.horarioTexto) agendaTxt.textContent = `${C.dataTexto}, ${C.horarioTexto.charAt(0).toLowerCase()}${C.horarioTexto.slice(1)} · ${C.localNome || "AD Brás"}. Assim você não esquece.`;
    $("[data-agenda-sim]", agendaModal).addEventListener("click", () => { addToCalendar(); agendaModal.close(); });
    $("[data-agenda-nao]", agendaModal).addEventListener("click", () => agendaModal.close());
    agendaModal.addEventListener("click", (e) => { // clique fora do cartão fecha
      if (e.target !== agendaModal) return;
      const r = agendaModal.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) agendaModal.close();
    });
    agendaModal.addEventListener("close", () => success.focus({ preventScroll: true }));
  }

  $("[data-again]").addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    nome.focus();
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    statusEl.hidden = true;
    const errors = validate();
    if (errors.length) { errors[0].focus(); return; }

    const firstName = nome.value.trim().split(/\s+/)[0];
    if (form.site.value) { showSuccess(firstName, false); return; } // bot

    const digits = whats.value.replace(/\D/g, "");
    const data = {
      evento: "EPOWER 2026",
      nome: nome.value.trim(),
      whatsapp: digits,
      whatsappInternacional: `+55${digits}`,
      temIgreja: form.temIgreja.value,
      igreja: igreja.value.trim(),
      origem,
      pagina: pageUrl,
      enviadoEm: new Date().toISOString(),
    };

    setLoading(true);
    try {
      if (C.planilhaEndpoint || C.formEndpoint) {
        // Envia para a planilha (Apps Script) e para o Make ao mesmo tempo.
        // Só mostra sucesso se pelo menos um confirmar o recebimento (nenhuma falha silenciosa).
        const enviar = async (url, headers) => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 20000);
          try {
            const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(data), signal: ctrl.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.clone().json().catch(() => null);
            if (json && json.ok === false) throw new Error(json.error || "erro");
            return true;
          } finally { clearTimeout(t); }
        };
        const envios = [];
        // text/plain evita a pré-verificação de CORS, que o Apps Script não responde
        if (C.planilhaEndpoint) envios.push(enviar(C.planilhaEndpoint, { "Content-Type": "text/plain;charset=utf-8" }));
        if (C.formEndpoint) envios.push(enviar(C.formEndpoint, { "Content-Type": "application/json" }));
        const resultados = await Promise.allSettled(envios);
        if (!resultados.some((r) => r.status === "fulfilled")) throw new Error("nenhum destino respondeu");
        showSuccess(firstName, false);
      } else {
        await new Promise((r) => setTimeout(r, 700));
        console.info("[EPOWER] Modo demonstração: configure window.EPOWER.formEndpoint. Dados:", data);
        showSuccess(firstName, true);
      }
      form.reset();
      igrejaWrap.hidden = true;
    } catch (err) {
      statusEl.textContent = "Não conseguimos enviar agora. Confira sua internet e tente de novo.";
      statusEl.hidden = false;
    } finally {
      setLoading(false);
    }
  });
})();
