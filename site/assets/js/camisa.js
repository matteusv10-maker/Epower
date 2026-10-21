/* Reserva da camisa EPOWER 2026 · configuração em window.RESERVA (topo de camisa/index.html) */
(() => {
  "use strict";

  const R = Object.assign({ preco: 60, prazo: "", maxCamisas: 10, tamanhos: ["PP", "P", "M", "G", "GG", "XG"], endpoint: "" }, window.RESERVA || {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const plural = (n) => `${n} ${n === 1 ? "camisa" : "camisas"}`;
  const fmtPhone = (d) => (d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  $$("[data-instagram]").forEach((a) => (a.href = R.instagram || "#"));

  const form = $("[data-reserva]");
  const stepsNav = $("[data-steps]");
  const done = $("[data-done]");
  const head = $(".reserva__head");
  const closed = $("[data-closed]");

  /* ---------- Prazo ---------- */
  const hojeBR = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(R.prazo)) {
    const dias = Math.round((Date.parse(R.prazo) - Date.parse(hojeBR())) / 864e5);
    const [, mm, dd] = R.prazo.split("-");
    const txt = $("[data-prazo-texto]");
    if (dias < 0) {
      form.hidden = true;
      stepsNav.hidden = true;
      $("[data-prazo]").hidden = true;
      closed.hidden = false;
      return;
    }
    txt.textContent = dias === 0 ? `Hoje é o último dia de pedidos (${dd}/${mm})`
      : dias === 1 ? `Pedidos só até amanhã, ${dd}/${mm}`
      : `Pedidos só até ${dd}/${mm} · faltam ${dias} dias`;
  }

  /* ---------- Estado ---------- */
  const nome = $("#r-nome");
  const whats = $("#r-whats");
  const igrejaWrap = $("[data-igreja]");
  const igreja = $("#r-igreja");
  const choice = $(".choice", form);
  const temIgreja = () => (form.querySelector('input[name="temIgreja"]:checked') || {}).value || "";
  const sizesWrap = $("[data-sizes]");
  let step = 1;
  let qtd = 1;
  let tamanhos = [];

  /* ---------- Etapas ---------- */
  const goTo = (n) => {
    const back = n < step;
    $$("[data-step]", form).forEach((s) => {
      const active = +s.dataset.step === n;
      s.hidden = !active;
      s.classList.remove("is-entering", "is-entering-back");
      if (active && !reduceMotion) { void s.offsetWidth; s.classList.add(back ? "is-entering-back" : "is-entering"); }
    });
    $$("[data-step-dot]").forEach((d) => {
      const k = +d.dataset.stepDot;
      d.classList.toggle("is-current", k === n);
      d.classList.toggle("is-done", k < n);
      if (k === n) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current");
    });
    step = n;
    if (n === 2) renderSizes();
    if (n === 3) renderSummary($("[data-summary]"), true);
    const title = $(`[data-step="${n}"] .step__title`);
    title.focus({ preventScroll: true });
    // no celular, garante que o topo da etapa fique visível
    const top = stepsNav.getBoundingClientRect().top;
    if (top < 60 || top > innerHeight * 0.6) stepsNav.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  /* ---------- Etapa 1: dados e quantidade ---------- */
  const maskPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  whats.addEventListener("input", () => { whats.value = maskPhone(whats.value); });

  const setError = (el, id, show) => {
    const msg = document.getElementById(id);
    el.setAttribute("aria-invalid", show ? "true" : "false");
    if (show) el.setAttribute("aria-errormessage", id); else el.removeAttribute("aria-errormessage");
    if (msg) msg.hidden = !show;
  };
  [nome, whats].forEach((el) => el.addEventListener("input", () => {
    if (el.getAttribute("aria-invalid") === "true") setError(el, el === nome ? "re-nome" : "re-whats", false);
  }));

  // "Nome da igreja" só aparece para quem respondeu Sim (igual ao formulário de presença)
  $$('input[name="temIgreja"]', form).forEach((r) => r.addEventListener("change", () => {
    const yes = temIgreja() === "Sim";
    igrejaWrap.hidden = !yes;
    if (!yes) { igreja.value = ""; setError(igreja, "re-igreja", false); }
    setError(choice, "re-igreja-opt", false);
  }));
  igreja.addEventListener("input", () => { if (igreja.getAttribute("aria-invalid") === "true") setError(igreja, "re-igreja", false); });

  const qtdValue = $("[data-qty-value]");
  const atualizarQtd = (animar) => {
    qtdValue.textContent = qtd;
    $("[data-qty-text]").textContent = plural(qtd);
    $("[data-total]").textContent = brl(qtd * R.preco);
    $('[data-qty="-1"]').disabled = qtd <= 1;
    $('[data-qty="1"]').disabled = qtd >= R.maxCamisas;
    if (animar && !reduceMotion) { qtdValue.classList.remove("bump"); void qtdValue.offsetWidth; qtdValue.classList.add("bump"); }
  };
  $$("[data-qty]").forEach((b) => b.addEventListener("click", () => {
    qtd = Math.min(R.maxCamisas, Math.max(1, qtd + +b.dataset.qty));
    tamanhos.length = Math.min(tamanhos.length, qtd);
    atualizarQtd(true);
  }));

  const validarDados = () => {
    const okNome = nome.value.trim().length >= 3;
    const d = whats.value.replace(/\D/g, "");
    const okWhats = d.length === 10 || d.length === 11;
    setError(nome, "re-nome", !okNome);
    setError(whats, "re-whats", !okWhats);
    const okOpt = !!temIgreja();
    setError(choice, "re-igreja-opt", !okOpt);
    const okIgreja = temIgreja() !== "Sim" || igreja.value.trim().length >= 2;
    setError(igreja, "re-igreja", !okIgreja);
    if (!okNome) { nome.focus(); return false; }
    if (!okWhats) { whats.focus(); return false; }
    if (!okOpt) { form.querySelector('input[name="temIgreja"]').focus(); return false; }
    if (!okIgreja) { igreja.focus(); return false; }
    return true;
  };

  /* ---------- Etapa 2: tamanho de cada camisa ---------- */
  const renderSizes = () => {
    const rows = $$(".size-row", sizesWrap);
    rows.slice(qtd).forEach((r) => r.remove());
    for (let i = rows.length; i < qtd; i++) {
      const fs = document.createElement("fieldset");
      fs.className = "size-row" + (reduceMotion ? "" : " is-new");
      fs.dataset.index = i;
      fs.innerHTML = `<legend><svg aria-hidden="true"><use href="#i-shirt"/></svg> Camisa ${i + 1}<span class="size-row__picked" data-picked></span></legend>
        <div class="chips">${R.tamanhos.map((t) => `<label class="chip"><input type="radio" name="tam-${i}" value="${t}"><span>${t}</span></label>`).join("")}</div>`;
      sizesWrap.append(fs);
      if (tamanhos[i]) $(`input[value="${tamanhos[i]}"]`, fs).checked = true;
    }
    $$(".size-row", sizesWrap).forEach((r) => marcarLinha(r));
    atualizarAplicar();
  };
  const marcarLinha = (row) => {
    const i = +row.dataset.index;
    const t = tamanhos[i];
    row.classList.toggle("is-done", !!t);
    $("[data-picked]", row).textContent = t ? `Tamanho ${t}` : "";
    if (t) row.removeAttribute("aria-invalid");
  };
  sizesWrap.addEventListener("change", (e) => {
    const row = e.target.closest(".size-row");
    if (!row) return;
    tamanhos[+row.dataset.index] = e.target.value;
    marcarLinha(row);
    atualizarAplicar();
    if (tamanhos.filter(Boolean).length === qtd) $("#re-sizes").hidden = true;
  });

  // "Usar M nas que faltam": preenche só as camisas ainda sem tamanho (nunca troca uma escolha feita)
  const aplicar = document.createElement("button");
  aplicar.type = "button";
  aplicar.className = "link-btn link-btn--dark sizes__apply";
  aplicar.hidden = true;
  aplicar.addEventListener("click", () => {
    const t = tamanhos[0];
    $$(".size-row", sizesWrap).forEach((r) => {
      const i = +r.dataset.index;
      if (!tamanhos[i]) { tamanhos[i] = t; $(`input[value="${t}"]`, r).checked = true; }
      marcarLinha(r);
    });
    atualizarAplicar();
    $("#re-sizes").hidden = true;
  });
  const atualizarAplicar = () => {
    const faltam = tamanhos.slice(0, qtd).filter(Boolean).length < qtd;
    aplicar.hidden = !(qtd > 1 && tamanhos[0] && faltam);
    aplicar.innerHTML = `<svg aria-hidden="true"><use href="#i-check"/></svg> Usar ${tamanhos[0] || ""} nas que faltam`;
    if (!aplicar.isConnected) sizesWrap.after(aplicar);
  };

  const validarTamanhos = () => {
    const faltando = $$(".size-row", sizesWrap).filter((r) => !tamanhos[+r.dataset.index]);
    faltando.forEach((r) => r.setAttribute("aria-invalid", "true"));
    $("#re-sizes").hidden = faltando.length === 0;
    if (faltando.length) { $("input", faltando[0]).focus(); return false; }
    return true;
  };

  /* ---------- Etapa 3: resumo ---------- */
  const contagem = () => R.tamanhos.reduce((o, t) => ((o[t] = tamanhos.slice(0, qtd).filter((x) => x === t).length), o), {});
  const renderSummary = (box, comEdicao) => {
    const d = whats.value.replace(/\D/g, "");
    const c = contagem();
    const resumo = R.tamanhos.filter((t) => c[t]).map((t) => `${c[t]}× ${t}`).join(" · ");
    box.innerHTML = `
      <dl>
        <div class="summary__row"><dt>Nome</dt><dd>${esc(nome.value.trim())}</dd></div>
        <div class="summary__row"><dt>Contato</dt><dd>${fmtPhone(d)}</dd></div>
        <div class="summary__row"><dt>Igreja</dt><dd>${temIgreja() === "Sim" ? esc(igreja.value.trim()) : "Não é de igreja"}</dd></div>
        <div class="summary__row"><dt>Camisas</dt><dd class="summary__shirts">${tamanhos.slice(0, qtd).map((t, i) => `<span>Camisa ${i + 1} · ${t}</span>`).join("")}</dd></div>
        <div class="summary__row"><dt>Quantidade</dt><dd>${plural(qtd)} (${resumo})</dd></div>
        <div class="summary__row"><dt>Valor unitário</dt><dd>${brl(R.preco)}</dd></div>
        <div class="summary__row summary__row--total"><dt>Total</dt><dd>${brl(qtd * R.preco)}</dd></div>
      </dl>
      ${comEdicao ? `<div class="summary__edit">
        <button type="button" class="link-btn link-btn--dark" data-edit="1"><svg aria-hidden="true"><use href="#i-edit"/></svg> Editar dados</button>
        <button type="button" class="link-btn link-btn--dark" data-edit="2"><svg aria-hidden="true"><use href="#i-edit"/></svg> Editar tamanhos</button>
      </div>` : ""}`;
  };
  $("[data-summary]").addEventListener("click", (e) => {
    const b = e.target.closest("[data-edit]");
    if (b) goTo(+b.dataset.edit);
  });

  /* ---------- Navegação ---------- */
  $$("[data-next]").forEach((b) => b.addEventListener("click", () => {
    if (step === 1 && validarDados()) goTo(2);
    else if (step === 2 && validarTamanhos()) goTo(3);
  }));
  $$("[data-prev]").forEach((b) => b.addEventListener("click", () => goTo(step - 1)));

  /* ---------- Envio ---------- */
  const status = $("[data-status]");
  const submitBtn = $("[data-submit]");
  const submitLabel = $("[data-submit-label]");
  const params = new URLSearchParams(location.search);
  let referrerHost = "";
  try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (_) { /* referrer inválido */ }
  const origem = params.get("ref") || params.get("utm_source") || referrerHost || "direto";

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (step === 1) { if (validarDados()) goTo(2); return; } // Enter nos campos avança
    if (step === 2) { if (validarTamanhos()) goTo(3); return; }
    status.hidden = true;

    const d = whats.value.replace(/\D/g, "");
    const c = contagem();
    const pedido = {
      tipo: "reserva-camisa",
      evento: "EPOWER 2026",
      nome: nome.value.trim(),
      whatsapp: d,
      whatsappInternacional: `+55${d}`,
      temIgreja: temIgreja(),
      igreja: temIgreja() === "Sim" ? igreja.value.trim() : "",
      quantidade: qtd,
      tamanhos: tamanhos.slice(0, qtd).join(", "),
      ...Object.fromEntries(R.tamanhos.map((t) => [`qtd${t}`, c[t]])),
      valorUnitario: R.preco,
      valorTotal: qtd * R.preco,
      origem,
      pagina: location.href.split("#")[0],
      enviadoEm: new Date().toISOString(),
    };
    if (form.site.value) { mostrarFila(false); return; } // anti-spam

    submitBtn.disabled = true;
    submitLabel.textContent = "Enviando…";
    try {
      if (R.endpoint) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        // text/plain evita a pré-verificação de CORS (necessário para Google Apps Script)
        const res = await fetch(R.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(pedido), signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => null);
        if (json && json.ok === false) throw new Error(json.error || "erro");
        mostrarFila(false);
      } else {
        await new Promise((r) => setTimeout(r, 700));
        console.info("[EPOWER] Reserva em modo demonstração:", pedido);
        mostrarFila(true);
      }
    } catch (err) {
      status.textContent = "Não conseguimos enviar agora. Confira sua internet e tente de novo.";
      status.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Confirmar reserva";
    }
  });

  const mostrarFila = (demo) => {
    form.hidden = true;
    stepsNav.hidden = true;
    head.hidden = true; // na tela final o título sai; fica só no formulário
    done.hidden = false;
    $("[data-demo]").hidden = !demo;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  };

  $("[data-again]").addEventListener("click", () => {
    form.reset();
    igrejaWrap.hidden = true;
    qtd = 1; tamanhos = [];
    sizesWrap.replaceChildren();
    atualizarQtd(false);
    done.hidden = true;
    head.hidden = false;
    form.hidden = false;
    stepsNav.hidden = false;
    goTo(1);
    nome.focus();
  });

  atualizarQtd(false);
})();
