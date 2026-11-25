// 화면 위 UI: 안내 문구, 조사 창, 자물쇠, 번호판, 수첩
import { sfx } from './audio.js';

const $ = (id) => document.getElementById(id);

export const ui = {
  open: false,
  onClose: null,

  prompt(text) {
    const el = $('prompt');
    if (!text) { el.classList.remove('show'); return; }
    el.textContent = text;
    el.classList.add('show');
  },

  crosshair(active) {
    $('crosshair').classList.toggle('active', !!active);
  },

  toast(text, ms = 3800) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => el.classList.remove('show'), ms);
  },

  inventory(items) {
    const names = { darkroomKey: '암실 열쇠', screwdriver: '일자 드라이버' };
    $('inventory').innerHTML = items.map((i) => `<div class="slot"><span class="ico ico-${i}"></span>${names[i]}</div>`).join('');
  },

  // 조사 창. content: HTMLElement 또는 HTML 문자열
  panel({ title = '', content = '', text = '', buttons = [], wide = false, onClose = null }) {
    const p = $('panel');
    const body = $('panel-body');
    $('panel-title').textContent = title;
    body.innerHTML = '';
    if (typeof content === 'string') body.innerHTML = content;
    else if (content) body.appendChild(content);
    $('panel-text').innerHTML = text;
    const bar = $('panel-buttons');
    bar.innerHTML = '';
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.onclick = (e) => { e.stopPropagation(); b.onClick(); };
      bar.appendChild(btn);
    });
    p.classList.toggle('wide', wide);
    $('overlay').classList.add('show');
    this.open = true;
    this.onClose = onClose;
  },

  setText(html) { $('panel-text').innerHTML = html; },

  close() {
    if (!this.open) return;
    $('overlay').classList.remove('show');
    this.open = false;
    const cb = this.onClose;
    this.onClose = null;
    cb && cb();
  },

  canvasEl(c, maxW = 520) {
    const img = document.createElement('img');
    img.src = c.toDataURL();
    img.style.maxWidth = maxW + 'px';
    img.className = 'closeup';
    return img;
  },

  // 다이얼 자물쇠 (숫자 n칸)
  dialLock(n, onSubmit) {
    const wrap = document.createElement('div');
    wrap.className = 'dials';
    const vals = new Array(n).fill(0);
    const cols = [];
    for (let i = 0; i < n; i++) {
      const col = document.createElement('div');
      col.className = 'dial';
      const up = document.createElement('button'); up.textContent = '▲';
      const v = document.createElement('div'); v.className = 'dial-val'; v.textContent = '0';
      const dn = document.createElement('button'); dn.textContent = '▼';
      const set = (d) => { vals[i] = (vals[i] + d + 10) % 10; v.textContent = vals[i]; sfx.dial(); };
      up.onclick = (e) => { e.stopPropagation(); set(1); };
      dn.onclick = (e) => { e.stopPropagation(); set(-1); };
      v.onwheel = (e) => { e.preventDefault(); set(e.deltaY < 0 ? 1 : -1); };
      col.append(up, v, dn);
      wrap.appendChild(col);
      cols.push(v);
    }
    const go = document.createElement('button');
    go.className = 'dial-go';
    go.textContent = '당겨 보기';
    go.onclick = (e) => { e.stopPropagation(); onSubmit(vals.join(''), wrap); };
    wrap.appendChild(go);
    wrap.setValue = (s) => { s.split('').forEach((d, i) => { vals[i] = +d; cols[i].textContent = d; }); };
    return wrap;
  },

  keypad(onSubmit) {
    const wrap = document.createElement('div');
    wrap.className = 'keypad';
    const screen = document.createElement('div');
    screen.className = 'kp-screen';
    let val = '';
    const render = () => { screen.textContent = val.padEnd(4, '_').split('').join(' '); };
    render();
    wrap.appendChild(screen);
    const grid = document.createElement('div');
    grid.className = 'kp-grid';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지움', '0', '확인'].forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      b.onclick = (e) => {
        e.stopPropagation();
        sfx.dial();
        if (k === '지움') val = val.slice(0, -1);
        else if (k === '확인') { if (val.length === 4) { const v = val; val = ''; render(); onSubmit(v, wrap); return; } }
        else if (val.length < 4) val += k;
        render();
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    wrap.press = (k) => {
      if (/^[0-9]$/.test(k) && val.length < 4) { val += k; sfx.dial(); }
      else if (k === 'Backspace') val = val.slice(0, -1);
      else if (k === 'Enter' && val.length === 4) { const v = val; val = ''; render(); onSubmit(v, wrap); return; }
      render();
    };
    return wrap;
  },

  shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  },

  fade(on, color = '#000', ms = 1200) {
    const f = $('fade');
    f.style.background = color;
    f.style.transition = `opacity ${ms}ms`;
    f.classList.toggle('show', on);
  },
};
