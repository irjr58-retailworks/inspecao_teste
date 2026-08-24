/* ==========================================================
   Inspeção Porta-Pallet — PWA offline-first
   Hierarquia: VISTORIA (Loja/CD, Local, Data, Inspetor)
             → várias ESTRUTURAS, cada uma com o checklist 9.x
   Tudo salvo em IndexedDB (no aparelho), passo a passo.
   ========================================================== */

/* ---------------- Ícones (SVG inline, sem dependências) ---------------- */
const ICON = {
  home: '<path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  package: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
  alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/>',
  xcirc: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3v11H4Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.7 7.6-4.4M8.2 13.3l7.6 4.4"/>',
  download: '<path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5"/><path d="M4 19h16"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m5 5 14 14M19 5 5 19"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 9h5a1 1 0 0 1 1 1v11"/><path d="M9 21V9M9 13H6M9 9H6M4 21h16"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
};
function svg(name, size = 16, extra = "") {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${extra}">${ICON[name] || ""}</svg>`;
}

/* ---------------- Config padrão / taxonomia 9.x ---------------- */
const DEFAULT_ITEMS = [
  { id: "prumo", codigo: "9.17", nome: "Prumo da estrutura", desc: "Desaprumo longitudinal ou transversal fora da tolerância normativa", peca: "Serviço de realinhamento (prumo)", niveis: { ok: "Na tolerância do prumo", atencao: "Fora de prumo", critico: "Fora de prumo grave" } },
  { id: "col", codigo: "9.16", nome: "Colunas", desc: "Amassados, flambagem, corte ou trincas na coluna vertical", peca: "Coluna vertical" },
  { id: "colunaBase", codigo: "9.15", nome: "Coluna solta da placa de base", desc: "Coluna sem solda ou fixação adequada à placa de base", peca: "Solda/fixação da coluna" },
  { id: "juncao", codigo: "9.19", nome: "Junção de coluna", desc: "Emenda de coluna com folga, desalinhada ou danificada", peca: "Kit de junção de coluna" },
  { id: "desalinh", codigo: "9.20", nome: "Desalinhamento das colunas", desc: "Colunas de um mesmo montante fora do alinhamento entre si", peca: "Serviço de realinhamento" },
  { id: "placaBase", codigo: "9.13 · 9.14 · 9.39", nome: "Placa de base", desc: "Danificada, ausente ou adaptada fora do padrão do fabricante", peca: "Placa de base" },
  { id: "chumbador", codigo: "9.12", nome: "Chumbadores / fixação ao piso", desc: "Falta ou falha na fixação da placa de base ao piso", peca: "Chumbador" },
  { id: "calco", codigo: "9.38", nome: "Calços de nivelação", desc: "Ausentes ou insuficientes sob a placa de base", peca: "Calço de nivelação" },
  { id: "configuracao", codigo: "9.1", nome: "Configuração do montante", desc: "Configuração de níveis divergente do projeto original", peca: "Revisão de projeto / configuração" },
  { id: "longarina", codigo: "9.2 · 9.3 · 9.4 · 9.5 · 9.7", nome: "Longarinas (vigas)", desc: "Empenamento, flexão, encaixe solto, tipo divergente ou mal posicionada", peca: "Longarina" },
  { id: "travessa", codigo: "9.8 · 9.9 · 9.10 · 9.11", nome: "Travessas", desc: "Solta, faltante, danificada ou mal posicionada", peca: "Travessa" },
  { id: "diagonal", codigo: "9.8 · 9.9 · 9.10 · 9.11", nome: "Diagonais de contraventamento", desc: "Solta, faltante, danificada ou mal posicionada", peca: "Diagonal de contraventamento" },
  { id: "contravFundo", codigo: "9.44", nome: "Contraventamento de fundo / horizontal", desc: "Ausente ou danificado", peca: "Contraventamento" },
  { id: "transversina", codigo: "9.46", nome: "Transversina / reforço", desc: "Ausente ou danificada", peca: "Transversina / reforço" },
  { id: "adaptacoes", codigo: "9.6 · 9.18", nome: "Adaptações na estrutura", desc: "Furações, componentes soldados ou adaptações fora de projeto", peca: "Avaliação técnica de engenharia" },
  { id: "protetor", codigo: "9.21", nome: "Protetor de coluna", desc: "Ausente, danificado ou com parafusos de fixação faltando", peca: "Protetor de coluna" },
  { id: "distMontante", codigo: "9.22 · 9.23 · 9.24 · 9.25", nome: "Distanciador de montante", desc: "Ausente ou danificado entre colunas duplas", peca: "Distanciador de montante" },
  { id: "distParede", codigo: "9.26 · 9.27 · 9.28", nome: "Distanciador de parede", desc: "Ausente ou danificado", peca: "Distanciador de parede" },
  { id: "stopper", codigo: "9.43", nome: "Stopper / batente de paletes", desc: "Ausente ou danificado", peca: "Stopper" },
  { id: "suporteCentral", codigo: "9.41", nome: "Suporte rack central", desc: "Ausente, danificado ou desalinhado", peca: "Suporte rack central" },
  { id: "amarracao", codigo: "9.32", nome: "Amarrações superiores", desc: "Ausentes ou soltas entre estruturas", peca: "Amarração superior / tirante" },
  { id: "gondola", codigo: "9.29 · 9.30 · 9.31", nome: "Gôndolas", desc: "Danos estruturais na gôndola de acabamento", peca: "Reparo de gôndola" },
  { id: "colunaGondola", codigo: "9.42", nome: "Coluna da gôndola", desc: "Identificação ausente ou dano na coluna da gôndola", peca: "Coluna de gôndola" },
  { id: "planoMetalico", codigo: "9.40", nome: "Plano metálico ou de madeira", desc: "Ausente, quebrado ou fora de especificação", peca: "Plano metálico / de madeira" },
  { id: "piso", codigo: "9.37", nome: "Piso do corredor", desc: "Trincas, buracos ou desnível que comprometam a operação", peca: "Reparo de piso" },
  { id: "corrosao", codigo: "9.36", nome: "Corrosão", desc: "Corrosão em coluna, longarina, travessa, diagonal ou plano metálico", peca: "Tratamento anticorrosivo / substituição" },
  { id: "desplacamento", codigo: "9.35", nome: "Desplacamento de pintura", desc: "Pintura solta expondo o metal — indício de impacto ou corrosão", peca: "Retoque de pintura anticorrosiva" },
  { id: "placaCarga", codigo: "", nome: "Placa de capacidade de carga", desc: "Ausente, ilegível ou capacidade divergente do projeto", peca: "Placa de identificação de carga" },
  { id: "luminaria", codigo: "9.34", nome: "Luminárias", desc: "Queimada, ausente ou insuficiente sobre o corredor", peca: "Luminária" },
  { id: "iluminacao", codigo: "9.45", nome: "Nível de iluminação do corredor", desc: "Medição de iluminância — mínimo recomendado 50 lux", peca: "Reforço de iluminação", tipo: "medicao", unidade: "lux", min: 50 },
  { id: "unidadeCarga", codigo: "9.33", nome: "Unidades de carga / paletização", desc: "Paletes danificados, mal posicionados ou fora do padrão", peca: "Orientação de paletização" },
  { id: "vao", codigo: "", nome: "Sinalização e vão livre", desc: "Corredor obstruído ou sinalização de circulação apagada", peca: "Sinalização de piso" },
];
const DEFAULT_CONFIG = {
  empresa: "Minha Empresa",
  locais: ["Centro de Distribuição 001", "Loja Centro", "Loja Shopping"],
  fabricantes: ["ESMENA 75X78", "ESMENA TÚNEL 100X105", "PROVENÇA", "OUTROS"],
  itens: DEFAULT_ITEMS,
};
const STATUS = {
  ok: { label: "Conforme", short: "OK", icon: "check" },
  atencao: { label: "Atenção", short: "ATN", icon: "alert" },
  critico: { label: "Crítico", short: "CRIT", icon: "xcirc" },
};

/* ---------------- Utils ---------------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateOnly(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return d && m && y ? `${d}/${m}/${y}` : isoDate;
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function overallStatus(itens) {
  if (itens.some((i) => i.status === "critico")) return "critico";
  if (itens.some((i) => i.status === "atencao")) return "atencao";
  return "ok";
}
function vistoriaStatus(vistoria) {
  const all = (vistoria.estruturas || []).flatMap((e) => e.itens);
  return all.length ? overallStatus(all) : "ok";
}
function statusFromMedicao(valor, min) {
  const v = parseFloat(String(valor).replace(",", "."));
  if (isNaN(v)) return "ok";
  if (v >= min) return "ok";
  if (v >= min * 0.6) return "atencao";
  return "critico";
}
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h >= w && h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.55));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------------- IndexedDB ---------------- */
let dbPromise = new Promise((resolve, reject) => {
  const req = indexedDB.open("inspecaoPP", 2);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("config")) db.createObjectStore("config");
    if (!db.objectStoreNames.contains("vistorias")) db.createObjectStore("vistorias", { keyPath: "id" });
    if (!db.objectStoreNames.contains("parts")) db.createObjectStore("parts");
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
async function idbGet(store, key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly").objectStore(store).get(key);
    tx.onsuccess = () => resolve(tx.result);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbSet(store, key, value) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const os = db.transaction(store, "readwrite").objectStore(store);
    const req = key === undefined ? os.put(value) : os.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(store, key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetAll(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/* ---------------- Estado global ---------------- */
const state = {
  config: DEFAULT_CONFIG,
  vistorias: [],
  orderedParts: {},
  screen: "home",
  activeVistoriaId: null,
  activeEstruturaId: null,
  draftVistoria: null,
  saveTimer: null,
};

async function boot() {
  const cfg = await idbGet("config", "main");
  state.config = cfg || DEFAULT_CONFIG;
  if (!cfg) await idbSet("config", "main", DEFAULT_CONFIG);
  await persistVistoriaList();
  const parts = await idbGet("parts", "main");
  state.orderedParts = parts || {};
  render();
  window.addEventListener("online", updateOfflineBanner);
  window.addEventListener("offline", updateOfflineBanner);
}
function updateOfflineBanner() {
  const b = document.getElementById("offline-banner");
  if (b) b.classList.toggle("show", !navigator.onLine);
}
async function persistVistoriaList() {
  state.vistorias = (await idbGetAll("vistorias")).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function go(screen, vistoriaId = null, estruturaId = null) {
  state.screen = screen; state.activeVistoriaId = vistoriaId; state.activeEstruturaId = estruturaId;
  render();
  window.scrollTo(0, 0);
}

/* ---------------- Render raiz ---------------- */
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.appendChild(el("div", { id: "offline-banner", class: "offline-banner" + (!navigator.onLine ? " show" : "") }, "Sem conexão — os dados continuam sendo salvos normalmente no aparelho."));

  const estAtual = state.draftVistoria && (state.draftVistoria.estruturas || []).find((e) => e.id === state.activeEstruturaId);
  const titles = {
    home: "Início", vistoria: "Vistoria", estrutura: (estAtual && estAtual.codigo) || "Nova estrutura",
    history: "Histórico", parts: "Lista de peças", config: "Configurações",
    report: (state.vistorias.find((v) => v.id === state.activeVistoriaId) || {}).lojaCd || "Relatório",
  };
  const backTargets = {
    vistoria: () => go("home"),
    estrutura: () => go("vistoria", state.draftVistoria.id),
    history: () => go("home"),
    parts: () => go("home"),
    config: () => go("home"),
    report: () => go("history"),
  };
  app.appendChild(TopBar(titles[state.screen], state.screen !== "home" ? backTargets[state.screen] : null));

  const body = el("div", { style: "flex:1" });
  if (state.screen === "home") body.appendChild(HomeScreen());
  if (state.screen === "vistoria") body.appendChild(VistoriaScreen());
  if (state.screen === "estrutura") body.appendChild(EstruturaScreen());
  if (state.screen === "history") body.appendChild(HistoryScreen());
  if (state.screen === "parts") body.appendChild(PartsScreen());
  if (state.screen === "config") body.appendChild(ConfigScreen());
  if (state.screen === "report") body.appendChild(ReportScreen());
  app.appendChild(body);
  app.appendChild(BottomNav());
}

function TopBar(title, onBack) {
  const bar = el("div", { class: "topbar no-print" });
  bar.appendChild(onBack ? el("button", { onclick: onBack, html: svg("back", 22) }) : el("div", { style: "width:22px" }));
  bar.appendChild(el("h1", {}, title));
  return bar;
}
function BottomNav() {
  const items = [
    ["home", "Início", "home"], ["vistoria", "Vistoria", "plusCircle"], ["history", "Histórico", "clock"],
    ["parts", "Peças", "package"], ["config", "Ajustes", "settings"],
  ];
  const nav = el("div", { class: "bottomnav no-print" });
  items.forEach(([id, label, icon]) => {
    const active = id === state.screen || (id === "vistoria" && state.screen === "estrutura");
    const btn = el("button", { class: active ? "active" : "", onclick: () => go(id === "vistoria" ? "vistoria" : id) },
      el("span", { html: svg(icon, 20) }), el("span", { class: "label" }, label));
    nav.appendChild(btn);
  });
  return nav;
}
function Tag(status, size, labelOverride) {
  const s = STATUS[status];
  return el("span", { class: "tag " + status + (size === "sm" ? " sm" : "") },
    el("span", { html: svg(s.icon, size === "sm" ? 12 : 14) }), " " + (labelOverride || s.label));
}
function CodeBadge(codigo) {
  return codigo ? el("span", { class: "codebadge" }, codigo) : el("span");
}
function Card(attrs, ...children) { return el("div", { class: "card " + (attrs.class || ""), style: attrs.style || "" }, ...children); }
function Field(label, inputNode) { return el("div", { class: "field" }, el("label", {}, label), inputNode); }
function inputEl(value, onChange, placeholder, type) {
  const input = el("input", { class: "input", value: value || "", placeholder: placeholder || "", type: type || "text" });
  input.addEventListener("input", (e) => onChange(e.target.value));
  return input;
}
function selectEl(options, value, onChange) {
  const select = el("select", { class: "input" });
  (options || []).forEach((o) => select.appendChild(el("option", { value: o }, o)));
  select.value = value;
  select.addEventListener("change", (e) => onChange(e.target.value));
  return select;
}

/* ---------------- Home ---------------- */
function HomeScreen() {
  const wrap = el("div", { class: "screen" });
  const finalizadas = state.vistorias.filter((v) => v.finalizada);
  const estruturasPendentes = finalizadas.flatMap((v) => (v.estruturas || []).filter((e) => !e.resolvido));
  const critico = estruturasPendentes.filter((e) => overallStatus(e.itens) === "critico").length;
  const atencao = estruturasPendentes.filter((e) => overallStatus(e.itens) === "atencao").length;
  const rascunhos = state.vistorias.filter((v) => !v.finalizada);

  wrap.appendChild(el("div", { style: "margin-bottom:18px" },
    el("div", { class: "mono", style: "font-size:12px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:1px" }, state.config.empresa),
    el("h2", { style: "font-size:26px;margin-top:2px" }, "Inspeção de Porta-Pallets")));

  wrap.appendChild(el("button", { class: "cta", onclick: () => go("vistoria") },
    el("span", { style: "display:flex;align-items:center;gap:10px" }, el("span", { html: svg("building", 20) }), "Nova vistoria"),
    el("span", { html: svg("chevronRight", 18) })));

  const stats = el("div", { class: "stat-grid" },
    el("div", { class: "card stat-card" }, el("div", { class: "stat-num" }, String(finalizadas.length)), el("div", { class: "stat-label" }, "Vistorias")),
    el("div", { class: "card stat-card", style: atencao ? "background:var(--amber-bg)" : "" }, el("div", { class: "stat-num", style: "color:var(--amber-dark)" }, String(atencao)), el("div", { class: "stat-label", style: "color:var(--amber-dark)" }, "Atenção")),
    el("div", { class: "card stat-card", style: critico ? "background:var(--red-bg)" : "" }, el("div", { class: "stat-num", style: "color:var(--red-dark)" }, String(critico)), el("div", { class: "stat-label", style: "color:var(--red-dark)" }, "Críticas")));
  wrap.appendChild(stats);

  if (rascunhos.length) {
    wrap.appendChild(el("h3", { class: "section-title" }, "Vistorias em andamento (salvas no aparelho)"));
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:18px" });
    rascunhos.forEach((v) => list.appendChild(VistoriaRow(v, true)));
    wrap.appendChild(list);
  }

  const head = el("div", { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, "Recentes"));
  if (finalizadas.length) head.appendChild(el("button", { style: "background:none;border:none;color:var(--ink-faint);font-size:12.5px", onclick: () => go("history") }, "ver tudo"));
  wrap.appendChild(head);

  const recentes = finalizadas.slice(0, 5);
  if (!recentes.length) {
    wrap.appendChild(el("div", { class: "card empty" }, el("div", { html: svg("clock", 26, "margin:0 auto 8px;opacity:.5;display:block") }), "Nenhuma vistoria concluída ainda."));
  } else {
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    recentes.forEach((v) => list.appendChild(VistoriaRow(v, false)));
    wrap.appendChild(list);
  }
  return wrap;
}
function VistoriaRow(v, isDraft) {
  const nEst = (v.estruturas || []).length;
  const row = el("div", { class: "insp-row", onclick: () => go(isDraft ? "vistoria" : "report", v.id) },
    el("div", {},
      el("div", { class: "insp-code" }, v.lojaCd || "(sem Loja/CD ainda)"),
      el("div", { class: "insp-sub" }, (v.local ? v.local + " · " : "") + nEst + " estrutura" + (nEst === 1 ? "" : "s") + (v.inspetor ? " · " + v.inspetor : "")),
      el("div", { class: "insp-date" }, fmtDateOnly(v.data) || fmtDate(v.createdAt))),
    isDraft ? el("span", { class: "badge-draft" }, "rascunho") : Tag(vistoriaStatus(v), "sm"));
  return Card({ style: "padding:0;cursor:pointer" }, row);
}

/* ---------------- Vistoria (Loja/CD + lista de Estruturas) ---------------- */
function newVistoriaSkeleton() {
  return { id: uid(), lojaCd: (state.config.locais || [])[0] || "", local: "", data: todayStr(), inspetor: "", createdAt: new Date().toISOString(), finalizada: false, estruturas: [] };
}
function newEstruturaSkeleton() {
  return { id: uid(), codigo: "", rua: "", lado: "", modulos: "", fabricante: (state.config.fabricantes || [])[0] || "", resolvido: false, itens: state.config.itens.map((it) => ({ ...it, status: "ok", obs: "", foto: null, valor: "" })) };
}
async function ensureVistoria(id) {
  if (id) {
    const existing = await idbGet("vistorias", id);
    if (existing) { state.draftVistoria = existing; return; }
  }
  if (state.draftVistoria && !state.draftVistoria.finalizada && !id) return;
  state.draftVistoria = newVistoriaSkeleton();
  await idbSet("vistorias", undefined, state.draftVistoria);
  await persistVistoriaList();
}
function saveVistoriaNow() {
  return idbSet("vistorias", undefined, state.draftVistoria).then(persistVistoriaList).then(updateSaveIndicator);
}
function saveVistoriaDebounced() {
  clearTimeout(state.saveTimer);
  showSaving();
  state.saveTimer = setTimeout(saveVistoriaNow, 400);
}
function showSaving() { const ind = document.getElementById("save-indicator"); if (ind) ind.textContent = "Salvando no aparelho…"; }
function updateSaveIndicator() { const ind = document.getElementById("save-indicator"); if (ind) ind.textContent = "✓ Salvo no aparelho"; }

function VistoriaScreen() {
  const wrap = el("div", { style: "padding-bottom:90px" });
  const inner = el("div", { class: "screen", style: "padding-top:16px" });
  wrap.appendChild(inner);

  const needsLoad = !state.draftVistoria || (state.activeVistoriaId && state.draftVistoria.id !== state.activeVistoriaId) || state.draftVistoria.finalizada;
  if (needsLoad) {
    inner.appendChild(el("div", { class: "empty" }, "Carregando…"));
    ensureVistoria(state.activeVistoriaId).then(render);
    return wrap;
  }

  const v = state.draftVistoria;
  const header = Card({ style: "margin-bottom:14px" });
  header.appendChild(el("div", { class: "field" }, el("label", {}, "Loja / CD"),
    (() => {
      const row = el("div", { class: "row" });
      row.appendChild(selectEl(state.config.locais, v.lojaCd, (val) => { v.lojaCd = val; saveVistoriaDebounced(); }));
      const addBtn = el("button", { class: "ghost-btn" }, "+ novo");
      addBtn.addEventListener("click", () => {
        const novo = prompt("Nome da nova Loja / CD:");
        if (novo && novo.trim()) {
          if (!state.config.locais.includes(novo.trim())) state.config.locais.push(novo.trim());
          idbSet("config", "main", state.config);
          v.lojaCd = novo.trim(); saveVistoriaDebounced(); render();
        }
      });
      row.appendChild(addBtn);
      return row;
    })()));
  header.appendChild(Field("Local (cidade/UF)", inputEl(v.local, (val) => { v.local = val; saveVistoriaDebounced(); }, "Ex: Osasco - SP")));
  header.appendChild(el("div", { class: "row2" },
    Field("Data", inputEl(v.data, (val) => { v.data = val; saveVistoriaDebounced(); }, "", "date")),
    Field("Inspetor(es)", inputEl(v.inspetor, (val) => { v.inspetor = val; saveVistoriaDebounced(); }, "Nome(s)"))));
  header.appendChild(el("div", { id: "save-indicator", class: "save-indicator" }, "✓ Salvo no aparelho"));
  inner.appendChild(header);

  const estHead = el("div", { style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, `Estruturas (${(v.estruturas || []).length})`));
  inner.appendChild(estHead);

  const list = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:14px" });
  (v.estruturas || []).forEach((e) => list.appendChild(EstruturaRow(e, v)));
  inner.appendChild(list);

  const addEstBtn = el("button", { class: "ghost-btn", style: "width:100%;padding:12px;display:flex;align-items:center;justify-content:center;gap:6px" },
    el("span", { html: svg("plus", 16) }), "Adicionar estrutura");
  addEstBtn.addEventListener("click", async () => {
    const nova = newEstruturaSkeleton();
    v.estruturas = v.estruturas || [];
    v.estruturas.push(nova);
    await saveVistoriaNow();
    go("estrutura", v.id, nova.id);
  });
  inner.appendChild(addEstBtn);

  const errBox = el("div", { id: "form-error" });
  inner.appendChild(errBox);

  const submitWrap = el("div", { class: "sticky-submit no-print" },
    el("button", { class: "submit-btn", onclick: () => submitVistoria(v, errBox) }, "Concluir vistoria"));
  wrap.appendChild(submitWrap);
  return wrap;
}
function EstruturaRow(e, v) {
  const st = overallStatus(e.itens);
  const row = el("div", { class: "insp-row", onclick: () => go("estrutura", v.id, e.id) },
    el("div", {},
      el("div", { class: "insp-code" }, e.codigo || "(sem código ainda)"),
      el("div", { class: "insp-sub" }, [e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, e.modulos && e.modulos + " módulos"].filter(Boolean).join(" · ") || "Toque para preencher o checklist")),
    el("div", { style: "display:flex;align-items:center;gap:8px" },
      Tag(st, "sm"),
      (() => { const b = el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("trash", 15) }); b.addEventListener("click", (ev) => { ev.stopPropagation(); if (confirm("Remover esta estrutura da vistoria?")) { v.estruturas = v.estruturas.filter((x) => x.id !== e.id); saveVistoriaNow().then(render); } }); return b; })()));
  return Card({ style: "padding:0;cursor:pointer" }, row);
}
function submitVistoria(v, errBox) {
  errBox.innerHTML = "";
  const showErr = (msg) => errBox.appendChild(el("div", { style: "margin-top:12px;background:var(--red-bg);color:var(--red-dark);padding:10px 12px;border-radius:8px;font-size:13px;font-weight:600" }, msg));
  if (!v.lojaCd || !v.lojaCd.trim()) return showErr("Informe a Loja / CD.");
  if (!v.inspetor || !v.inspetor.trim()) return showErr("Informe o(s) inspetor(es).");
  if (!v.estruturas || !v.estruturas.length) return showErr("Adicione pelo menos uma estrutura antes de concluir.");
  const semCodigo = v.estruturas.find((e) => !e.codigo || !e.codigo.trim());
  if (semCodigo) return showErr("Toda estrutura precisa de um código — falta preencher pelo menos uma.");
  v.finalizada = true;
  v.finalizadaAt = new Date().toISOString();
  idbSet("vistorias", undefined, v).then(async () => {
    await persistVistoriaList();
    const id = v.id;
    state.draftVistoria = null;
    go("report", id);
  });
}

/* ---------------- Estrutura (checklist 9.x) ---------------- */
function EstruturaScreen() {
  const wrap = el("div", { style: "padding-bottom:90px" });
  const inner = el("div", { class: "screen", style: "padding-top:16px" });
  wrap.appendChild(inner);

  const v = state.draftVistoria;
  if (!v) { inner.appendChild(el("div", { class: "empty" }, "Carregando…")); return wrap; }
  const e = (v.estruturas || []).find((x) => x.id === state.activeEstruturaId);
  if (!e) { inner.appendChild(el("div", { class: "empty" }, "Estrutura não encontrada.")); return wrap; }

  const header = Card({ style: "margin-bottom:14px" });
  header.appendChild(Field("Código da estrutura", inputEl(e.codigo, (val) => { e.codigo = val; saveVistoriaDebounced(); }, "Ex: 03/04 (PRUMO E LUX)")));
  header.appendChild(el("div", { class: "row2" },
    Field("Rua", inputEl(e.rua, (val) => { e.rua = val; saveVistoriaDebounced(); }, "Ex: 03")),
    Field("Lado", inputEl(e.lado, (val) => { e.lado = val; saveVistoriaDebounced(); }, "Ex: ímpar"))));
  header.appendChild(el("div", { class: "row2" },
    Field("Qtd. módulos", inputEl(e.modulos, (val) => { e.modulos = val; saveVistoriaDebounced(); }, "Ex: 32")),
    Field("Fabricante", selectEl(state.config.fabricantes || [], e.fabricante, (val) => { e.fabricante = val; saveVistoriaDebounced(); }))));
  header.appendChild(el("div", { id: "save-indicator", class: "save-indicator" }, "✓ Salvo no aparelho"));
  inner.appendChild(header);

  const pending = e.itens.filter((i) => i.status !== "ok").length;
  const headRow = el("div", { style: "display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px" },
    el("h3", { class: "section-title", style: "margin:0" }, `Checklist (${e.itens.length} itens)`));
  if (pending) headRow.appendChild(el("span", { style: "font-size:12px;color:var(--amber-dark);font-weight:600" }, pending + " com apontamento"));
  inner.appendChild(headRow);

  const list = el("div", {});
  e.itens.forEach((it) => list.appendChild(ChecklistItemCard(it)));
  inner.appendChild(list);

  const submitWrap = el("div", { class: "sticky-submit no-print" },
    el("button", { class: "submit-btn" }, "Voltar para a vistoria"));
  submitWrap.querySelector("button").addEventListener("click", async () => { clearTimeout(state.saveTimer); await saveVistoriaNow(); go("vistoria", v.id); });
  wrap.appendChild(submitWrap);
  return wrap;
}

function ChecklistItemCard(item) {
  const card = Card({ class: "item-card" });
  card.appendChild(el("div", { class: "item-name" }, CodeBadge(item.codigo), item.nome));
  card.appendChild(el("div", { class: "item-desc" }, item.desc));

  if (item.tipo === "medicao") {
    const row = el("div", { style: "display:flex;align-items:center;gap:8px" });
    const input = el("input", { class: "input", type: "number", inputmode: "decimal", value: item.valor || "", placeholder: `Valor em ${item.unidade}`, style: "flex:1" });
    input.addEventListener("input", (e) => {
      item.valor = e.target.value;
      item.status = item.valor === "" ? "ok" : statusFromMedicao(item.valor, item.min);
      saveVistoriaDebounced();
      const tagSlot = card.querySelector(".tag-slot");
      if (tagSlot) { tagSlot.innerHTML = ""; if (item.valor !== "") tagSlot.appendChild(Tag(item.status, "sm")); }
    });
    row.appendChild(input);
    row.appendChild(el("span", { class: "tag-slot" }, item.valor !== "" ? Tag(item.status, "sm") : null));
    card.appendChild(row);
  } else {
    const statusRow = el("div", { class: "status-row" });
    Object.entries(STATUS).forEach(([key, s]) => {
      const custom = item.niveis && item.niveis[key];
      const btn = el("button", { class: "status-btn" + (item.status === key ? " active-" + key : ""), title: custom || s.label },
        el("span", { html: svg(s.icon, 15) }), s.short);
      btn.addEventListener("click", () => {
        item.status = key;
        if (key === "ok") item.obs = "";
        saveVistoriaDebounced();
        render();
      });
      statusRow.appendChild(btn);
    });
    card.appendChild(statusRow);
  }

  if (item.niveis) {
    const hint = el("div", { class: "niveis-hint" });
    if (item.niveis.atencao) hint.appendChild(el("span", {}, "ATN: " + item.niveis.atencao));
    if (item.niveis.critico) hint.appendChild(el("span", {}, "CRIT: " + item.niveis.critico));
    card.appendChild(hint);
  }

  if (item.status !== "ok") {
    const obsBox = el("textarea", { class: "input", rows: 2, placeholder: "Observação (opcional)", style: "margin-top:10px;resize:vertical" });
    obsBox.value = item.obs || "";
    obsBox.addEventListener("input", (e) => { item.obs = e.target.value; saveVistoriaDebounced(); });
    card.appendChild(obsBox);

    const photoWrap = el("div", { style: "margin-top:8px" });
    renderPhotoArea(photoWrap, item);
    card.appendChild(photoWrap);
  }
  return card;
}
function renderPhotoArea(container, item) {
  container.innerHTML = "";
  if (item.foto) {
    const wrap = el("div", { class: "photo-wrap" },
      el("img", { class: "photo-thumb", src: item.foto }),
      el("button", { class: "photo-remove", html: svg("x", 12) }));
    wrap.querySelector(".photo-remove").addEventListener("click", () => { item.foto = null; saveVistoriaNow(); renderPhotoArea(container, item); });
    container.appendChild(wrap);
  } else {
    const btn = el("button", { class: "photo-add-btn" }, el("span", { html: svg("camera", 15) }), "Anexar foto");
    const input = el("input", { type: "file", accept: "image/*", capture: "environment", style: "display:none" });
    input.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const b64 = await resizeImage(file);
      item.foto = b64;
      saveVistoriaNow();
      renderPhotoArea(container, item);
    });
    btn.addEventListener("click", () => input.click());
    container.appendChild(btn);
    container.appendChild(input);
  }
}

/* ---------------- Histórico ---------------- */
function HistoryScreen() {
  const wrap = el("div", { class: "screen" });
  let query = "", filter = "todos";
  const searchWrap = el("div", { style: "position:relative;margin-bottom:10px" });
  searchWrap.appendChild(el("span", { html: svg("search", 16, "position:absolute;left:11px;top:11px;color:var(--ink-faint)") }));
  const searchInput = el("input", { class: "input", style: "padding-left:34px", placeholder: "Buscar por Loja/CD, local, inspetor..." });
  searchWrap.appendChild(searchInput);
  wrap.appendChild(searchWrap);

  const chipRow = el("div", { class: "chip-row" });
  const resultsBox = el("div", {});
  const filters = [["todos", "Todos"], ["ok", "Conforme"], ["atencao", "Atenção"], ["critico", "Crítico"]];
  function refresh() {
    chipRow.innerHTML = "";
    filters.forEach(([key, label]) => {
      const chip = el("button", { class: "chip" + (filter === key ? " active" : "") }, label);
      chip.addEventListener("click", () => { filter = key; refresh(); });
      chipRow.appendChild(chip);
    });
    const finalizadas = state.vistorias.filter((v) => v.finalizada);
    const filtered = finalizadas.filter((v) => {
      const st = vistoriaStatus(v);
      if (filter !== "todos" && st !== filter) return false;
      const q = query.toLowerCase();
      if (!q) return true;
      return (v.lojaCd || "").toLowerCase().includes(q) || (v.local || "").toLowerCase().includes(q) || (v.inspetor || "").toLowerCase().includes(q);
    });
    resultsBox.innerHTML = "";
    if (!filtered.length) { resultsBox.appendChild(el("div", { class: "card empty" }, "Nenhuma vistoria encontrada.")); return; }
    const list = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    filtered.forEach((v) => list.appendChild(VistoriaRow(v, false)));
    resultsBox.appendChild(list);
  }
  searchInput.addEventListener("input", (e) => { query = e.target.value; refresh(); });
  refresh();
  wrap.appendChild(chipRow);
  wrap.appendChild(resultsBox);
  return wrap;
}

/* ---------------- Relatório ---------------- */
function ReportScreen() {
  const wrap = el("div", {});
  const v = state.vistorias.find((x) => x.id === state.activeVistoriaId);
  if (!v) { wrap.appendChild(el("div", { class: "screen empty" }, "Vistoria não encontrada.")); return wrap; }
  const st = vistoriaStatus(v);

  const printable = el("div", { class: "screen printable" });
  const banner = el("div", { class: "card", style: `border:2px solid var(--${st === "ok" ? "green" : st === "atencao" ? "amber" : "red"});background:var(--${st === "ok" ? "green" : st === "atencao" ? "amber" : "red"}-bg);margin-bottom:16px` });
  banner.appendChild(el("div", { class: "mono", style: "font-size:11px;color:var(--ink-faint);text-transform:uppercase" }, state.config.empresa));
  banner.appendChild(el("div", { style: "font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;margin-top:2px" }, v.lojaCd));
  banner.appendChild(el("div", { style: "font-size:13px;color:var(--ink-soft);margin-top:2px" }, [v.local, (v.estruturas || []).length + " estrutura(s)"].filter(Boolean).join(" · ")));
  const infoRow = el("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-top:12px" },
    el("div", { style: "font-size:12.5px;color:var(--ink-soft)" }, el("div", {}, "Inspetor(es): ", el("b", {}, v.inspetor)), el("div", {}, fmtDateOnly(v.data))),
    Tag(st));
  banner.appendChild(infoRow);
  printable.appendChild(banner);

  (v.estruturas || []).forEach((e) => {
    const est = overallStatus(e.itens);
    const problemItems = e.itens.filter((i) => i.status !== "ok");
    printable.appendChild(el("h3", { class: "section-title", style: "display:flex;align-items:center;justify-content:space-between" },
      el("span", {}, CodeBadge(""), "Estrutura ", e.codigo || "—"), Tag(est, "sm")));
    const sub = [e.rua && "Rua " + e.rua, e.lado && "Lado " + e.lado, e.modulos && e.modulos + " módulos", e.fabricante].filter(Boolean).join(" · ");
    if (sub) printable.appendChild(el("div", { style: "font-size:12px;color:var(--ink-faint);margin:-4px 0 8px" }, sub));

    const itemsList = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:10px" });
    e.itens.forEach((it) => {
      const c = Card({ style: "padding:10px 12px" });
      c.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
        el("div", { style: "font-weight:600;font-size:13.5px" }, CodeBadge(it.codigo), it.nome),
        Tag(it.status, "sm", it.niveis && it.niveis[it.status])));
      if (it.valor) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, `Medição: ${it.valor} ${it.unidade}`));
      if (it.obs) c.appendChild(el("div", { style: "font-size:12.5px;color:var(--ink-soft);margin-top:5px" }, it.obs));
      if (it.foto) c.appendChild(el("img", { src: it.foto, style: "margin-top:8px;width:110px;height:110px;object-fit:cover;border-radius:6px" }));
      itemsList.appendChild(c);
    });
    printable.appendChild(itemsList);

    if (problemItems.length) {
      const agg = {};
      problemItems.forEach((i) => { agg[i.peca] = (agg[i.peca] || 0) + 1; });
      const partsCard = Card({ style: "padding:4px;margin-bottom:8px" });
      Object.entries(agg).forEach(([peca, qtd], idx, arr) => {
        partsCard.appendChild(el("div", { style: "display:flex;justify-content:space-between;padding:8px 10px" + (idx < arr.length - 1 ? ";border-bottom:1px solid var(--line)" : "") },
          el("span", { style: "font-size:13px" }, peca), el("span", { class: "mono", style: "font-size:12.5px;color:var(--ink-soft)" }, "x" + qtd)));
      });
      printable.appendChild(partsCard);
    }

    const resolveBtn = el("button", { class: "action-btn no-print", style: (e.resolvido ? "background:#fff;color:var(--ink-soft);border:1px solid var(--line)" : "background:var(--green-bg);color:var(--green-dark);border:1px solid var(--line)") + ";margin-bottom:18px" },
      el("span", { html: svg("check", 14) }), " " + (e.resolvido ? "Reabrir pendência desta estrutura" : "Marcar peças desta estrutura como resolvidas"));
    resolveBtn.addEventListener("click", async () => { e.resolvido = !e.resolvido; await idbSet("vistorias", undefined, v); await persistVistoriaList(); render(); });
    printable.appendChild(resolveBtn);
  });
  wrap.appendChild(printable);

  const actions = el("div", { class: "no-print", style: "padding:0 16px 20px;display:flex;flex-direction:column;gap:8px" });
  const row1 = el("div", { class: "row" });
  const btnPdf = el("button", { class: "action-btn", style: "background:var(--ink);color:#fff" }, el("span", { html: svg("download", 16) }), " Baixar / PDF");
  btnPdf.addEventListener("click", () => window.print());
  const btnShare = el("button", { class: "action-btn", style: "background:#fff;color:var(--ink);border:1px solid var(--line)" }, el("span", { html: svg("share", 16) }), " Compartilhar");
  btnShare.addEventListener("click", () => shareReport(v, st));
  row1.appendChild(btnPdf); row1.appendChild(btnShare);
  actions.appendChild(row1);

  const btnDelete = el("button", { class: "action-btn", style: "background:#fff;color:var(--red-dark);border:1px solid var(--red-bg)" }, el("span", { html: svg("trash", 15) }), " Excluir vistoria inteira");
  btnDelete.addEventListener("click", async () => { if (confirm("Excluir esta vistoria e todas as estruturas dela?")) { await idbDelete("vistorias", v.id); await persistVistoriaList(); go("history"); } });
  actions.appendChild(btnDelete);

  wrap.appendChild(actions);
  return wrap;
}
async function shareReport(v, st) {
  let text = `Relatório de Vistoria — ${state.config.empresa}\nLoja/CD: ${v.lojaCd}${v.local ? " · " + v.local : ""}\nInspetor(es): ${v.inspetor}\nData: ${fmtDateOnly(v.data)}\nResultado geral: ${STATUS[st].label}\n`;
  (v.estruturas || []).forEach((e) => {
    const problemItems = e.itens.filter((i) => i.status !== "ok");
    text += `\n— Estrutura ${e.codigo} [${STATUS[overallStatus(e.itens)].label}] —\n`;
    text += problemItems.length ? problemItems.map((i) => `  - ${i.codigo ? "[" + i.codigo + "] " : ""}${i.nome} [${(i.niveis && i.niveis[i.status]) || STATUS[i.status].label}]${i.obs ? ": " + i.obs : ""}`).join("\n") : "  Nenhum apontamento — conforme.";
    text += "\n";
  });
  if (navigator.share) {
    try { await navigator.share({ title: `Vistoria ${v.lojaCd}`, text }); } catch (e) { /* cancelado */ }
  } else {
    await navigator.clipboard.writeText(text);
    alert("Resumo copiado para a área de transferência.");
  }
}

/* ---------------- Peças ---------------- */
function PartsScreen() {
  const wrap = el("div", { class: "screen" });
  wrap.appendChild(el("p", { style: "font-size:13px;color:var(--ink-soft);margin-bottom:14px;line-height:1.5" }, "Peças agregadas de todas as estruturas pendentes (não resolvidas), salvas neste aparelho."));
  const agg = {};
  state.vistorias.filter((v) => v.finalizada).forEach((v) => {
    (v.estruturas || []).filter((e) => !e.resolvido && overallStatus(e.itens) !== "ok").forEach((e) => {
      e.itens.filter((i) => i.status !== "ok").forEach((i) => {
        if (!agg[i.peca]) agg[i.peca] = { qtd: 0, locais: new Set(), pior: "atencao" };
        agg[i.peca].qtd += 1;
        agg[i.peca].locais.add(`${e.codigo} (${v.lojaCd})`);
        if (i.status === "critico") agg[i.peca].pior = "critico";
      });
    });
  });
  const rows = Object.entries(agg).sort((a, b) => (b[1].pior === "critico") - (a[1].pior === "critico"));
  if (!rows.length) {
    wrap.appendChild(el("div", { class: "card empty" }, el("div", { html: svg("package", 26, "margin:0 auto 8px;opacity:.5;display:block") }), "Nenhuma peça pendente. Tudo em dia."));
    return wrap;
  }
  const list = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
  rows.forEach(([peca, info]) => {
    const ordered = !!state.orderedParts[peca];
    const card = Card({ style: "padding:12px" + (ordered ? ";opacity:.6" : "") });
    card.appendChild(el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
      el("div", {}, el("div", { style: "font-weight:700;font-size:14px" + (ordered ? ";text-decoration:line-through" : "") }, peca), el("div", { style: "font-size:11.5px;color:var(--ink-faint);margin-top:2px" }, [...info.locais].join(" · "))),
      el("div", { style: "display:flex;flex-direction:column;align-items:flex-end;gap:6px" }, el("span", { class: "mono", style: "font-size:13px;font-weight:700" }, "x" + info.qtd), Tag(info.pior, "sm"))));
    const label = el("label", { style: "display:flex;align-items:center;gap:7px;margin-top:10px;font-size:12.5px;color:var(--ink-soft)" });
    const cb = el("input", { type: "checkbox" });
    cb.checked = ordered;
    cb.addEventListener("change", async () => { state.orderedParts[peca] = cb.checked; await idbSet("parts", "main", state.orderedParts); render(); });
    label.appendChild(cb); label.appendChild(document.createTextNode("Pedido de compra realizado"));
    card.appendChild(label);
    list.appendChild(card);
  });
  wrap.appendChild(list);
  return wrap;
}

/* ---------------- Configurações ---------------- */
function ConfigScreen() {
  const wrap = el("div", { class: "screen", style: "padding-bottom:40px" });
  const local = JSON.parse(JSON.stringify(state.config));
  if (!local.locais) local.locais = [];
  if (!local.fabricantes) local.fabricantes = [];

  const empresaCard = Card({ style: "margin-bottom:14px" });
  empresaCard.appendChild(Field("Nome da empresa", inputEl(local.empresa, (v) => { local.empresa = v; })));
  wrap.appendChild(empresaCard);

  const locaisCard = Card({ style: "margin-bottom:14px" });
  locaisCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Lojas / CDs sugeridos"));
  const locaisList = el("div", {});
  function renderLocais() {
    locaisList.innerHTML = "";
    local.locais.forEach((s, idx) => {
      const row = el("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" },
        el("span", { style: "font-size:13.5px" }, s), el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("x", 15) }));
      row.lastChild.addEventListener("click", () => { local.locais.splice(idx, 1); renderLocais(); });
      locaisList.appendChild(row);
    });
  }
  renderLocais();
  locaisCard.appendChild(locaisList);
  const novoLocalRow = el("div", { class: "row", style: "margin-top:10px" });
  const novoLocalInput = el("input", { class: "input", placeholder: "Nova Loja / CD" });
  const novoLocalBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  novoLocalBtn.addEventListener("click", () => { if (novoLocalInput.value.trim()) { local.locais.push(novoLocalInput.value.trim()); novoLocalInput.value = ""; renderLocais(); } });
  novoLocalRow.appendChild(novoLocalInput); novoLocalRow.appendChild(novoLocalBtn);
  locaisCard.appendChild(novoLocalRow);
  wrap.appendChild(locaisCard);

  const fabCard = Card({ style: "margin-bottom:14px" });
  fabCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Fabricantes de porta-pallet"));
  const fabList = el("div", {});
  function renderFabs() {
    fabList.innerHTML = "";
    local.fabricantes.forEach((f, idx) => {
      const row = el("div", { style: "display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)" },
        el("span", { style: "font-size:13.5px" }, f), el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("x", 15) }));
      row.lastChild.addEventListener("click", () => { local.fabricantes.splice(idx, 1); renderFabs(); });
      fabList.appendChild(row);
    });
  }
  renderFabs();
  fabCard.appendChild(fabList);
  const novoFabRow = el("div", { class: "row", style: "margin-top:10px" });
  const novoFabInput = el("input", { class: "input", placeholder: "Novo fabricante / modelo" });
  const novoFabBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  novoFabBtn.addEventListener("click", () => { if (novoFabInput.value.trim()) { local.fabricantes.push(novoFabInput.value.trim()); novoFabInput.value = ""; renderFabs(); } });
  novoFabRow.appendChild(novoFabInput); novoFabRow.appendChild(novoFabBtn);
  fabCard.appendChild(novoFabRow);
  wrap.appendChild(fabCard);

  const itensCard = Card({ style: "margin-bottom:14px" });
  itensCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Itens do checklist"));
  const itensList = el("div", {});
  function renderItens() {
    itensList.innerHTML = "";
    local.itens.forEach((it, idx) => {
      const row = el("div", { style: "padding:8px 0;border-bottom:1px solid var(--line)" },
        el("div", { style: "display:flex;justify-content:space-between;gap:8px" },
          el("div", {}, el("div", { style: "font-size:13.5px;font-weight:600" }, CodeBadge(it.codigo), it.nome), el("div", { style: "font-size:11.5px;color:var(--ink-faint)" }, "Peça: " + it.peca)),
          el("button", { style: "background:none;border:none;color:var(--ink-faint)", html: svg("trash", 15) })));
      row.querySelector("button").addEventListener("click", () => { local.itens.splice(idx, 1); renderItens(); });
      itensList.appendChild(row);
    });
  }
  renderItens();
  itensCard.appendChild(itensList);
  const codigoInput = el("input", { class: "input", placeholder: "Código interno (ex: 9.47) — opcional" });
  const nomeInput = el("input", { class: "input", placeholder: "Nome do item (ex: Guarda-corpo)" });
  const descInput = el("input", { class: "input", placeholder: "Descrição do que verificar" });
  const pecaInput = el("input", { class: "input" });
  const addRow = el("div", { class: "row" });
  const addBtn = el("button", { class: "ghost-btn", html: svg("plus", 15) });
  addBtn.addEventListener("click", () => {
    if (nomeInput.value.trim() && pecaInput.value.trim()) {
      local.itens.push({ id: uid(), codigo: codigoInput.value.trim(), nome: nomeInput.value.trim(), desc: descInput.value.trim(), peca: pecaInput.value.trim() });
      codigoInput.value = ""; nomeInput.value = ""; descInput.value = ""; pecaInput.value = "";
      renderItens();
    }
  });
  addRow.appendChild(pecaInput); addRow.appendChild(addBtn);
  itensCard.appendChild(el("div", { style: "margin-top:10px;display:flex;flex-direction:column;gap:6px" }, codigoInput, nomeInput, descInput, addRow));
  wrap.appendChild(itensCard);

  const backupCard = Card({ style: "margin-bottom:14px" });
  backupCard.appendChild(el("div", { style: "font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px" }, "Backup / consolidação entre aparelhos"));
  backupCard.appendChild(el("p", { style: "font-size:12.5px;color:var(--ink-soft);margin:0 0 10px;line-height:1.5" }, "Como cada celular guarda os dados localmente, use estes botões para juntar o trabalho de vários técnicos em um único aparelho, ou para ter uma cópia de segurança."));
  const backupRow = el("div", { class: "row" });
  const exportBtn = el("button", { class: "ghost-btn", style: "flex:1;padding:10px" }, "Exportar backup (.json)");
  exportBtn.addEventListener("click", async () => {
    const all = { config: state.config, vistorias: await idbGetAll("vistorias"), orderedParts: state.orderedParts, exportadoEm: new Date().toISOString() };
    download(`backup-vistorias-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(all, null, 2), "application/json");
  });
  const importInput = el("input", { type: "file", accept: "application/json", style: "display:none" });
  const importBtn = el("button", { class: "ghost-btn", style: "flex:1;padding:10px" }, "Importar backup");
  importBtn.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.vistorias)) { for (const v of data.vistorias) await idbSet("vistorias", undefined, v); }
      await persistVistoriaList();
      alert(`Importado: ${(data.vistorias || []).length} vistoria(s).`);
      render();
    } catch (err) { alert("Arquivo inválido."); }
  });
  backupRow.appendChild(exportBtn); backupRow.appendChild(importBtn);
  backupCard.appendChild(backupRow);
  backupCard.appendChild(importInput);
  wrap.appendChild(backupCard);

  const saveBtn = el("button", { class: "submit-btn", style: "width:100%" }, "Salvar configurações");
  saveBtn.addEventListener("click", async () => {
    state.config = local;
    await idbSet("config", "main", local);
    saveBtn.textContent = "Salvo ✓";
    saveBtn.style.background = "var(--green)";
    setTimeout(() => { saveBtn.textContent = "Salvar configurações"; saveBtn.style.background = "var(--ink)"; }, 1600);
  });
  wrap.appendChild(saveBtn);
  return wrap;
}

/* ---------------- Start ---------------- */
boot();
