// Carrinho da PersonalizaArte: guarda os itens no navegador e fecha o pedido pelo WhatsApp
(function () {
  const KEY = "pa_carrinho", NUM = "5519981862800", WA = "https://wa.me/" + NUM;
  const A_ESCOLHER = "A escolher";
  const $ = (s, el = document) => el.querySelector(s);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = c => localStorage.setItem(KEY, JSON.stringify(c));
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const fromEl = el => ({ codigo: el.dataset.codigo, nome: el.dataset.nome, url: el.dataset.url, foto: el.dataset.foto, cores: el.dataset.cores.split("|"), min: +el.dataset.min || 1 });
  const minOf = it => it.min || 1;
  const isPDP = !!$(".pdp-info");
  let files = []; // arquivos anexados (ficam só na memória desta página)

  // --- interface: botão flutuante (computador), barra inferior (celular) e gaveta ---
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 4h2l2.4 11h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>';
  const ICON_LASER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/><path d="M4 20h7"/></svg>';
  const CLIP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg>';
  document.body.insertAdjacentHTML("beforeend", `
    <button type="button" class="cart-fab" id="cart-fab" aria-label="Abrir carrinho" hidden>${ICON}<b class="cart-n">0</b></button>
    <nav class="mbar" aria-label="Ações rápidas">
      <a class="mb-wa" href="${WA}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><svg><use href="#wa"/></svg><span>WhatsApp</span></a>
      ${isPDP ? '<button type="button" class="mb-add">Adicionar ao carrinho</button>' : ""}
      <button type="button" class="mb-cart" aria-label="Abrir carrinho">${ICON}<span>Carrinho</span><b class="cart-n">0</b></button>
    </nav>
    <div class="cart-bg" id="cart-bg" hidden></div>
    <aside class="cart" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-t" hidden>
      <header><h2 id="cart-t">Seu carrinho</h2><button type="button" class="cart-x" id="cart-x" aria-label="Fechar carrinho">×</button></header>
      <div class="cart-body">
        <div id="cart-items"></div>
        <form class="cart-form" id="cart-form" onsubmit="return false">
          <label>O que vai na gravação?<textarea id="c-arte" rows="3" placeholder="Ex.: nome “Laura”, logo da empresa, escudo do time…"></textarea></label>
          <div class="anexo">
            <span class="lbl">Logo, foto ou arte <small>(opcional)</small></span>
            <label class="anexo-btn">${CLIP}<span>Anexar arquivo</span><input type="file" id="c-file" accept="image/*,application/pdf" multiple></label>
            <ul class="anexo-list" id="c-files"></ul>
          </div>
          <label>Seu nome<input id="c-nome" type="text" autocomplete="given-name" enterkeyhint="done"></label>
          <div class="seg" role="radiogroup" aria-label="Entrega">
            <label><input type="radio" name="c-entrega" value="Retirada em Hortolândia" checked><span>Retirar em Hortolândia</span></label>
            <label><input type="radio" name="c-entrega" value="Envio"><span>Envio</span></label>
          </div>
        </form>
      </div>
      <footer>
        <div class="passo2" id="passo2" hidden>
          <b>Falta enviar o arquivo</b>
          <span id="passo2-txt">Toque no botão abaixo e escolha a conversa da PersonalizaArte no WhatsApp.</span>
          <button type="button" class="btn dark" id="send-file">${CLIP}Enviar arquivo no WhatsApp</button>
        </div>
        <p class="cart-alerta" id="cart-alerta" role="alert" hidden></p>
        <a class="btn primary big" id="cart-send" href="${WA}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Finalizar pelo WhatsApp</a>
        <small id="cart-hint">O pedido vai pronto para o nosso WhatsApp. Respondemos com prévia e valor.</small>
      </footer>
    </aside>`);

  const fab = $("#cart-fab"), bg = $("#cart-bg"), drawer = $("#cart"), list = $("#cart-items"), send = $("#cart-send");
  let lastFocus = null;
  const open = () => { lastFocus = document.activeElement; bg.hidden = drawer.hidden = false; document.documentElement.classList.add("cart-open"); $("#cart-x").focus(); };
  const close = () => { bg.hidden = drawer.hidden = true; document.documentElement.classList.remove("cart-open"); if (lastFocus) lastFocus.focus(); };
  fab.onclick = open; $(".mb-cart").onclick = open; bg.onclick = close; $("#cart-x").onclick = close;
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !drawer.hidden) close(); });

  // --- anexos ---
  const canShareFiles = f => !!(navigator.canShare && f.length && navigator.canShare({ files: f }));
  function renderFiles() {
    $("#c-files").innerHTML = files.map((f, i) => `<li>${f.type.startsWith("image/") ? `<img src="${URL.createObjectURL(f)}" alt="">` : '<i class="pdf">PDF</i>'}<span>${esc(f.name)}</span><button type="button" data-i="${i}" aria-label="Remover ${esc(f.name)}">×</button></li>`).join("");
    refreshSend();
  }
  $("#c-file").addEventListener("change", e => { files = files.concat([...e.target.files]).slice(0, 5); e.target.value = ""; renderFiles(); });
  $("#c-files").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { files.splice(+b.dataset.i, 1); renderFiles(); } });

  function message(c) {
    let m = "Olá, PersonalizaArte! Quero um orçamento:\n";
    c.forEach((it, i) => {
      if (it.servico) {
        m += `\n${i + 1}) ${it.codigo} · ${it.nome}\n    Serviço: ${it.tipo || "Gravação"} · Material: ${it.material || A_ESCOLHER} · Quantidade: ${it.qtd}`;
        if ((it.descricao || "").trim()) m += `\n    Produto: ${it.descricao.trim()}`;
      } else m += `\n${i + 1}) ${it.codigo} · ${it.nome}\n    Cor: ${it.cor} · Quantidade: ${it.qtd}`;
    });
    const arte = $("#c-arte").value.trim(), nome = $("#c-nome").value.trim();
    const ent = (drawer.querySelector('input[name="c-entrega"]:checked') || {}).value;
    m += "\n";
    if (arte) m += `\n• Gravação: ${arte}`;
    if (files.length) m += `\n• Arquivo da arte: vou enviar em seguida (${files.map(f => f.name).join(", ")})`;
    m += `\n• Entrega: ${ent}`;
    if (nome) m += `\n\nMeu nome é ${nome}.`;
    return m;
  }
  function refreshSend() {
    const c = load();
    send.href = WA + "?text=" + encodeURIComponent(message(c));
    const abaixo = c.filter(it => it.qtd < minOf(it));
    const ok = c.length && !abaixo.length;
    send.setAttribute("aria-disabled", ok ? "false" : "true");
    if (!ok) send.removeAttribute("href"); // sem link: não abre o WhatsApp nem conta conversão
    const al = $("#cart-alerta");
    al.hidden = !abaixo.length;
    al.textContent = abaixo.length
      ? `Não é possível enviar: é necessário atingir a quantidade mínima de ${abaixo.map(it => `${it.nome} (${minOf(it)} un.)`).join(", ")}.`
      : "";
  }
  // segurança extra: não deixa abrir o WhatsApp com o pedido inválido
  send.addEventListener("click", e => {
    if (send.getAttribute("aria-disabled") === "true") { e.preventDefault(); e.stopImmediatePropagation(); toast("Atinja a quantidade mínima para enviar o pedido"); }
  }, true);
  // depois de enviar o pedido, se houver arquivo, mostra o passo 2
  send.addEventListener("click", () => {
    if (!files.length) return;
    setTimeout(() => {
      const share = canShareFiles(files);
      $("#passo2").hidden = false; $("#send-file").hidden = !share;
      $("#passo2-txt").textContent = share
        ? "Toque no botão abaixo e escolha a conversa da PersonalizaArte no WhatsApp."
        : "Na conversa que abriu no WhatsApp, clique no clipe 📎 e anexe o arquivo da arte.";
      send.classList.remove("primary"); send.classList.add("ghost");
    }, 600);
  });
  $("#send-file").onclick = async () => {
    try { await navigator.share({ files, title: "Arte para gravação" }); } catch (e) {}
  };

  // --- itens ---
  function render() {
    const c = load(), n = c.reduce((s, it) => s + it.qtd, 0);
    document.querySelectorAll(".cart-n").forEach(b => { b.textContent = n; b.hidden = !n; });
    fab.hidden = !c.length;
    list.innerHTML = c.length ? c.map((it, i) => it.servico ? servicoHTML(it, i) : `
      <div class="ci${it.qtd < minOf(it) ? " ci-baixo" : ""}" data-i="${i}">
        <img src="${esc(it.foto)}" alt="">
        <div class="ci-main"><a href="${esc(it.url)}">${esc(it.nome)}</a><small>Cód. ${esc(it.codigo)}${minOf(it) > 1 ? ` · mínimo ${minOf(it)} un.` : ""}</small>
          ${it.qtd < minOf(it) ? `<p class="ci-aviso">Quantidade mínima: ${minOf(it)} unidades. Aumente a quantidade para enviar o pedido.</p>` : ""}
          <select class="ci-cor" aria-label="Cor de ${esc(it.nome)}">${[A_ESCOLHER, ...it.cores].map(co => `<option${co === it.cor ? " selected" : ""}>${esc(co)}</option>`).join("")}</select></div>
        <div class="ci-side"><span class="qtd-box"><button type="button" class="ci-m" aria-label="Diminuir">−</button><input class="ci-q" type="number" min="${minOf(it)}" value="${it.qtd}" inputmode="numeric" aria-label="Quantidade"><button type="button" class="ci-p" aria-label="Aumentar">+</button></span>
          <button type="button" class="ci-rm">Remover</button></div>
      </div>`).join("") + (c.some(x => x.servico) ? '<button type="button" class="ci-outro" id="ci-outro">+ Adicionar outro produto meu</button>' : "") : '<p class="cart-empty">Seu carrinho está vazio.<br>Escolha um modelo e toque em “Adicionar”.</p>';
    refreshSend();
  }
  function setItem(i, patch) {
    const c = load(); Object.assign(c[i], patch);
    const j = c[i].servico ? -1 : c.findIndex((x, k) => k !== i && x.codigo === c[i].codigo && x.cor === c[i].cor); // junta itens iguais
    if (j > -1) { c[j].qtd += c[i].qtd; c.splice(i, 1); }
    save(c); render();
  }
  list.addEventListener("click", e => {
    const row = e.target.closest(".ci"); if (!row) return; const i = +row.dataset.i, c = load();
    if (e.target.closest(".ci-rm")) { c.splice(i, 1); save(c); render(); }
    if (e.target.closest(".ci-m")) setItem(i, { qtd: Math.max(minOf(c[i]), c[i].qtd - 1) });
    if (e.target.closest(".ci-p")) setItem(i, { qtd: c[i].qtd + 1 });
  });
  list.addEventListener("change", e => {
    const row = e.target.closest(".ci"); if (!row) return; const i = +row.dataset.i;
    if (e.target.matches(".ci-cor")) setItem(i, { cor: e.target.value });
    if (e.target.matches(".ci-mat")) { const c = load(); c[i].material = e.target.value; save(c); refreshSend(); }
    if (e.target.matches(".ci-tipo")) { const c = load(); c[i].tipo = e.target.value; save(c); refreshSend(); }
    if (e.target.matches(".ci-q")) setItem(i, { qtd: Math.max(1, parseInt(e.target.value, 10) || 1) });
  });
  // descrição do produto do cliente: salva enquanto digita, sem redesenhar (não perde o foco)
  list.addEventListener("input", e => {
    if (!e.target.matches(".ci-desc")) return;
    const i = +e.target.closest(".ci").dataset.i, c = load(); c[i].descricao = e.target.value; save(c);
  });
  list.addEventListener("click", e => { if (e.target.closest("#ci-outro")) addServico(); });
  drawer.addEventListener("input", refreshSend); drawer.addEventListener("change", refreshSend);

  function toast(t) {
    document.querySelectorAll(".toast").forEach(x => x.remove());
    const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
    document.body.appendChild(d); setTimeout(() => d.remove(), 2200);
  }
  function pulse() { document.querySelectorAll(".cart-fab,.mb-cart").forEach(b => { b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }); }
  function add(p, cor, qtd) {
    qtd = Math.max(qtd, p.min || 1);
    const c = load(), k = c.findIndex(x => x.codigo === p.codigo && x.cor === cor);
    if (k > -1) c[k].qtd += qtd; else c.push({ ...p, cor, qtd });
    save(c); render(); pulse(); toast("Adicionado ao carrinho ✓");
  }

  // --- serviço: gravar/cortar o produto do próprio cliente ---
  const MATERIAIS = ["Copo térmico", "Garrafa térmica", "Madeira", "Aço inox", "Acrílico", "Outro"];
  const TIPOS = ["Gravação", "Corte", "Gravação e corte"];
  const opts = (lista, atual, vazio) => (vazio ? `<option value="">${vazio}</option>` : "") + lista.map(o => `<option${o === atual ? " selected" : ""}>${esc(o)}</option>`).join("");
  function servicoHTML(it, i) {
    return `
      <div class="ci ci-serv" data-i="${i}">
        <span class="ci-ico" aria-hidden="true">${ICON_LASER}</span>
        <div class="ci-main"><b class="ci-tit">${esc(it.nome)}</b><small>Cód. ${esc(it.codigo)} · produto enviado por você</small></div>
        <div class="ci-campos">
          <label>Material<select class="ci-mat">${opts(MATERIAIS, it.material, "Escolha o material")}</select></label>
          <label>Serviço<select class="ci-tipo">${opts(TIPOS, it.tipo || "Gravação")}</select></label>
          <label class="full">Descreva o produto<textarea class="ci-desc" rows="2" placeholder="Ex.: copo térmico 473 ml preto, gravar o nome em volta">${esc(it.descricao || "")}</textarea></label>
        </div>
        <div class="ci-side"><span class="qtd-box"><button type="button" class="ci-m" aria-label="Diminuir">−</button><input class="ci-q" type="number" min="1" value="${it.qtd}" inputmode="numeric" aria-label="Quantidade"><button type="button" class="ci-p" aria-label="Aumentar">+</button></span>
          <button type="button" class="ci-rm">Remover</button></div>
      </div>`;
  }
  function focoServico(ultimo) {
    setTimeout(() => { const s = list.querySelectorAll(".ci-serv .ci-mat"); const el = ultimo ? s[s.length - 1] : s[0]; if (el) { el.scrollIntoView({ block: "center" }); el.focus(); } }, 60);
  }
  function addServico() {
    const c = load();
    c.push({ codigo: "PA-SV01", nome: "Gravar/cortar meu produto", servico: true, url: "/#gravacao-laser", foto: "", cores: [], cor: "", material: "", tipo: "Gravação", descricao: "", qtd: 1, min: 1 });
    save(c); render(); pulse(); open(); focoServico(true);
  }
  const btnMeu = $("#meu-produto");
  if (btnMeu) btnMeu.addEventListener("click", () => {
    const c = load(), k = c.findIndex(x => x.servico && !x.material && !(x.descricao || "").trim());
    if (k > -1) { open(); focoServico(false); } else addServico();
  });

  // --- botões dos cards ---
  document.querySelectorAll(".pc-add").forEach(b => b.addEventListener("click", () => { const p = fromEl(b); add(p, A_ESCOLHER, p.min); }));

  // --- página de produto ---
  const info = $(".pdp-info");
  if (info) {
    const q = $(".q-val", info), nomeCor = $(".cor-nome", info), MIN = +info.dataset.min || 1;
    info.querySelectorAll('input[name="cor"]').forEach(r => r.addEventListener("change", () => { nomeCor.textContent = r.value; }));
    $(".q-menos", info).onclick = () => { q.value = Math.max(MIN, (+q.value || MIN) - 1); };
    $(".q-mais", info).onclick = () => { q.value = (+q.value || MIN) + 1; };
    const aviso = document.createElement("p"); aviso.className = "q-aviso"; aviso.setAttribute("role", "alert"); aviso.hidden = true;
    aviso.textContent = `Quantidade mínima: ${MIN} unidades. É necessário atingir a quantidade mínima para fazer o pedido.`;
    $(".qtd-row", info).after(aviso);
    const confere = () => { const ok = (parseInt(q.value, 10) || 0) >= MIN; aviso.hidden = ok; q.closest(".qtd-box").classList.toggle("bad", !ok); return ok; };
    q.addEventListener("input", confere);
    ["q-menos", "q-mais"].forEach(c => $("." + c, info).addEventListener("click", confere));
    const addPDP = () => {
      if (!confere()) { q.focus(); toast(`Pedido mínimo: ${MIN} unidades`); return; }
      const cor = (info.querySelector('input[name="cor"]:checked') || {}).value || A_ESCOLHER;
      add(fromEl(info), cor, parseInt(q.value, 10)); open();
    };
    $(".pdp-add", info).onclick = addPDP; $(".mb-add").onclick = addPDP;
  }
  // --- pesquisa na home ---
  const busca = $("#busca");
  if (busca) {
    const norm = t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cards = [...document.querySelectorAll(".shop .pcard")], subs = [...document.querySelectorAll(".shop .subcat")];
    const abertas = new Map(subs.map(d => [d, d.open]));
    const filtrar = () => {
      const termos = norm(busca.value.trim()).split(/\s+/).filter(Boolean);
      $("#busca-x").hidden = !termos.length;
      cards.forEach(c => { c.hidden = termos.length > 0 && !termos.every(t => c.dataset.busca.includes(t)); });
      let total = 0;
      subs.forEach(d => {
        const vis = d.querySelectorAll(".pcard:not([hidden])").length; total += vis;
        d.hidden = termos.length > 0 && !vis;
        if (termos.length) { if (vis) d.open = true; } else d.open = abertas.get(d);
      });
      $("#busca-vazio").hidden = !(termos.length && !total);
    };
    subs.forEach(d => d.addEventListener("toggle", () => { if (!busca.value.trim()) abertas.set(d, d.open); }));
    busca.addEventListener("input", filtrar);
    busca.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); busca.blur(); } });
    $("#busca-x").onclick = () => { busca.value = ""; filtrar(); busca.focus(); };
  }
  render();
})();

/* Zoom da foto do produto */
(function () {
  const z = document.querySelector(".pdp-img[data-zoom]");
  if (!z || !window.HTMLDialogElement) return;
  const dlg = document.createElement("dialog");
  dlg.className = "lb";
  dlg.innerHTML = '<img alt=""><button type="button" aria-label="Fechar">×</button>';
  document.body.appendChild(dlg);
  const im = dlg.querySelector("img");
  z.addEventListener("click", () => { im.src = z.dataset.zoom; im.alt = (z.querySelector("img") || {}).alt || ""; dlg.showModal(); });
  dlg.addEventListener("click", () => dlg.close());
})();
