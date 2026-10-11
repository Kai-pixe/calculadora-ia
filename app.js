'use strict';
const $ = s => document.querySelector(s);
let expr = '';

/* ---------- Evaluador seguro (sin eval) ---------- */
function calc(s) {
  const t = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').match(/\d*\.?\d+|[-+*/()%]/g) || [];
  let i = 0;
  const peek = () => t[i], next = () => t[i++];
  const post = v => { while (peek() === '%') { next(); v /= 100; } return v; };
  function prim() {
    const x = next();
    if (x === '(') { const v = sum(); if (next() !== ')') throw 0; return post(v); }
    if (x === '-') return -prim();
    if (x === '+') return prim();
    if (x === undefined || isNaN(+x)) throw 0;
    return post(+x);
  }
  function prod() { let v = prim(); while (peek() === '*' || peek() === '/') { const o = next(), r = prim(); v = o === '*' ? v * r : v / r; } return v; }
  function sum() { let v = prod(); while (peek() === '+' || peek() === '-') { const o = next(), r = prod(); v = o === '+' ? v + r : v - r; } return v; }
  const v = sum();
  if (i < t.length || !isFinite(v)) throw 0;
  return v;
}
const fmt = v => String(+v.toPrecision(12));

/* ---------- Teclado en pantalla ---------- */
const KEYS = ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '(', ')', '0', '.', '='];
const keys = $('#keys');
KEYS.forEach(k => {
  const b = document.createElement('button');
  b.textContent = k;
  if ('÷×−+%C⌫'.includes(k)) b.className = 'op';
  if (k === '=') b.className = 'eq';
  b.onclick = () => press(k);
  keys.append(b);
});
function press(k) {
  if (k === 'C') expr = '';
  else if (k === '⌫') expr = expr.slice(0, -1);
  else if (k === '=') { try { expr = fmt(calc(expr)); } catch (_) { $('#out').textContent = 'Error'; return; } }
  else expr += k;
  show();
}
function show() {
  $('#expr').textContent = expr;
  let o = '0';
  try { if (expr) o = fmt(calc(expr)); } catch (_) { o = expr ? '…' : '0'; }
  $('#out').textContent = o;
}
addEventListener('keydown', e => {
  if (e.target.id === 'q') return;
  const m = { '*': '×', '/': '÷', '-': '−' }, k = e.key;
  if (/^[0-9.+()%]$/.test(k)) press(k);
  else if (m[k]) press(m[k]);
  else if (k === 'Enter' || k === '=') { e.preventDefault(); press('='); }
  else if (k === 'Backspace') press('⌫');
  else if (k === 'Escape') press('C');
});

/* ---------- IA (la key NUNCA está aquí: se usa /api/ask) ---------- */
$('#aiForm').onsubmit = async e => {
  e.preventDefault();
  const q = $('#q').value.trim(), ans = $('#ans'), exp = $('#exp'), use = $('#use'), btn = e.target.querySelector('.go');
  if (!q) return;
  ans.hidden = false; use.hidden = true;
  if (!navigator.onLine) { exp.textContent = 'La IA necesita conexión a internet. La calculadora sigue funcionando sin conexión.'; return; }
  exp.textContent = 'Pensando…'; btn.disabled = true;
  try {
    const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Error');
    exp.textContent = d.explanation || 'Sin respuesta.';
    const n = parseFloat(String(d.result).replace(/,/g, ''));
    if (isFinite(n)) { use.textContent = 'Usar ' + fmt(n); use.hidden = false; use.onclick = () => { expr = fmt(n); show(); }; }
  } catch (err) { exp.textContent = err.message || 'No se pudo consultar la IA.'; }
  btn.disabled = false;
};

/* ---------- Instalación: Android/PC (botón) e iOS (banner) ---------- */
let deferred;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#install').hidden = false; });
$('#install').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#install').hidden = true; };
addEventListener('appinstalled', () => { $('#install').hidden = true; });
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
try { if (isIOS && !standalone && !localStorage.getItem('iosHint')) $('#ios').hidden = false; } catch (_) {}
$('#iosClose').onclick = () => { $('#ios').hidden = true; try { localStorage.setItem('iosHint', '1'); } catch (_) {} };

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
