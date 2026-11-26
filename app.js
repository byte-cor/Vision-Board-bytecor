/* =========================================================
   VISION BOARD MAKER | by Bytecor
   Tudo roda no navegador. As fotos nunca saem do aparelho.
   ========================================================= */
const $ = (s) => document.querySelector(s);
const FORMATOS = [
  { id: "cel",  nome: "Celular",  w: 1080, h: 2340, ex: 1 },
  { id: "story",nome: "Stories",  w: 1080, h: 1920, ex: 1 },
  { id: "note", nome: "Notebook 4K", w: 1920, h: 1200, ex: 2 },
  { id: "quad", nome: "Quadrado", w: 1080, h: 1080, ex: 1 },
];
const FONTES = [
  ["Caveat", "Manuscrita"], ["Permanent Marker", "Marcador"], ["Playfair Display", "Elegante"],
  ["Montserrat", "Moderna"], ["Pacifico", "Cursiva"], ["Special Elite", "Máquina de escrever"],
  ["Abril Fatface", "Retrô display"], ["Bebas Neue", "Cartaz"], ["Cinzel", "Clássica"], ["Lobster", "Retrô cursiva"], ["Rye", "Faroeste"],
  ["Courier Prime", "Datilografada"], ["Shadows Into Light", "Caderno"], ["Amatic SC", "Fina desenhada"], ["Cormorant Garamond", "Serifada fina"], ["Righteous", "Anos 70"],
];
const PAPEIS = ["#F1E5C8", "#F2CF4B", "#FFC9DD", "#C9ECFF", "#FFFFFF"];

/* ---------- estado ---------- */
let fmt = FORMATOS[0];
let bg = { id: "papelvelho", cor: "#F1E4C3" };
let items = [], sel = null, hist = [], nextId = 1, mostrarMarca = true;
const cv = $("#cv"), ctx = cv.getContext("2d");
let W = fmt.w, H = fmt.h;

/* ---------- utilidades ---------- */
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200); }
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function clone(it) { return { ...it }; }
function snapshot() { hist.push(items.map(clone)); if (hist.length > 40) hist.shift(); }
function desfazer() { if (!hist.length) return toast("Nada para desfazer"); items = hist.pop(); sel = null; atualizarProps(); desenhar(); }

/* ---------- adesivos (SVG 100x100) ---------- */
function est(cx, cy, R, r, n = 5) { const p = []; for (let k = 0; k < n * 2; k++) { const a = -Math.PI / 2 + k * Math.PI / n, rr = k % 2 ? r : R; p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1)); } return p.join(" "); }
const ADESIVOS = [
  { id: "heart", nome: "Coração", cor: "#FF3D8B", vb: [100, 100], svg: c => `<path d="M50 90C6 60 12 18 36 18c8 0 14 6 14 6s6-6 14-6c24 0 30 42-14 72z" fill="${c}"/><circle cx="34" cy="34" r="5" fill="#fff" opacity=".5"/>` },
  { id: "star", nome: "Estrela", cor: "#F2D77E", vb: [100, 100], svg: c => `<polygon points="${est(50, 53, 46, 20)}" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>` },
  { id: "sparkle", nome: "Brilho", cor: "#FFFFFF", vb: [100, 100], svg: c => `<path d="M50 4Q50 50 96 50Q50 50 50 96Q50 50 4 50Q50 50 50 4Z" fill="${c}"/>` },
  { id: "moon", nome: "Lua", cor: "#FFE9A8", vb: [100, 100], svg: c => `<path d="M62 8A44 44 0 1 0 92 68A36 36 0 0 1 62 8Z" fill="${c}"/>` },
  { id: "flower", nome: "Flor", cor: "#F4AFC4", vb: [100, 100], svg: c => [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="50" cy="26" rx="13" ry="22" fill="${c}" transform="rotate(${a} 50 50)"/>`).join("") + `<circle cx="50" cy="50" r="11" fill="#FFD166"/>` },
  { id: "sun", nome: "Sol", cor: "#FFB627", vb: [100, 100], svg: c => `<circle cx="50" cy="50" r="22" fill="${c}"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="50" y1="14" x2="50" y2="24" stroke="${c}" stroke-width="6" stroke-linecap="round" transform="rotate(${a} 50 50)"/>`).join("") },
  { id: "cloud", nome: "Nuvem", cor: "#FFFFFF", vb: [100, 100], svg: c => `<path d="M24 74a18 18 0 0 1 2-36 24 24 0 0 1 46-4 20 20 0 0 1 4 40z" fill="${c}"/>` },
  { id: "plane", nome: "Avião", cor: "#FFFFFF", vb: [100, 100], svg: c => `<polygon points="8,56 94,22 66,52 72,82 52,60 36,70 38,55" fill="${c}"/>` },
  { id: "coin", nome: "Moeda", cor: "#F2D77E", vb: [100, 100], svg: c => `<circle cx="50" cy="50" r="42" fill="${c}"/><circle cx="50" cy="50" r="32" fill="none" stroke="#0A0F0D" stroke-opacity=".4" stroke-width="4"/><text x="50" y="64" font-size="42" font-weight="800" text-anchor="middle" fill="#0A0F0D" fill-opacity=".6" font-family="Montserrat,Arial">$</text>` },
  { id: "plant", nome: "Planta", cor: "#C8694A", vb: [100, 100], svg: c => [-55, -25, 0, 25, 55].map((a, k) => `<ellipse cx="50" cy="48" rx="8" ry="26" fill="${k % 2 ? '#2F9E62' : '#52B788'}" transform="rotate(${a} 50 78)"/>`).join("") + `<polygon points="32,76 68,76 62,98 38,98" fill="${c}"/>` },
  { id: "cup", nome: "Café", cor: "#FFFFFF", vb: [100, 100], svg: c => `<path d="M22 44H68V68Q68 86 45 86Q22 86 22 68Z" fill="${c}"/><path d="M68 50H78Q88 50 85 62Q82 72 68 70" fill="none" stroke="${c}" stroke-width="6"/>` + [34, 46, 58].map(x => `<path d="M${x} 36q-6-7 0-14t0-14" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>`).join("") },
  { id: "book", nome: "Livros", cor: "#9DB8A6", vb: [100, 100], svg: c => `<rect x="16" y="70" width="68" height="14" rx="3" fill="${c}"/><rect x="22" y="54" width="58" height="14" rx="3" fill="#FFD166"/><rect x="14" y="38" width="62" height="14" rx="3" fill="${c}" opacity=".75"/><rect x="24" y="22" width="52" height="14" rx="3" fill="#FF86B8"/>` },
  { id: "laptop", nome: "Notebook", cor: "#B5651D", vb: [100, 100], svg: c => `<rect x="16" y="24" width="68" height="46" rx="5" fill="#1B2430"/><polyline points="24,60 38,48 50,54 64,38 76,34" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 74H92L86 84H14Z" fill="${c}"/>` },
  { id: "house", nome: "Casa", cor: "#C8694A", vb: [100, 100], svg: c => `<rect x="22" y="48" width="56" height="42" fill="#F1E5C8"/><polygon points="12,52 50,18 88,52" fill="${c}"/><rect x="43" y="64" width="14" height="26" rx="2" fill="${c}"/>` },
  { id: "dumb", nome: "Treino", cor: "#FF8C42", vb: [100, 100], svg: c => `<rect x="28" y="46" width="44" height="8" rx="3" fill="#555"/><rect x="12" y="32" width="12" height="36" rx="3" fill="${c}"/><rect x="76" y="32" width="12" height="36" rx="3" fill="${c}"/><rect x="24" y="38" width="6" height="24" rx="2" fill="#777"/><rect x="70" y="38" width="6" height="24" rx="2" fill="#777"/>` },
  { id: "check", nome: "Meta", cor: "#6B4423", vb: [100, 100], svg: c => `<rect x="16" y="16" width="68" height="68" rx="14" fill="none" stroke="${c}" stroke-width="7"/><polyline points="32,52 46,66 70,34" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: "bow", nome: "Laço", cor: "#FF86B8", vb: [100, 100], svg: c => `<path d="M50 50L10 26V74Z M50 50L90 26V74Z" fill="${c}"/><circle cx="50" cy="50" r="10" fill="${c}" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>` },
  { id: "butter", nome: "Borboleta", cor: "#A084DC", vb: [100, 100], svg: c => `<path d="M50 50C30 10 6 24 14 48 18 60 36 62 50 50Z M50 50C70 10 94 24 86 48 82 60 64 62 50 50Z" fill="${c}"/><path d="M50 52C34 54 20 66 28 82 36 92 48 72 50 52Z M50 52C66 54 80 66 72 82 64 92 52 72 50 52Z" fill="${c}" opacity=".75"/><rect x="48" y="30" width="4" height="46" rx="2" fill="#2a1f3d"/>` },
  { id: "camera", nome: "Câmera", cor: "#FFFFFF", vb: [100, 100], svg: c => `<rect x="10" y="30" width="80" height="52" rx="10" fill="${c}"/><rect x="30" y="20" width="22" height="14" rx="4" fill="${c}"/><circle cx="50" cy="56" r="18" fill="#2a2f35"/><circle cx="50" cy="56" r="10" fill="#4DA3FF"/><circle cx="78" cy="42" r="4" fill="#FF6B6B"/>` },
  { id: "chart", nome: "Gráfico", cor: "#B5651D", vb: [100, 100], svg: c => [20, 34, 48, 64].map((h, k) => `<rect x="${12 + k * 20}" y="${84 - h}" width="14" height="${h}" rx="3" fill="${k % 2 ? '#FFD166' : c}"/>`).join("") + `<polyline points="14,50 38,38 56,42 86,14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: "tape", nome: "Fita", cor: "#ECDEB2", vb: [100, 32], svg: c => `<path d="M2 4L8 8 2 12 8 16 2 20 8 24 2 28V4Z M98 4L92 8 98 12 92 16 98 20 92 24 98 28V4Z" fill="${c}"/><rect x="5" y="3" width="90" height="26" fill="${c}" opacity=".85"/>` },
  { id: "arrow", nome: "Seta", cor: "#D9A86C", vb: [100, 100], svg: c => `<path d="M12 62C30 26 62 22 84 40" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><polyline points="68,26 86,40 70,56" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` },
];
const cacheImg = {};
function svgUrl(def, cor) { const [w, h] = def.vb; return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}">${def.svg(cor)}</svg>`); }
function imgAdesivo(it) {
  const k = it.sid + it.cor;
  if (!cacheImg[k]) { const i = new Image(); i.onload = () => { i.ok = true; desenhar(); }; i.src = svgUrl(ADESIVOS.find(a => a.id === it.sid), it.cor); cacheImg[k] = i; }
  return cacheImg[k];
}

/* ---------- fundos ---------- */
const FUNDOS = [
  { id: "salvia", nome: "Sálvia" }, { id: "folhas", nome: "Folhas" }, { id: "bytecor", nome: "Escuro" }, { id: "cortica", nome: "Cortiça" }, { id: "rosa", nome: "Rosa" },
  { id: "bege", nome: "Bege" }, { id: "azul", nome: "Azul" }, { id: "sunset", nome: "Pôr do sol" },
  { id: "lilas", nome: "Lilás" }, { id: "musgo", nome: "Musgo" }, { id: "papel", nome: "Papel" },
  { id: "grade", nome: "Quadriculado" }, { id: "vinho", nome: "Vinho" }, { id: "preto", nome: "Preto" },
  { id: "pessego", nome: "Pêssego" }, { id: "lavanda", nome: "Lavanda" }, { id: "oceano", nome: "Oceano" },
  { id: "menta", nome: "Menta" }, { id: "creme", nome: "Creme" }, { id: "ceu", nome: "Céu" },
];
const GRAD = {
  pessego: [[0, "#FFD9C0"], [.5, "#FFC4B0"], [1, "#F9E3C9"]], lavanda: [[0, "#E3DAF2"], [.5, "#CFC3E8"], [1, "#EFE8F8"]],
  oceano: [[0, "#CFE8EE"], [.5, "#A9D3DF"], [1, "#DDF0F2"]], menta: [[0, "#D6F0E2"], [1, "#EEF8F0"]],
  creme: [[0, "#FBF3DF"], [1, "#F3E6C8"]], ceu: [[0, "#D8E8F8"], [.6, "#EAF1FA"], [1, "#FBE9EE"]],
};
function lg(c, w, h, ang, stops) { const a = ang * Math.PI / 180, d = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)), cx = w / 2, cy = h / 2; const g = c.createLinearGradient(cx - Math.sin(a) * d / 2, cy + Math.cos(a) * d / 2, cx + Math.sin(a) * d / 2, cy - Math.cos(a) * d / 2); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; }
const PAL = ["#E0701F", "#1F2E5C", "#4C8B2B", "#5BA3B0", "#D4A017", "#5B1F4E", "#D9607A", "#EFE3C6", "#3A3A38", "#B3261E"];
FUNDOS.length = 0;
[["raios", "Raios"], ["poster", "Pôster"], ["papelvelho", "Papel velho"], ["mostarda", "Mostarda"], ["marinho", "Marinho"], ["terracota", "Terracota"], ["oliva", "Oliva"], ["ameixa", "Ameixa"], ["petroleo", "Petróleo"], ["creme", "Creme"], ["cortica", "Cortiça"], ["papel", "Pautado"], ["preto", "Preto"]].forEach(([id, nome]) => FUNDOS.push({ id, nome }));
Object.assign(GRAD, { papelvelho: [[0, "#F1E4C3"], [.6, "#E9D8AE"], [1, "#DCC592"]], mostarda: [[0, "#E2B230"], [1, "#C48E12"]], marinho: [[0, "#2A3C73"], [1, "#162247"]], terracota: [[0, "#D4673A"], [1, "#A9441F"]], oliva: [[0, "#7E9A45"], [1, "#566F2A"]], ameixa: [[0, "#74295F"], [1, "#451437"]], petroleo: [[0, "#6DB2BD"], [1, "#3E8794"]], creme: [[0, "#F6EBCF"], [1, "#EAD9AE"]] });
ADESIVOS.forEach((a, i) => { a.cor = PAL[i % PAL.length]; });
function desenhaFundo(c, w, h, b) {
  const id = b.id, s = Math.max(w, h) / 1000, R = rnd(7);
  if (id === "cor") { c.fillStyle = b.cor; c.fillRect(0, 0, w, h); return; }
  if (id === "raios") { const n = 40, cx = w / 2, cy = h / 2, R0 = Math.hypot(w, h); for (let k = 0; k < n; k++) { c.fillStyle = PAL[k % PAL.length]; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R0, k * 2 * Math.PI / n, (k + 1) * 2 * Math.PI / n); c.closePath(); c.fill(); } return; }
  if (id === "poster") { c.fillStyle = lg(c, w, h, 140, [[0, "#EFE4CB"], [1, "#E2D2AE"]]); c.fillRect(0, 0, w, h); const cx = w / 2, cy = h * .46, r = Math.min(w, h) * .38; c.fillStyle = "#E0701F"; c.beginPath(); for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, q = i % 2 ? .8 : 1; c.lineTo(cx + Math.cos(a) * r * q, cy + Math.sin(a) * r * q); } c.closePath(); c.fill(); c.fillStyle = "#D4A017"; c.beginPath(); c.arc(cx, cy, r * .62, 0, 7); c.fill(); c.strokeStyle = "#2B2118"; c.lineWidth = 5 * s; c.setLineDash([14 * s, 8 * s]); c.beginPath(); c.arc(cx, cy, r * 1.2, 0, 7); c.stroke(); c.setLineDash([]); c.lineWidth = 3 * s; c.beginPath(); c.arc(cx, cy, r * 1.3, 0, 7); c.stroke(); return; }
  if (GRAD[id]) { c.fillStyle = lg(c, w, h, 160, GRAD[id]); c.fillRect(0, 0, w, h); const g = rnd(3); c.fillStyle = "rgba(60,40,20,.07)"; for (let i = 0; i < w * h / 500 / (s * s); i++) c.fillRect(g() * w, g() * h, 2 * s, 2 * s); return; }
  if (id === "img") { if (b.img) cobrir(c, b.img, 0, 0, w, h); return; }
  if (id === "salvia") {
    c.fillStyle = lg(c, w, h, 150, [[0, "#C9D6AE"], [.5, "#B5C69A"], [1, "#D7DFBF"]]); c.fillRect(0, 0, w, h);
    c.lineWidth = 3 * s; for (let k = 0; k < 14; k++) { c.strokeStyle = `rgba(255,255,255,${.1 + (k % 3) * .04})`; c.beginPath(); for (let x = 0; x <= w; x += 20 * s) { const y = h * (k + .5) / 14 + Math.sin(x / (110 * s) + k * 1.3) * 26 * s; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    for (let i = 0; i < w * h / 700 / (s * s); i++) { c.fillStyle = "rgba(90,100,60,.06)"; c.fillRect(R() * w, R() * h, 2.5 * s, 2.5 * s); }
    return;
  }
  if (id === "folhas") {
    c.fillStyle = "#F4F1DF"; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) { c.fillStyle = ["rgba(181,201,156,.45)", "rgba(244,205,214,.4)", "rgba(240,227,166,.45)"][k % 3]; c.beginPath(); c.ellipse(R() * w, R() * h, (30 + R() * 50) * s, (60 + R() * 80) * s, R() * 3, 0, 7); c.fill(); }
    return;
  }
  if (id === "bytecor") {
    c.fillStyle = "#0A0F0D"; c.fillRect(0, 0, w, h);
    const g = c.createRadialGradient(w * .85, 0, 0, w * .85, 0, Math.max(w, h) * .7); g.addColorStop(0, "rgba(34,229,139,.28)"); g.addColorStop(1, "rgba(34,229,139,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  } else if (id === "cortica") {
    c.fillStyle = "#C99A5B"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 60 / (s * s) ; i++) { c.fillStyle = R() > .5 ? "rgba(90,55,20,.28)" : "rgba(255,230,180,.3)"; const r = (R() * 2.2 + .6) * s; c.beginPath(); c.arc(R() * w, R() * h, r, 0, 7); c.fill(); }
  } else if (id === "rosa") {
    const n = 14, bw = w / n; for (let k = 0; k < n; k++) { c.fillStyle = k % 2 ? "#FFB3D1" : "#FFD1E3"; c.fillRect(k * bw, 0, bw + 1, h); }
  } else if (id === "bege") { c.fillStyle = "#EFE7DC"; c.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 500 / (s * s); i++) { c.fillStyle = "rgba(120,95,60,.07)"; c.fillRect(R() * w, R() * h, 2 * s, 2 * s); } }
  else if (id === "azul") { const g = c.createRadialGradient(w / 2, h * .3, 0, w / 2, h * .3, Math.max(w, h) * .8); g.addColorStop(0, "#1D3C75"); g.addColorStop(1, "#0A1730"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  else if (id === "sunset") { c.fillStyle = lg(c, w, h, 160, [[0, "#FFB26B"], [.55, "#FF6B8B"], [1, "#7A5CFF"]]); c.fillRect(0, 0, w, h); }
  else if (id === "lilas") { c.fillStyle = "#E8DDF7"; c.fillRect(0, 0, w, h); for (let k = 0; k < 9; k++) { c.fillStyle = `rgba(160,132,220,${.08 + R() * .1})`; c.beginPath(); c.arc(R() * w, R() * h, (60 + R() * 160) * s, 0, 7); c.fill(); } }
  else if (id === "musgo") { c.fillStyle = lg(c, w, h, 160, [[0, "#2A6B49"], [1, "#0F2A1C"]]); c.fillRect(0, 0, w, h); }
  else if (id === "papel") { c.fillStyle = "#F6EFE2"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(120,150,200,.18)"; c.lineWidth = 1.5 * s; for (let y = 60 * s; y < h; y += 44 * s) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }
  else if (id === "grade") { c.fillStyle = "#0B1118"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(77,163,255,.16)"; c.lineWidth = 1.5 * s; const st = 60 * s; for (let x = 0; x < w; x += st) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += st) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }
  else if (id === "vinho") { c.fillStyle = "#6F0F1A"; c.fillRect(0, 0, w, h); const g = c.createRadialGradient(w * .3, h * .1, 0, w * .3, h * .1, Math.max(w, h)); g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(0,0,0,.3)"); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 90 / (s * s); i++) { c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(R() * w, R() * h, 2 * s, 2 * s); } }
  else { c.fillStyle = "#111"; c.fillRect(0, 0, w, h); }
}

/* ---------- itens ---------- */
function novoId() { return nextId++; }
function altura(it) { return it.w * W * it.ar; }
function medirTexto(it, c = ctx) {
  const fs = it.fs * W, linhas = (it.texto || " ").split("\n");
  c.font = `${it.font === "Montserrat" ? 800 : 700} ${fs}px "${it.font}", sans-serif`;
  const mw = Math.max(...linhas.map(l => c.measureText(l).width)), lh = fs * 1.18, pad = it.papel ? fs * .6 : 0;
  return { w: mw + pad * 2, h: linhas.length * lh + pad * 2, lh, fs, linhas, pad };
}
function caixa(it) { if (it.tipo === "texto") { const m = medirTexto(it); return { w: m.w, h: m.h }; } return { w: it.w * W, h: altura(it) }; }

function cobrir(c, img, x, y, w, h) {
  const iw = img.width, ih = img.height, k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k;
  c.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function silhueta(s) { const c = document.createElement("canvas"); c.width = s.width; c.height = s.height; const x = c.getContext("2d"); x.drawImage(s, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); return c; }
function removerFundo(src) {
  const s = reduzir(src, 1200), w = s.width, h = s.height, c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.drawImage(s, 0, 0); const d = x.getImageData(0, 0, w, h), p = d.data;
  const cs = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([a, b]) => { const i = (b * w + a) * 4; return [p[i], p[i + 1], p[i + 2], p[i + 3]]; });
  if (cs[0][3] < 10) return s;
  const m = [0, 1, 2].map(k => cs.reduce((t, v) => t + v[k], 0) / 4), tol = +$("#tolFundo").value;
  if (cs.some(v => Math.hypot(v[0] - m[0], v[1] - m[1], v[2] - m[2]) > 70)) return null;
  const vis = new Uint8Array(w * h), st = [], push = (a, b) => { if (a < 0 || b < 0 || a >= w || b >= h) return; const k = b * w + a; if (vis[k] || Math.hypot(p[k * 4] - m[0], p[k * 4 + 1] - m[1], p[k * 4 + 2] - m[2]) > tol) return; vis[k] = 1; st.push(k); };
  for (let a = 0; a < w; a++) { push(a, 0); push(a, h - 1); } for (let b = 0; b < h; b++) { push(0, b); push(w - 1, b); }
  while (st.length) { const k = st.pop(), a = k % w, b = (k / w) | 0; p[k * 4 + 3] = 0; push(a + 1, b); push(a - 1, b); push(a, b + 1); push(a, b - 1); }
  x.putImageData(d, 0, 0); return c;
}
function desenhaFotoMoldura(c, it, w, h, editor) {
  const vazio = it.tipo === "slot", f = it.moldura;
  if (vazio && !editor) return;
  if (f === "recorte" && !vazio) { if (!it.sil || it.sil.src !== it.img) { it.sil = silhueta(it.img); it.sil.src = it.img; } const r = w * .018; for (let k = 0; k < 16; k++) { c.save(); c.translate(Math.cos(k * Math.PI / 8) * r, Math.sin(k * Math.PI / 8) * r); cobrir(c, it.sil, -w / 2, -h / 2, w, h); c.restore(); } cobrir(c, it.img, -w / 2, -h / 2, w, h); return; }
  c.save();
  c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = w * .03; c.shadowOffsetY = w * .012;
  let ix = -w / 2, iy = -h / 2, iw = w, ih = h;
  if (f === "polaroid") { c.fillStyle = "#fff"; rr(c, -w / 2, -h / 2, w, h, w * .015); c.fill(); const p = w * .06; ix = -w / 2 + p; iy = -h / 2 + p; iw = w - p * 2; ih = h - p * 2 - h * .1; }
  if (f === "sticker") { const p = w * .045; c.fillStyle = "#fff"; rr(c, -w / 2, -h / 2, w, h, w * .14); c.fill(); ix = -w / 2 + p; iy = -h / 2 + p; iw = w - 2 * p; ih = h - 2 * p; }
  c.shadowColor = "transparent";
  c.save();
  if (f === "circle") { c.beginPath(); c.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); c.clip(); }
  else if (f === "rounded" || f === "sticker") { rr(c, ix, iy, iw, ih, f === "sticker" ? w * .1 : w * .06); c.clip(); }
  else { c.beginPath(); c.rect(ix, iy, iw, ih); c.clip(); }
  if (vazio) {
    c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(ix, iy, iw, ih);
    c.fillStyle = "rgba(10,15,13,.55)"; c.font = `700 ${Math.max(18, w * .11)}px Inter, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("+ foto", ix + iw / 2, iy + ih / 2);
  } else cobrir(c, it.img, ix, iy, iw, ih);
  c.restore();
  if (vazio && f !== "polaroid") { c.setLineDash([14, 10]); c.strokeStyle = "rgba(10,15,13,.6)"; c.lineWidth = 4; if (f === "circle") { c.beginPath(); c.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); c.stroke(); } else { rr(c, ix, iy, iw, ih, f === "rounded" ? w * .06 : 0); c.stroke(); } c.setLineDash([]); }
  c.restore();
}
const FAB = {
  ingresso: { nome: "Ingresso", ar: .45, t1: "CINEMA", t2: "ADMIT ONE", cor: "#B8C99D" },
  selo: { nome: "Selo", ar: 1, t1: "ORIGINAL", t2: "feito à mão", cor: "#E9A9B8" },
  preco: { nome: "Etiqueta de preço", ar: .62, t1: "SUPER OFERTA", t2: "R$ 9,90", cor: "#F2D77E" },
  fosforo: { nome: "Caixa de fósforo", ar: 1.25, t1: "SONHOS", t2: "fósforos de luxo", cor: "#E8B7A0" },
};
function desenhaFab(c, it) {
  const w = it.w * W, h = altura(it), k = it.kind, ink = "#2F3E2A";
  c.save(); c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = w * .04; c.shadowOffsetY = w * .015; c.fillStyle = it.cor;
  if (k === "selo") { c.beginPath(); for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, r = i % 2 ? .46 : .5; c.lineTo(Math.cos(a) * w * r, Math.sin(a) * h * r); } c.closePath(); c.fill(); }
  else { rr(c, -w / 2, -h / 2, w, h, w * (k === "ingresso" ? .03 : .06)); c.fill(); }
  c.shadowColor = "transparent"; c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = w * .012; c.textAlign = "center"; c.textBaseline = "middle";
  const tx = (t, x, y, s, f, mw) => { c.font = `700 ${s}px "${f}", sans-serif`; c.fillText(t, x, y, mw || w * .8); };
  if (k === "selo") { c.setLineDash([w * .02, w * .015]); c.beginPath(); c.arc(0, 0, w * .38, 0, 7); c.stroke(); c.setLineDash([]); tx(it.t1, 0, -h * .05, w * .12, "Montserrat", w * .6); tx(it.t2, 0, h * .12, w * .1, "Caveat", w * .6); }
  else if (k === "ingresso") { c.setLineDash([w * .015, w * .012]); c.beginPath(); c.moveTo(-w * .27, -h / 2); c.lineTo(-w * .27, h / 2); c.stroke(); c.setLineDash([]); tx(it.t1, w * .1, -h * .12, h * .3, "Special Elite", w * .6); tx(it.t2, w * .1, h * .24, h * .15, "Special Elite", w * .6); tx("Nº 001", -w * .385, 0, h * .12, "Special Elite", w * .2); }
  else if (k === "preco") { c.beginPath(); c.arc(0, -h * .38, w * .05, 0, 7); c.stroke(); tx(it.t1, 0, -h * .1, w * .1, "Montserrat"); tx(it.t2, 0, h * .2, w * .2, "Permanent Marker"); }
  else { c.save(); c.globalAlpha = .25; c.fillRect(-w / 2, h * .28, w, h * .22); c.restore(); tx(it.t1, 0, -h * .14, w * .17, "Playfair Display"); tx(it.t2, 0, h * .08, w * .09, "Special Elite"); }
  c.restore();
}
function desenhaItem(c, it, editor) {
  const X = it.cx * W, Y = it.cy * H;
  c.save(); c.translate(X, Y); c.rotate(it.rot * Math.PI / 180);
  if (it.tipo === "foto" || it.tipo === "slot") desenhaFotoMoldura(c, it, it.w * W, altura(it), editor);
  else if (it.tipo === "adesivo") {
    const im = imgAdesivo(it); const w = it.w * W, h = altura(it);
    if (im.ok) { c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = w * .04; c.shadowOffsetY = w * .015; c.drawImage(im, -w / 2, -h / 2, w, h); }
  } else if (it.tipo === "fab") { desenhaFab(c, it);
  } else if (it.tipo === "texto") {
    const m = medirTexto(it, c);
    if (it.papel) { c.save(); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = m.fs * .35; c.shadowOffsetY = m.fs * .12; c.fillStyle = it.papel; c.beginPath(); c.rect(-m.w / 2, -m.h / 2, m.w, m.h); c.fill(); c.restore(); }
    c.font = `${it.font === "Montserrat" ? 800 : 700} ${m.fs}px "${it.font}", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = it.cor;
    if (!it.papel) { c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = m.fs * .12; }
    m.linhas.forEach((l, k) => c.fillText(l, 0, -m.h / 2 + m.pad + m.lh * (k + .5)));
  }
  c.restore();
}
function marcaAgua(c) {
  if (!mostrarMarca) return;
  const fs = W * .026; c.save(); c.font = `700 ${fs}px Montserrat, sans-serif`; c.textAlign = "right"; c.textBaseline = "alphabetic";
  c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = fs * .3; c.fillStyle = "rgba(255,255,255,.85)"; c.fillText("feito com Bytecor · @byte.cor", W - W * .035, H - W * .03); c.restore();
}
function render(c, editor) {
  desenhaFundo(c, W, H, bg);
  items.forEach(it => desenhaItem(c, it, editor));
  marcaAgua(c);
}
function desenhar() {
  cv.width = W; cv.height = H; render(ctx, true);
  const it = sel && items.find(i => i.id === sel); if (!it) return;
  const b = caixa(it), k = W / cv.getBoundingClientRect().width;
  ctx.save(); ctx.translate(it.cx * W, it.cy * H); ctx.rotate(it.rot * Math.PI / 180);
  ctx.strokeStyle = "#6B4423"; ctx.lineWidth = 3 * k; ctx.setLineDash([10 * k, 7 * k]); ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.setLineDash([]);
  const hr = 13 * k;
  ctx.fillStyle = "#B5651D"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5 * k;
  ctx.beginPath(); ctx.arc(b.w / 2, b.h / 2, hr, 0, 7); ctx.fill(); ctx.stroke();                 // escala
  ctx.beginPath(); ctx.moveTo(0, -b.h / 2); ctx.lineTo(0, -b.h / 2 - 34 * k); ctx.strokeStyle = "#6B4423"; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -b.h / 2 - 34 * k, hr, 0, 7); ctx.fillStyle = "#E2B230"; ctx.fill(); ctx.strokeStyle = "#6B4423"; ctx.stroke(); // girar
  ctx.restore();
}
const redes = () => requestAnimationFrame(desenhar);

/* ---------- criação de itens ---------- */
function add(it, comSnap = true) { if (comSnap) snapshot(); it.id = novoId(); items.push(it); sel = it.id; atualizarProps(); desenhar(); return it; }
function off() { return (Math.random() - .5) * .08; }
function addAdesivo(sid) { const d = ADESIVOS.find(a => a.id === sid); add({ tipo: "adesivo", sid, cor: d.cor, cx: .5 + off(), cy: .5 + off(), w: sid === "tape" ? .32 : .22, ar: d.vb[1] / d.vb[0], rot: (Math.random() - .5) * 20 }); }
function addTexto(kind) {
  const base = { tipo: "texto", cx: .5, cy: .5, rot: 0, ar: 1, w: 0 };
  const K = {
    titulo: { texto: "Meu ano\n2027", font: "Caveat", fs: .1, cor: "#FFFFFF", papel: "" },
    frase: { texto: "Eu mereço\no melhor", font: "Playfair Display", fs: .05, cor: "#5A3A24", papel: "#F1E5C8", rot: -2 },
    meta: { texto: "☐ Minha meta", font: "Special Elite", fs: .04, cor: "#222222", papel: "#FFFFFF", rot: 1 },
    etiqueta: { texto: "SONHE GRANDE", font: "Montserrat", fs: .045, cor: "#FFFFFF", papel: "#141414", rot: -3 },
  }[kind];
  add({ ...base, ...K, cx: .5 + off(), cy: .5 + off() });
}
function addSlot(extra = {}) { return add({ tipo: "slot", cx: .5 + off(), cy: .5 + off(), w: .42, ar: 1.2, rot: (Math.random() - .5) * 6, moldura: "polaroid", img: null, ...extra }); }

/* ---------- fotos ---------- */
let alvoSlot = null;
function reduzir(img, max) { const k = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height)), c = document.createElement("canvas"); c.width = Math.round((img.naturalWidth || img.width) * k); c.height = Math.round((img.naturalHeight || img.height) * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); return c; }
function lerArquivo(f) { return new Promise((res, rej) => { const u = URL.createObjectURL(f), i = new Image(); i.onload = () => { const c = reduzir(i, 2000); URL.revokeObjectURL(u); res(c); }; i.onerror = rej; i.src = u; }); }
async function receberArquivos(files) {
  const lista = [...files].filter(f => f.type.startsWith("image/")); if (!lista.length) return;
  snapshot();
  for (const f of lista) {
    let c; try { c = await lerArquivo(f); } catch { toast("Não consegui abrir uma das imagens"); continue; }
    let s = alvoSlot ? items.find(i => i.id === alvoSlot) : items.find(i => i.tipo === "slot");
    alvoSlot = null;
    if (s) { s.tipo = "foto"; s.img = c; sel = s.id; }
    else { const ar = Math.min(1.7, Math.max(.6, c.height / c.width)); add({ tipo: "foto", img: c, cx: .5 + off(), cy: .5 + off(), w: .42, ar, rot: (Math.random() - .5) * 6, moldura: "polaroid" }, false); }
  }
  atualizarProps(); desenhar();
}

/* ---------- interação ---------- */
function ponto(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, k: W / r.width }; }
function local(it, p) { const a = -it.rot * Math.PI / 180, dx = p.x - it.cx * W, dy = p.y - it.cy * H; return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }; }
function acerto(p) {
  const s = sel && items.find(i => i.id === sel);
  if (s) { const b = caixa(s), l = local(s, p), hr = 22 * p.k;
    if (Math.hypot(l.x - b.w / 2, l.y - b.h / 2) < hr) return { it: s, modo: "escala" };
    if (Math.hypot(l.x, l.y + b.h / 2 + 34 * p.k) < hr) return { it: s, modo: "gira" }; }
  for (let i = items.length - 1; i >= 0; i--) { const it = items[i], b = caixa(it), l = local(it, p); if (Math.abs(l.x) <= b.w / 2 && Math.abs(l.y) <= b.h / 2) return { it, modo: "move" }; }
  return null;
}
let arrasto = null;
cv.addEventListener("pointerdown", e => {
  const p = ponto(e), h = acerto(p);
  if (!h) { sel = null; atualizarProps(); desenhar(); return; }
  cv.setPointerCapture(e.pointerId); snapshot();
  sel = h.it.id; atualizarProps();
  arrasto = { modo: h.modo, it: h.it, ox: p.x - h.it.cx * W, oy: p.y - h.it.cy * H, w0: h.it.w, fs0: h.it.fs, d0: Math.hypot(p.x - h.it.cx * W, p.y - h.it.cy * H), mov: false, t: h.it.tipo, tocou: Date.now() };
  desenhar();
});
cv.addEventListener("pointermove", e => {
  const p = ponto(e);
  if (!arrasto) { const h = acerto(p); cv.style.cursor = !h ? "default" : h.modo === "escala" ? "nwse-resize" : h.modo === "gira" ? "grab" : "move"; return; }
  const a = arrasto, it = a.it; a.mov = true;
  if (a.modo === "move") { it.cx = Math.min(1.05, Math.max(-.05, (p.x - a.ox) / W)); it.cy = Math.min(1.05, Math.max(-.05, (p.y - a.oy) / H)); }
  else if (a.modo === "escala") { const d = Math.hypot(p.x - it.cx * W, p.y - it.cy * H), f = Math.max(.1, d / Math.max(1, a.d0)); if (it.tipo === "texto") it.fs = Math.min(.3, Math.max(.01, a.fs0 * f)); else it.w = Math.min(1.2, Math.max(.04, a.w0 * f)); sincronizarSliders(); }
  else { it.rot = Math.round((Math.atan2(p.y - it.cy * H, p.x - it.cx * W) * 180 / Math.PI + 90) * 2) / 2; if (it.rot > 180) it.rot -= 360; sincronizarSliders(); }
  desenhar();
});
const soltar = e => {
  if (!arrasto) return; const a = arrasto; arrasto = null;
  if (!a.mov) { hist.pop(); if (a.it.tipo === "slot" && a.modo === "move") { alvoSlot = a.it.id; $("#arquivo").click(); } }
};
cv.addEventListener("pointerup", soltar); cv.addEventListener("pointercancel", soltar);
cv.addEventListener("dblclick", () => { const it = items.find(i => i.id === sel); if (it && it.tipo === "texto") { const t = $("#txtValor"); t.focus(); t.select(); } });
cv.addEventListener("dragover", e => e.preventDefault());
cv.addEventListener("drop", e => { e.preventDefault(); receberArquivos(e.dataTransfer.files); });
addEventListener("keydown", e => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if ((e.key === "Delete" || e.key === "Backspace") && sel) { e.preventDefault(); excluir(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); desfazer(); }
});

/* ---------- painel de propriedades ---------- */
function atual() { return items.find(i => i.id === sel); }
function atualizarProps() {
  const it = atual(), box = $("#props"); box.hidden = !it; if (!it) return;
  $("#p-texto").hidden = it.tipo !== "texto"; $("#p-foto").hidden = !(it.tipo === "foto" || it.tipo === "slot"); $("#p-adesivo").hidden = it.tipo !== "adesivo"; $("#p-fab").hidden = it.tipo !== "fab";
  if (it.tipo === "texto") { $("#txtValor").value = it.texto; $("#txtFonte").value = it.font; $("#txtCor").value = it.cor; $("#txtPapel").value = it.papel || ""; }
  if (it.tipo === "foto" || it.tipo === "slot") $("#fotoMoldura").value = it.moldura;
  if (it.tipo === "adesivo") $("#stkCor").value = it.cor;
  if (it.tipo === "fab") { $("#fabT1").value = it.t1; $("#fabT2").value = it.t2; $("#fabCor").value = it.cor; }
  sincronizarSliders();
}
function sincronizarSliders() {
  const it = atual(); if (!it) return;
  $("#rngTam").value = it.tipo === "texto" ? it.fs * 500 : it.w * 100; $("#rngRot").value = Math.round(it.rot);
}
function excluir() { if (!sel) return; snapshot(); items = items.filter(i => i.id !== sel); sel = null; atualizarProps(); desenhar(); }
function ligarProps() {
  const on = (id, ev, fn) => $(id).addEventListener(ev, fn);
  on("#rngTam", "input", e => { const it = atual(); if (!it) return; const v = +e.target.value; if (it.tipo === "texto") it.fs = v / 500; else it.w = v / 100; desenhar(); });
  on("#rngRot", "input", e => { const it = atual(); if (it) { it.rot = +e.target.value; desenhar(); } });
  ["#rngTam", "#rngRot", "#txtValor", "#txtCor", "#stkCor"].forEach(id => on(id, "pointerdown", snapshot));
  on("#txtValor", "input", e => { const it = atual(); if (it) { it.texto = e.target.value; desenhar(); } });
  on("#txtFonte", "change", async e => { const it = atual(); if (!it) return; snapshot(); it.font = e.target.value; try { await document.fonts.load(`700 40px "${it.font}"`); } catch {} desenhar(); });
  on("#txtCor", "input", e => { const it = atual(); if (it) { it.cor = e.target.value; desenhar(); } });
  on("#txtPapel", "change", e => { const it = atual(); if (it) { snapshot(); it.papel = e.target.value; desenhar(); } });
  on("#stkCor", "input", e => { const it = atual(); if (it) { it.cor = e.target.value; desenhar(); } });
  on("#fotoMoldura", "change", e => { const it = atual(); if (!it) return; snapshot(); it.moldura = e.target.value; if (it.moldura === "circle") it.ar = 1; desenhar(); });
  on("#btnTrocar", "click", () => { alvoSlot = sel; $("#arquivo").click(); });
  on("#bFrente", "click", () => { const i = items.findIndex(x => x.id === sel); if (i > -1) { snapshot(); items.push(items.splice(i, 1)[0]); desenhar(); } });
  on("#bTras", "click", () => { const i = items.findIndex(x => x.id === sel); if (i > -1) { snapshot(); items.unshift(items.splice(i, 1)[0]); desenhar(); } });
  on("#bDup", "click", () => { const it = atual(); if (!it) return; snapshot(); const c = { ...it, id: novoId(), cx: it.cx + .04, cy: it.cy + .03 }; items.push(c); sel = c.id; atualizarProps(); desenhar(); });
  ["#fabT1", "#fabT2", "#fabCor"].forEach(id => on(id, "pointerdown", snapshot));
  on("#fabT1", "input", e => { const it = atual(); if (it) { it.t1 = e.target.value; desenhar(); } });
  on("#fabT2", "input", e => { const it = atual(); if (it) { it.t2 = e.target.value; desenhar(); } });
  on("#fabCor", "input", e => { const it = atual(); if (it) { it.cor = e.target.value; desenhar(); } });
  on("#btnRemover", "click", () => { const it = atual(); if (!it || it.tipo !== "foto") return toast("Escolha uma foto primeiro"); it.orig = it.orig || it.img; const r = removerFundo(it.orig); if (!r) return toast("O fundo da foto precisa ser de uma cor só (parede, papel, céu)"); snapshot(); it.img = r; it.alpha = true; it.moldura = "recorte"; atualizarProps(); desenhar(); toast("Fundo removido! Ajuste a sensibilidade e toque de novo se faltou"); });
  on("#bDel", "click", excluir);
}

/* ---------- modelos ---------- */
function grade(cols, rows, m, top, bot, gap) { const aw = W - 2 * m, ah = H - top - bot, cw = (aw - gap * (cols - 1)) / cols, ch = (ah - gap * (rows - 1)) / rows, out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: m + c * (cw + gap) + cw / 2, y: top + r * (ch + gap) + ch / 2, w: cw, h: ch }); return out; }
const S = (c, o = {}) => ({ tipo: "slot", cx: c.x / W, cy: c.y / H, w: c.w / W, ar: c.h / c.w, rot: 0, moldura: "rounded", img: null, ...o });
const T = (x, y, o) => ({ tipo: "texto", cx: x, cy: y, rot: 0, ar: 1, w: 0, texto: "", font: "Caveat", fs: .06, cor: "#fff", papel: "", ...o });
const A = (sid, x, y, w, rot = 0, cor) => { const d = ADESIVOS.find(a => a.id === sid); return { tipo: "adesivo", sid, cor: cor || d.cor, cx: x, cy: y, w, ar: d.vb[1] / d.vb[0], rot }; };
const MODELOS = [
  { nome: "Jardim de sálvia", fundo: "salvia", build() {
    const land = W > H, it = [], r = rnd(5);
    const cells = land ? grade(3, 2, W * .07, H * .2, H * .07, W * .03) : grade(2, 3, W * .07, H * .2, H * .08, W * .05);
    cells.forEach((c, k) => it.push(S({ x: c.x, y: c.y, w: c.w * .92, h: c.h * .92 }, { moldura: k % 2 ? "polaroid" : "rounded", rot: (r() - .5) * 8 })));
    it.push(T(.5, land ? .1 : .09, { texto: "meu jardim de sonhos", fs: land ? .05 : .062, cor: "#34482F", font: "Pacifico" }));
    it.push(A("butter", .09, land ? .1 : .035, .09, -12), A("flower", .91, land ? .12 : .035, .09, 12), A("star", .88, .93, .07, 10), A("sparkle", .1, .93, .06, 0, "#fff"));
    return it; } },
  { nome: "Mural de polaroids", fundo: "cortica", build() {
    const land = W > H, r = rnd(3), it = [];
    const cells = land ? grade(3, 2, W * .07, H * .2, H * .08, W * .03) : grade(2, 3, W * .08, H * .2, H * .1, W * .05);
    cells.forEach(c => { const w = c.w * .92, h = Math.min(c.h * .94, w * 1.18); it.push(S({ x: c.x, y: c.y, w, h }, { moldura: "polaroid", rot: (r() - .5) * 8 })); });
    it.push(T(.5, land ? .1 : .09, { texto: "meu ano 2027", fs: land ? .05 : .09, cor: "#fff", font: "Caveat" }));
    it.push(A("star", .12, .06, .06, -10), A("heart", .9, .94, .07, 8), A("tape", .5, land ? .19 : .165, .2, 3));
    return it; } },
  { nome: "Grade moderna", fundo: "salvia", build() {
    const land = W > H, cells = land ? grade(3, 2, W * .06, H * .22, H * .08, W * .02) : grade(2, 3, W * .06, H * .2, H * .09, W * .03), it = [];
    cells.forEach(c => it.push(S(c, { moldura: "rounded" })));
    it.push(T(.5, land ? .1 : .09, { texto: "2027 · minhas metas", fs: land ? .05 : .075, cor: "#34482F", font: "Montserrat" }));
    it.push(T(land ? .27 : .5, .96, { texto: "foco · disciplina · consistência", fs: land ? .022 : .035, cor: "#4F6B4A", font: "Montserrat" }));
    return it; } },
  { nome: "Foco central", fundo: "rosa", build() {
    const land = W > H, it = [], big = Math.min(W, H) * (land ? .62 : .62);
    it.push(S({ x: W / 2, y: H * .5, w: big, h: big }, { moldura: "circle" }));
    const pos = land ? [[.14, .3], [.86, .3], [.14, .72], [.86, .72]] : [[.2, .22], [.8, .22], [.2, .79], [.8, .79]];
    pos.forEach(([x, y], k) => it.push(S({ x: x * W, y: y * H, w: W * (land ? .17 : .3), h: W * (land ? .17 : .3) * 1.15 }, { moldura: "polaroid", rot: k % 2 ? 5 : -5 })));
    it.push(T(.5, land ? .1 : .08, { texto: "eu mereço o melhor", fs: land ? .05 : .075, cor: "#B0145A", font: "Pacifico" }));
    it.push(A("heart", .5, land ? .92 : .92, .08, 0), A("sparkle", .08, .5, .07, 0, "#fff"), A("sparkle", .92, .5, .07, 0, "#fff"));
    return it; } },
  { nome: "Metas do ano", fundo: "bege", build() {
    const land = W > H, it = [];
    it.push(T(.5, land ? .1 : .08, { texto: "METAS 2027", fs: land ? .06 : .1, cor: "#4A3F35", font: "Playfair Display" }));
    const m = ["☐ Lançar meu projeto", "☐ Cuidar da saúde", "☐ Juntar reserva", "☐ Viajar mais", "☐ Aprender algo novo", "☐ Mais tempo de descanso"];
    m.forEach((t, k) => it.push(T(land ? .19 + (k % 3) * .31 : .5, land ? .26 + Math.floor(k / 3) * .1 : .2 + k * .075, { texto: t, fs: land ? .02 : .042, cor: "#222", font: "Special Elite", papel: "#FFFFFF", rot: (k % 2 ? 1.5 : -1.5) })));
    const cs = land ? grade(3, 1, W * .08, H * .55, H * .08, W * .03) : grade(3, 1, W * .06, H * .68, H * .12, W * .03);
    cs.forEach(c => it.push(S(c, { moldura: "polaroid", rot: (Math.random() - .5) * 6 })));
    it.push(A("star", .9, .1, .07, 10), A("check", .1, .1, .06, -8, "#4A3F35"));
    return it; } },
  { nome: "Scrapbook", fundo: "papel", build() {
    const land = W > H, r = rnd(11), it = [];
    const cells = land ? grade(3, 2, W * .08, H * .12, H * .1, W * .04) : grade(2, 3, W * .08, H * .15, H * .14, W * .06);
    cells.forEach((c, k) => it.push(S({ x: c.x + (r() - .5) * 30, y: c.y + (r() - .5) * 30, w: c.w * .9, h: c.h * .88 }, { moldura: k % 3 === 0 ? "none" : "polaroid", rot: (r() - .5) * 10 })));
    it.push(A("tape", .25, land ? .13 : .12, .2, -25), A("tape", .75, land ? .55 : .5, .2, 20));
    it.push(T(land ? .27 : .5, .93, { texto: "um passo de cada vez", fs: land ? .03 : .055, cor: "#5A3A24", font: "Caveat", papel: "#F1E5C8", rot: -2 }));
    it.push(A("flower", .88, .1, .09, 15), A("butter", .1, .9, .09, -15));
    return it; } },
  { nome: "Viagens", fundo: "sunset", build() {
    const land = W > H, it = [];
    it.push(S({ x: W * (land ? .36 : .5), y: H * (land ? .52 : .38), w: W * (land ? .36 : .78), h: H * (land ? .6 : .32) }, { moldura: "polaroid", rot: -2 }));
    if (land) { it.push(S({ x: W * .72, y: H * .32, w: W * .2, h: W * .24 }, { moldura: "polaroid", rot: 4 }), S({ x: W * .8, y: H * .7, w: W * .2, h: W * .24 }, { moldura: "polaroid", rot: -4 })); }
    else it.push(S({ x: W * .3, y: H * .76, w: W * .4, h: W * .48 }, { moldura: "polaroid", rot: 4 }), S({ x: W * .72, y: H * .8, w: W * .4, h: W * .48 }, { moldura: "polaroid", rot: -4 }));
    it.push(T(.5, land ? .1 : .08, { texto: "o mundo me espera", fs: land ? .055 : .09, cor: "#fff", font: "Pacifico" }));
    it.push(A("plane", land ? .9 : .86, land ? .1 : .16, .12, -10, "#fff"), A("cloud", .1, land ? .86 : .62, .16, 0, "#fff"), A("sun", .1, .1, .1, 0));
    return it; } },
];
const modeloNovo = (nome, fundo, titulo, cor, font) => ({ nome, fundo, build() {
  const land = W > H, it = [], r = rnd(11), cells = land ? grade(3, 2, W * .07, H * .2, H * .07, W * .03) : grade(2, 3, W * .07, H * .2, H * .08, W * .05);
  cells.forEach((c, k) => it.push(S({ x: c.x, y: c.y, w: c.w * .92, h: c.h * .92 }, { moldura: k % 2 ? "polaroid" : "rounded", rot: (r() - .5) * 8 })));
  it.push(T(.5, land ? .1 : .09, { texto: titulo, fs: land ? .05 : .062, cor, font })); return it;
} });
MODELOS.push(modeloNovo("Pôr do sol", "pessego", "meu ano em luz", "#7A3E2B", "Pacifico"), modeloNovo("Lavanda", "lavanda", "o que eu quero", "#4B3B6B", "Playfair Display"), modeloNovo("Oceano", "oceano", "mar de metas", "#16405B", "Caveat"));
const FV = ["papelvelho", "raios", "poster", "mostarda", "marinho", "terracota", "oliva", "ameixa", "petroleo", "creme"], ESC = ["marinho", "terracota", "oliva", "ameixa", "petroleo"], FT = ["Abril Fatface", "Rye", "Lobster", "Bebas Neue", "Cinzel", "Righteous", "Amatic SC", "Courier Prime"];
["Raios retrô", "Pôster zen", "Mostarda e marinho"].forEach((n, i) => { MODELOS[7 + i].nome = n; });
MODELOS.forEach((m, i) => { m.fundo = FV[i % FV.length]; const b0 = m.build; m.build = () => b0().map(x => x.tipo === "texto" ? { ...x, font: FT[i % FT.length], cor: ESC.includes(m.fundo) ? "#F6E9CC" : "#2B1D12", papel: m.fundo === "raios" ? "#F1E4C3" : "" } : x); });
function aplicarModelo(m) {
  if (items.length && !confirm("Aplicar o modelo vai substituir o que você já montou. Continuar?")) return;
  snapshot(); bg = { id: m.fundo, cor: bg.cor }; items = m.build().map(i => ({ ...i, id: novoId() })); sel = null; atualizarProps(); marcarFundo(); desenhar(); toast("Modelo aplicado! Toque em “+ foto” para colocar suas imagens");
}

/* ---------- interface ---------- */
function montarFormatos() {
  const box = $("#formatos"); box.innerHTML = "";
  FORMATOS.forEach(f => { const b = document.createElement("button"); b.textContent = f.nome; b.className = f.id === fmt.id ? "ativo" : ""; b.onclick = () => {
      if (f.id === fmt.id) return;
      const k = Math.min(f.w, f.h) / Math.min(W, H), oW = W;   // mantém o tamanho real dos itens ao trocar de formato
      items.forEach(it => { if (it.tipo === "texto") it.fs = it.fs * oW * k / f.w; else it.w = it.w * oW * k / f.w; });
      fmt = f; W = f.w; H = f.h; montarFormatos(); atualizarProps(); desenhar(); montarModelos();
      if (items.length) toast("Formato trocado. Para o melhor resultado, escolha o formato antes de aplicar um modelo.");
    }; box.appendChild(b); });
}
function marcarFundo() { document.querySelectorAll("#listaFundos button").forEach(b => b.classList.toggle("ativo", b.dataset.id === bg.id)); }
function montarFundos() {
  const box = $("#listaFundos"); box.innerHTML = "";
  FUNDOS.forEach(f => { const b = document.createElement("button"); b.dataset.id = f.id; b.title = f.nome; const c = document.createElement("canvas"); c.width = 120; c.height = 160; desenhaFundo(c.getContext("2d"), 120, 160, { id: f.id, cor: bg.cor }); b.appendChild(c); b.onclick = () => { snapshot(); bg = { id: f.id, cor: bg.cor }; marcarFundo(); desenhar(); }; box.appendChild(b); });
  $("#corFundo").oninput = e => { bg = { id: "cor", cor: e.target.value }; marcarFundo(); desenhar(); };
  $("#btnFundoImg").onclick = () => $("#arqFundo").click();
  $("#arqFundo").onchange = async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { const c = await lerArquivo(f); bg = { id: "img", img: c, cor: bg.cor }; marcarFundo(); desenhar(); } catch { toast("Não consegui abrir essa imagem"); } };
  marcarFundo();
}
function montarFab() {
  const box = $("#listaFab"); box.innerHTML = "";
  Object.entries(FAB).forEach(([k, d]) => { const b = document.createElement("button"); b.className = "botao contorno"; b.textContent = d.nome; b.onclick = () => add({ tipo: "fab", kind: k, t1: d.t1, t2: d.t2, cor: d.cor, cx: .5 + off(), cy: .5 + off(), w: k === "ingresso" ? .5 : .34, ar: d.ar, rot: (Math.random() - .5) * 14 }); box.appendChild(b); });
  $("#btnAdesivoFoto").onclick = () => { const s = addSlot({ moldura: "sticker" }); alvoSlot = s.id; $("#arquivo").click(); };
}
function montarAdesivos() {
  const box = $("#listaAdesivos"); box.innerHTML = "";
  ADESIVOS.forEach(a => { const b = document.createElement("button"); b.title = a.nome; const i = new Image(); i.src = svgUrl(a, a.cor); i.alt = a.nome; b.appendChild(i); b.onclick = () => addAdesivo(a.id); box.appendChild(b); });
}
function montarModelos() {
  const box = $("#listaModelos"); box.innerHTML = ""; const salvoW = W, salvoH = H, salvoBg = bg, salvoIt = items;
  MODELOS.forEach(m => {
    const b = document.createElement("button"), c = document.createElement("canvas"); c.width = 200; c.height = Math.round(200 * H / W);
    W = fmt.w; H = fmt.h; bg = { id: m.fundo, cor: "#fff" }; items = m.build().map(i => ({ ...i, id: 0 }));
    const k = 200 / W, x = c.getContext("2d"); x.save(); x.scale(k, k); desenhaFundo(x, W, H, bg);
    items.forEach(i => { if (i.tipo === "slot") { x.save(); x.translate(i.cx * W, i.cy * H); x.rotate(i.rot * Math.PI / 180); const w = i.w * W, h = w * i.ar; x.fillStyle = i.moldura === "polaroid" ? "#fff" : "rgba(255,255,255,.7)"; x.beginPath(); if (i.moldura === "circle") x.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); else x.roundRect(-w / 2, -h / 2, w, h, w * .05); x.fill(); if (i.moldura === "polaroid") { x.fillStyle = "rgba(0,0,0,.12)"; x.fillRect(-w / 2 + w * .06, -h / 2 + w * .06, w * .88, h - w * .06 * 2 - h * .1); } x.restore(); } else if (i.tipo === "texto") { x.save(); x.translate(i.cx * W, i.cy * H); x.rotate(i.rot * Math.PI / 180); const m2 = medirTexto(i, x); if (i.papel) { x.fillStyle = i.papel; x.fillRect(-m2.w / 2, -m2.h / 2, m2.w, m2.h); } x.fillStyle = i.cor; x.textAlign = "center"; x.textBaseline = "middle"; m2.linhas.forEach((l, n) => x.fillText(l, 0, -m2.h / 2 + m2.pad + m2.lh * (n + .5))); x.restore(); } });
    x.restore(); b.appendChild(c); b.append(m.nome); b.onclick = () => aplicarModelo(m); box.appendChild(b);
  });
  W = salvoW; H = salvoH; bg = salvoBg; items = salvoIt;
}
function ligarAbas() {
  $("#abas").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#abas button").forEach(x => x.classList.toggle("ativa", x === b)); ["modelos", "fundo", "fotos", "adesivos", "texto"].forEach(n => $("#aba-" + n).hidden = n !== b.dataset.aba); });
  document.querySelectorAll("[data-txt]").forEach(b => b.onclick = () => addTexto(b.dataset.txt));
  $("#btnAddFotos").onclick = () => { alvoSlot = null; $("#arquivo").click(); };
  $("#btnAddSlot").onclick = () => addSlot();
  $("#arquivo").onchange = e => { receberArquivos(e.target.files); e.target.value = ""; };
  $("#txtFonte").innerHTML = FONTES.map(f => `<option value="${f[0]}">${f[1]}</option>`).join("");
  $("#chkMarca").onchange = e => { mostrarMarca = e.target.checked; desenhar(); };
  $("#btnDesfazer").onclick = desfazer;
  $("#btnLimpar").onclick = () => { if (!items.length || confirm("Apagar tudo e começar de novo?")) { snapshot(); items = []; sel = null; atualizarProps(); desenhar(); } };
  $("#btnBaixar").onclick = baixar; $("#btnSalvar").onclick = salvar;
}

/* ---------- exportar ---------- */
async function baixar() {
  sel && (sel = null, atualizarProps());
  const okFontes = document.fonts ? document.fonts.ready : Promise.resolve(); await okFontes;
  items.filter(i => i.tipo === "adesivo").forEach(imgAdesivo);
  await new Promise(r => setTimeout(r, 250));
  const c = document.createElement("canvas"); c.width = W * fmt.ex; c.height = H * fmt.ex;
  const x = c.getContext("2d"); x.scale(fmt.ex, fmt.ex); render(x, false);
  c.toBlob(async blob => {
    const nome = `vision-board-bytecor-${fmt.id}.png`, file = new File([blob], nome, { type: "image/png" });
    const touch = matchMedia("(pointer:coarse)").matches;
    if (touch && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Meu vision board" }); return; } catch {} }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(`Imagem salva (${c.width}×${c.height})`);
  }, "image/png");
  desenhar();
}

/* ---------- salvar / carregar ---------- */
function serializa() {
  guardaPag();
  const sb = b => b.img ? { id: "img", cor: b.cor, img: reduzir(b.img, 900).toDataURL("image/jpeg", .7) } : b;
  const si = l => l.map(i => { const o = { ...i }; delete o.sil; delete o.orig; if (i.img) o.img = reduzir(i.img, 700).toDataURL(i.alpha ? "image/png" : "image/jpeg", .78); return o; });
  return JSON.stringify({ fmt: fmt.id, marca: mostrarMarca, nextId, pag, pgs: paginas.map(p => ({ bg: sb(p.bg), items: si(p.items) })) });
}
function salvar(silencioso) {
  try { localStorage.setItem("bytecor_vb", serializa()); if (silencioso !== true) { toast("Projeto salvo neste navegador"); $("#msgSalvo").textContent = "Salvo às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } }
  catch { toast("Não coube salvar (muitas fotos). Baixe a imagem para não perder."); }
}
const lerBg = b => { b = b || { id: "papelvelho", cor: "#F1E4C3" }; if (typeof b.img === "string") { const o = { id: "img", cor: b.cor, img: document.createElement("canvas") }, im = new Image(); im.onload = () => { o.img = reduzir(im, 2000); desenhar(); }; im.src = b.img; return o; } return b; };
const lerItems = l => (l || []).map(o => { const it = { ...o }; if (typeof o.img === "string") { const i = new Image(); i.onload = () => { it.img = reduzir(i, 2000); desenhar(); }; i.src = o.img; it.img = document.createElement("canvas"); } return it; });
function carregar() {
  let d; try { d = JSON.parse(localStorage.getItem("bytecor_vb")); } catch { d = null; } if (!d) return;
  fmt = FORMATOS.find(f => f.id === d.fmt) || fmt; W = fmt.w; H = fmt.h; mostrarMarca = d.marca !== false; nextId = d.nextId || 1; $("#chkMarca").checked = mostrarMarca;
  paginas = (d.pgs || [{ bg: d.bg, items: d.items }]).map(p => ({ bg: lerBg(p.bg), items: lerItems(p.items) })); pag = Math.min(d.pag || 0, paginas.length - 1); ({ items, bg } = paginas[pag]);
}
let paginas = [{ items: [], bg }], pag = 0;
function guardaPag() { paginas[pag] = { items, bg }; }
function abrirPag(n) { pag = n; ({ items, bg } = paginas[n]); sel = null; hist = []; atualizarProps(); marcarFundo(); desenhar(); montarPags(); }
function montarPags() {
  const box = $("#pags"); box.innerHTML = "";
  const mk = (t, fn, cls = "") => { const b = document.createElement("button"); b.className = "mini " + cls; b.textContent = t; b.onclick = fn; box.appendChild(b); };
  paginas.forEach((_, i) => mk("Página " + (i + 1), () => { guardaPag(); abrirPag(i); }, i === pag ? "ativo" : ""));
  mk("+ Página", () => { guardaPag(); paginas.push({ items: [], bg: { id: bg.id === "img" ? "papelvelho" : bg.id, cor: bg.cor } }); abrirPag(paginas.length - 1); });
  if (paginas.length > 1) mk("Excluir página", () => { if (!confirm("Excluir esta página?")) return; paginas.splice(pag, 1); abrirPag(Math.min(pag, paginas.length - 1)); }, "perigo");
}

/* ---------- início ---------- */
carregar(); montarFormatos(); montarFundos(); montarAdesivos(); montarFab(); montarPags(); ligarAbas(); ligarProps(); montarModelos();
document.fonts && document.fonts.ready.then(desenhar);
addEventListener("resize", desenhar);
addEventListener("beforeunload", () => { if (items.length) salvar(true); });
desenhar();
