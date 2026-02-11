const KEY_BISERI = 'hitni_biseri_moji';
const KEY_AUDIO_ON = 'mr_audio_on';
const KEY_AUDIO_TIME = 'mr_audio_time';

const KEY_PULSE_LOG = 'mr_pulse_log';
const KEY_PULSE_TRIAGE = 'mr_pulse_triage';
const KEY_PULSE_START = 'mr_pulse_start';

function byId(id) {
  return document.getElementById(id);
}

function normalizeBiser(text) {
  let t = (text || '').trim();
  if (!t) return '';
  if (!/[!?]$/.test(t)) t += '!';
  return t;
}

function loadBiseri() {
  const list = byId('mojiBiseri');
  if (!list) return;

  const raw = localStorage.getItem(KEY_BISERI);
  const items = raw ? JSON.parse(raw) : [];
  list.innerHTML = '';
  items.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    list.appendChild(li);
  });
}

function saveBiser(t) {
  const raw = localStorage.getItem(KEY_BISERI);
  const items = raw ? JSON.parse(raw) : [];
  items.unshift(t);
  localStorage.setItem(KEY_BISERI, JSON.stringify(items));
  loadBiseri();
}

function clearBiseri() {
  localStorage.removeItem(KEY_BISERI);
  loadBiseri();
}

function initBiseri() {
  const input = byId('biserInput');
  const addBtn = byId('addBiserBtn');
  const clearBtn = byId('clearBiseriBtn');

  if (addBtn && input) {
    addBtn.addEventListener('click', () => {
      const t = normalizeBiser(input.value);
      if (!t) return;
      saveBiser(t);
      input.value = '';
      input.focus();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearBiseri();
    });
  }

  loadBiseri();
}

function svgIcon(isOn) {
  if (isOn) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10v4h4l5 4V6L7 10H3z"></path>
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path>
        <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10v4h4l5 4V6L7 10H3z"></path>
      <path d="M4.27 3L3 4.27l6 6V18l-3-2H3v-4h2.73l13 13L21 23.73 4.27 3z"></path>
      <path d="M19 12c0 2.08-.8 3.97-2.11 5.38l1.42 1.42C20.01 17.12 21 14.69 21 12c0-2.69-.99-5.12-2.69-6.8l-1.42 1.42C18.2 8.03 19 9.92 19 12z"></path>
    </svg>
  `;
}

function ensureAudio() {
  let audio = document.getElementById('bgAudio');
  if (audio) return audio;

  audio = document.createElement('audio');
  audio.id = 'bgAudio';
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.35;

  const src = document.createElement('source');
  src.src = 'assets/zvuk.mp3';
  src.type = 'audio/mpeg';
  audio.appendChild(src);

  document.body.appendChild(audio);
  return audio;
}

function ensureFloatingBtn() {
  let btn = document.querySelector('.audioToggleFloating');
  if (btn) return btn;

  btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'audioToggle audioToggleFloating';
  btn.setAttribute('aria-label', 'Zvuk');
  document.body.appendChild(btn);
  return btn;
}

function applyAudioState(btn, audio, isOn) {
  btn.classList.toggle('isOn', isOn);
  btn.innerHTML = svgIcon(isOn);
  localStorage.setItem(KEY_AUDIO_ON, isOn ? '1' : '0');

  if (isOn) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function restoreAudioTime(audio) {
  const savedTime = parseFloat(localStorage.getItem(KEY_AUDIO_TIME) || '0');
  if (!Number.isNaN(savedTime) && savedTime > 0) {
    const trySet = () => {
      if (audio.duration && savedTime < audio.duration) audio.currentTime = savedTime;
    };
    if (audio.readyState >= 1) {
      trySet();
    } else {
      audio.addEventListener('loadedmetadata', trySet, { once: true });
    }
  }
}

function initAudio() {
  const audio = ensureAudio();
  const btn = ensureFloatingBtn();

  const savedOn = localStorage.getItem(KEY_AUDIO_ON) === '1';
  restoreAudioTime(audio);

  btn.innerHTML = svgIcon(savedOn);
  btn.classList.toggle('isOn', savedOn);

  btn.addEventListener('click', () => {
    const isOn = !btn.classList.contains('isOn');
    applyAudioState(btn, audio, isOn);
    updatePulseChecks();
  });

  window.addEventListener('pagehide', () => {
    try {
      localStorage.setItem(KEY_AUDIO_TIME, String(audio.currentTime || 0));
    } catch (e) {}
  });
}

function getPulseStart() {
  const raw = localStorage.getItem(KEY_PULSE_START);
  if (raw) return parseInt(raw, 10);
  const now = Date.now();
  localStorage.setItem(KEY_PULSE_START, String(now));
  return now;
}

function formatHours(ms) {
  const h = Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
  return `${h}h`;
}

function getTriage() {
  return localStorage.getItem(KEY_PULSE_TRIAGE) || 'stable';
}

function setTriage(level) {
  localStorage.setItem(KEY_PULSE_TRIAGE, level);
}

function triageMeta(level) {
  if (level === 'kriticno') {
    return { title: 'Kritično', sub: 'Netko je dirao layout i pobjegao bez traga!', cls: 'kriticno' };
  }
  if (level === 'work') {
    return { title: 'U obradi', sub: 'Pikseli na infuziji, vraćamo ih u život!', cls: 'work' };
  }
  return { title: 'Stabilno', sub: 'Pikseli mirni, sve pod kontrolom!', cls: 'stable' };
}

function loadPulseLog() {
  const list = byId('logList');
  if (!list) return;

  const raw = localStorage.getItem(KEY_PULSE_LOG);
  const items = raw ? JSON.parse(raw) : [];
  list.innerHTML = '';
  items.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    list.appendChild(li);
  });
}

function addPulseLog(text) {
  const raw = localStorage.getItem(KEY_PULSE_LOG);
  const items = raw ? JSON.parse(raw) : [];
  items.unshift(text);
  localStorage.setItem(KEY_PULSE_LOG, JSON.stringify(items.slice(0, 12)));
  loadPulseLog();
}

function resetPulse() {
  localStorage.removeItem(KEY_PULSE_LOG);
  localStorage.removeItem(KEY_PULSE_TRIAGE);
  localStorage.setItem(KEY_PULSE_START, String(Date.now()));
  loadPulseLog();
  renderPulse();
}

function renderPulse() {
  const biseriRaw = localStorage.getItem(KEY_BISERI);
  const biseri = biseriRaw ? JSON.parse(biseriRaw) : [];

  const statBiseri = byId('statBiseri');
  const statDez = byId('statDezurstvo');
  const triageStatus = byId('triageStatus');
  const triageSub = byId('triageSub');
  const triageBox = byId('triageBox');

  if (statBiseri) statBiseri.textContent = String(biseri.length);

  const start = getPulseStart();
  if (statDez) statDez.textContent = formatHours(Date.now() - start);

  const level = getTriage();
  const meta = triageMeta(level);

  if (triageStatus) triageStatus.textContent = meta.title;
  if (triageSub) triageSub.textContent = meta.sub;

  if (triageBox) {
    triageBox.classList.remove('stable', 'work', 'kriticno');
    triageBox.classList.add(meta.cls);
  }

  updatePulseChecks();
}

function initPulse() {
  const triBtns = document.querySelectorAll('.triBtn');
  if (triBtns.length) {
    triBtns.forEach((b) => {
      b.addEventListener('click', () => {
        const level = b.getAttribute('data-level');
        if (!level) return;
        setTriage(level);
        renderPulse();
      });
    });
  }

  const addLogBtn = byId('addLogBtn');
  if (addLogBtn) {
    addLogBtn.addEventListener('click', () => {
      const presets = [
        'Stabiliziran zvuk i vraćen ritam!',
        'Korekcija boja: pacijent prodisao!',
        'CSS patchan, nitko ne zna kako, ali radi!',
        'Animacija reanimirana bez panike!',
        'Uklonjena ogrebotina s fotke, pacijent zahvalan!'
      ];
      addPulseLog(presets[Math.floor(Math.random() * presets.length)]);
    });
  }

  const resetBtn = byId('resetPulseBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetPulse();
    });
  }

  loadPulseLog();
  renderPulse();

  setInterval(() => {
    const statDez = byId('statDezurstvo');
    if (!statDez) return;
    statDez.textContent = formatHours(Date.now() - getPulseStart());
  }, 5000);
}

function updatePulseChecks() {
  const dot = byId('checkAudio');
  const txt = byId('checkAudioTxt');
  if (!dot || !txt) return;

  const on = localStorage.getItem(KEY_AUDIO_ON) === '1';
  if (on) {
    dot.classList.add('ok');
    txt.textContent = 'uključen';
  } else {
    dot.classList.remove('ok');
    txt.textContent = 'isključen';
  }
}

function initRecept() {
  const form = byId('receptForm');
  const toast = byId('receptToast');
  if (!form || !toast) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
    form.reset();
  });
}

function initReveal() {
  const targets = Array.from(document.querySelectorAll(
    '.heroGlow, .card, .mediaSection, .mediaCard, .videoCard, .note, .panel, .timeline, .pulsePanel, .triageBox, .statCard, .logCard, .formCard'
  ));
  if (!targets.length) return;

  targets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => io.observe(el));
}

function initCursorGlow() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;

  document.body.classList.add('hasCursorGlow');

  window.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
    document.documentElement.style.setProperty('--my', `${e.clientY}px`);
  }, { passive: true });
}

function initMicroTilt() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;

  const cards = Array.from(document.querySelectorAll('.card, .mediaCard, .videoCard, .panel, .logCard, .statCard, .note'));
  if (!cards.length) return;

  cards.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (y - 0.5) * -6;
      const ry = (x - 0.5) * 8;
      el.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

function initLightbox() {
  const imgs = Array.from(document.querySelectorAll('.mediaCard img'));
  if (!imgs.length) return;

  let lb = document.querySelector('.lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightboxBack"></div>
      <div class="lightboxShell" role="dialog" aria-modal="true">
        <button class="lightboxClose" type="button" aria-label="Zatvori">✕</button>
        <img class="lightboxImg" alt="" />
        <div class="lightboxCap"></div>
        <div class="lightboxNav">
          <button class="lightboxPrev" type="button" aria-label="Prethodna">‹</button>
          <button class="lightboxNext" type="button" aria-label="Sljedeća">›</button>
        </div>
      </div>
    `;
    document.body.appendChild(lb);
  }

  const imgEl = lb.querySelector('.lightboxImg');
  const capEl = lb.querySelector('.lightboxCap');
  const closeBtn = lb.querySelector('.lightboxClose');
  const back = lb.querySelector('.lightboxBack');
  const prevBtn = lb.querySelector('.lightboxPrev');
  const nextBtn = lb.querySelector('.lightboxNext');

  let current = 0;
  let lastFocus = null;

  function openAt(i) {
    current = (i + imgs.length) % imgs.length;
    const img = imgs[current];
    const full = img.getAttribute('data-full') || img.currentSrc || img.src;
    const cap = img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt || '';

    imgEl.src = full;
    imgEl.alt = cap || 'Fotka';
    capEl.textContent = cap;

    lastFocus = document.activeElement;
    lb.classList.add('open');
    document.body.classList.add('lbOpen');
    closeBtn.focus();
  }

  function closeLb() {
    lb.classList.remove('open');
    document.body.classList.remove('lbOpen');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function next() {
    openAt(current + 1);
  }

  function prev() {
    openAt(current - 1);
  }

  imgs.forEach((img, idx) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openAt(idx));
  });

  closeBtn.addEventListener('click', closeLb);
  back.addEventListener('click', closeLb);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  imgEl.addEventListener('dblclick', () => {
    if (!imgEl.src) return;
    window.open(imgEl.src, '_blank', 'noopener,noreferrer');
  });
}


function fmtTime(s){
  const t = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(t / 60);
  const r = t % 60;
  return `${m}:${String(r).padStart(2,'0')}`;
}

function initInlineAudioPlayers(){
  const players = Array.from(document.querySelectorAll('.audioPlayer[data-audio-src]'));
  if (!players.length) return;

  players.forEach((p) => {
    const src = p.getAttribute('data-audio-src') || '';
    const btn = p.querySelector('.audioBtn');
    const track = p.querySelector('.audioTrack2');
    const fill = p.querySelector('.audioFill2');
    const cur = p.querySelector('.audioCur2');
    const dur = p.querySelector('.audioDur2');
    const vol = p.querySelector('.audioVol');
    const mute = p.querySelector('.audioMute2');

    const a = new Audio(src);
    a.preload = 'metadata';
    a.loop = false;
    a.volume = 0.85;

    const bg = document.getElementById('bgAudio');
    const bgBtn = document.querySelector('.audioToggleFloating');

    function sync(){
      const d = a.duration || 0;
      const c = a.currentTime || 0;
      if (dur) dur.textContent = fmtTime(d);
      if (cur) cur.textContent = fmtTime(c);
      const pct = d ? (c / d) * 100 : 0;
      if (fill) fill.style.width = `${pct}%`;
    }

    function setBtn(){
      if (!btn) return;
      btn.textContent = a.paused ? '▶' : '❚❚';
    }

    function setMute(){
      if (!mute) return;
      mute.textContent = a.muted ? '🔇' : '🔊';
    }

    function pauseBg(){
      if (bg && !bg.paused){
        bg.pause();
        if (bgBtn){
          bgBtn.classList.remove('isOn');
          bgBtn.innerHTML = svgIcon(false);
        }
        try{ localStorage.setItem(KEY_AUDIO_ON,'0'); }catch(e){}
      }
    }

    if (btn){
      btn.addEventListener('click', () => {
        if (a.paused){
          pauseBg();
          a.play().catch(() => {});
        }else{
          a.pause();
        }
      });
    }

    if (track){
      track.addEventListener('click', (e) => {
        const rect = track.getBoundingClientRect();
        const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
        const p = rect.width ? x / rect.width : 0;
        const d = a.duration || 0;
        if (d) a.currentTime = d * p;
      });
    }

    if (vol){
      vol.value = String(Math.round(a.volume * 100));
      vol.addEventListener('input', () => {
        const v = Math.min(100, Math.max(0, parseInt(vol.value, 10) || 0));
        a.volume = v / 100;
      });
    }

    if (mute){
      mute.addEventListener('click', () => {
        a.muted = !a.muted;
        setMute();
      });
    }

    a.addEventListener('loadedmetadata', sync);
    a.addEventListener('timeupdate', sync);
    a.addEventListener('play', setBtn);
    a.addEventListener('pause', setBtn);
    a.addEventListener('ended', () => {
      a.currentTime = 0;
      sync();
      setBtn();
    });

    setBtn();
    setMute();
    sync();
  });
}


function initVideoThumbs(){
  const vids = Array.from(document.querySelectorAll('.videoThumb video'));
  if (!vids.length) return;

  vids.forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    v.preload = 'metadata';
    const seek = () => {
      try{ v.currentTime = 0.05; }catch(e){}
    };
    const stop = () => {
      try{ v.pause(); }catch(e){}
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener('loadedmetadata', seek, { once: true });
    v.addEventListener('seeked', stop);
    stop();
  });
}


function initVideoModal(){
  const tiles = Array.from(document.querySelectorAll('[data-video-src]'));
  if (!tiles.length) return;

  let modal = document.querySelector('.mediaModal');
  if (!modal){
    modal = document.createElement('div');
    modal.className = 'mediaModal';
    modal.innerHTML = `
      <div class="mediaModalBack"></div>
      <div class="mediaModalShell" role="dialog" aria-modal="true">
        <div class="mediaModalTop">
          <div class="mediaModalTitle"></div>
          <button class="mediaModalClose" type="button" aria-label="Zatvori">✕</button>
        </div>
        <div class="mediaModalBody">
          <video controls playsinline preload="metadata"></video>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const back = modal.querySelector('.mediaModalBack');
  const closeBtn = modal.querySelector('.mediaModalClose');
  const titleEl = modal.querySelector('.mediaModalTitle');
  const vid = modal.querySelector('video');

  function close(){
    modal.classList.remove('open');
    try{ vid.pause(); }catch(e){}
    vid.removeAttribute('src');
    vid.load();
    document.body.style.overflow = '';
  }

  function open(src, title){
    if (!src) return;
    if (titleEl) titleEl.textContent = title || 'Video';

    try{ vid.pause(); }catch(e){}
    vid.removeAttribute('src');
    vid.load();

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    vid.src = src;
    vid.load();
    vid.play().catch(() => {});
  }

  tiles.forEach((t) => {
    t.addEventListener('click', () => {
      const src = t.getAttribute('data-video-src');
      const title = t.getAttribute('data-video-title') || '';
      open(src, title);
    });
  });

  if (back) back.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
  });
}



document.addEventListener('DOMContentLoaded', () => {
  initBiseri();
  initAudio();
  initPulse();
  initRecept();
  initReveal();
  initCursorGlow();
  initMicroTilt();
  initLightbox();
  initInlineAudioPlayers();
  initVideoThumbs();
  initVideoModal();
});
document.body.classList.add('hasCursorGlow')

window.addEventListener('mousemove', (e) => {
  document.body.style.setProperty('--mx', e.clientX + 'px')
  document.body.style.setProperty('--my', e.clientY + 'px')
})
