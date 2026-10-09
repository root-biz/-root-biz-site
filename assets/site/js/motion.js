/* Root corporate site — round 2: videos + motion (nahato-style reveals, counters, accordions, tabs, carousels, sticky CTA) */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SP_MQ = window.matchMedia('(max-width:767px)');
  var IO = 'IntersectionObserver' in window;
  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function inChrome(el) { return !!el.closest('header,footer,article,[role="dialog"],nav[aria-label="メインメニュー"],[data-rt-panel],#sp-sticky-cta,aside'); }
  function shown(el) { return !!el.getClientRects().length; }
  function watch(els, cb, opts) {
    if (!IO) { els.forEach(function (el) { cb(el, true); }); return null; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { cb(en.target, en.isIntersecting, io); });
    }, opts || { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    return io;
  }

  /* ---------- 1. videos: play only while on screen, poster/logo as fallback ---------- */
  $$('video[data-rt-video]').forEach(function (v) {
    var once = v.getAttribute('data-rt-video') === 'once';
    var slot = v.parentElement;
    if (RM) { v.removeAttribute('autoplay'); return; }
    v.muted = true; v.loop = !once; v.setAttribute('muted', '');
    v.addEventListener('playing', function () { v.classList.add('is-on'); slot.classList.add('is-video'); });
    v.addEventListener('error', function () { v.classList.remove('is-on'); slot.classList.remove('is-video'); });
    if (once) {
    }
    var done = false;
    watch([v], function (el, on) {
      if (!shown(el)) return;
      if (on) {
        if (once && done) return;
        var p = el.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked: keep fallback image */ });
        if (once) done = true;
      } else if (!once) { el.pause(); }
    }, { threshold: 0.15 });
  });

  /* ---------- 2. scroll reveal (auto-tagged) ---------- */
  var reveal = [];
  if (!RM) {
  function tag(el, cls, delay) {
    if (!el || el.hasAttribute('data-rt-tagged')) return;
    if (el.style.transform || el.style.opacity || el.style.animation) return;
    el.setAttribute('data-rt-tagged', '1');
    el.classList.add(cls);
    if (delay) el.style.transitionDelay = delay + 'ms';
    reveal.push(el);
  }
  // headings + their small labels
  $$('h2, h1').forEach(function (h) {
    if (inChrome(h) || h.classList.contains('sr-only')) return;
    tag(h, 'rt-h');
    var prev = h.previousElementSibling, next = h.nextElementSibling;
    if (prev && prev.tagName === 'SPAN' && !prev.hasAttribute('aria-hidden')) tag(prev, 'rt-r');
    if (next && (next.tagName === 'P' || next.tagName === 'SPAN') && !next.hasAttribute('aria-hidden')) tag(next, 'rt-r', 120);
  });
  // steps, cards, list items
  function staggerGroup(els) { els.forEach(function (el, i) { tag(el, 'rt-r', Math.min(i, 5) * 90); }); }
  staggerGroup($$('.hiw-step, .svc2, .pt, .point'));
  $$('ol').forEach(function (ol) { if (!inChrome(ol)) staggerGroup($$(':scope > li:not([aria-hidden])', ol)); });
  // cards = children of multi-column inline grids (export writes grid-template-columns:repeat(...))
  $$('[style*="grid-template-columns:repeat("], [style*="grid-template-columns: repeat("]').forEach(function (g) {
    if (inChrome(g) || g.closest('dl,form,[role="tablist"]')) return;
    var kids = $$(':scope > div, :scope > a, :scope > article, :scope > li', g).filter(function (k) {
      return !k.hasAttribute('aria-hidden') && k.children.length && !k.querySelector('section, h2, h1');
    });
    if (kids.length >= 2 && kids.length <= 12) staggerGroup(kids);
  });
  // first paint: things already on screen appear without animation (except hero headings)
  var vh = window.innerHeight;
  reveal.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (shown(el) && r.top < vh * 0.9 && !el.closest('[id^="hero-video"], #hero-video-slot')) {
      el.classList.add('rt-now', 'is-in');
      setTimeout(function () { el.classList.remove('rt-now'); }, 50);
    }
  });
  // clip-path'd headings report a zero intersection, so headings are triggered through their parent
  var byTarget = new Map();
  reveal.forEach(function (el) {
    if (el.classList.contains('is-in')) return;
    var t = el.classList.contains('rt-h') ? (el.parentElement || el) : el;
    if (!byTarget.has(t)) byTarget.set(t, []);
    byTarget.get(t).push(el);
  });
  watch(Array.from(byTarget.keys()), function (t, on, io) {
    if (!on) return;
    byTarget.get(t).forEach(function (el) { el.classList.add('is-in'); });
    if (io) io.unobserve(t);
  }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });

  } // !RM

  /* ---------- 3. counters + bars ---------- */
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')), dec = (el.getAttribute('data-count').split('.')[1] || '').length;
    var t0 = null, dur = 1400;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      el.textContent = (target * ease(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = el.getAttribute('data-count');
    }
    requestAnimationFrame(step);
  }
  watch($$('[data-count]'), function (el, on, io) { if (on && shown(el)) { countUp(el); if (io) io.unobserve(el); } }, { threshold: 0.6 });

  if (!RM) $$('.pt-bar[data-value]').forEach(function (b) {
    b.setAttribute('data-rt-w', b.style.width || (b.getAttribute('data-value') + '%'));
    b.style.width = '0%'; b.style.transition = 'width 1.2s ' + EASE;
  });
  watch($$('.pt-bar[data-value]'), function (el, on, io) {
    if (on && shown(el)) { if (el.getAttribute('data-rt-w')) el.style.width = el.getAttribute('data-rt-w'); if (io) io.unobserve(el); }
  }, { threshold: 0.3 });

  /* ---------- 4. big background words drift with scroll ---------- */
  var drift = RM ? [] : $$('span[aria-hidden="true"]').filter(function (s) {
    var st = s.getAttribute('style') || '';
    return /font:\s*900/.test(st) && /(pointer-events:\s*none|text-stroke|color:#F4E3CF|color:\s*transparent)/i.test(st) && !inChrome(s);
  });
  drift.forEach(function (s, i) { s.classList.add('rt-drift'); s.setAttribute('data-rt-dir', i % 2 ? '-1' : '1'); });
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = window.innerHeight;
      drift.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.bottom < -200 || r.top > h + 200) return;
        var p = ((r.top + r.height / 2) - h / 2) / h; // -0.5..0.5 around centre
        s.style.translate = (p * 90 * s.getAttribute('data-rt-dir')).toFixed(1) + 'px 0';
      });
      stickyUpdate();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- 5. accordions (FAQ / process / "すべて見る" / ENTRY) ---------- */
  function slide(panel, open, after) {
    panel.style.overflow = 'hidden';
    if (open) panel.hidden = false;
    var h = panel.scrollHeight;
    var anim = panel.animate(open ? [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }]
                                  : [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
                             { duration: RM ? 0 : 380, easing: EASE });
    anim.onfinish = function () { panel.style.overflow = ''; if (!open) panel.hidden = true; if (after) after(); };
  }
  $$('button[aria-expanded]').forEach(function (b) {
    if (b.closest('[role="dialog"]') || b.hasAttribute('aria-haspopup') || /^メニュー/.test(b.getAttribute('aria-label') || '')) return;
    var panel = null, label = b.getAttribute('aria-label') || '';
    if (/^エントリー/.test(label)) {
      var box = b.closest('aside') || b.parentElement.parentElement;
      panel = box.querySelector('[data-dc-if="open"]') || (b.parentElement.nextElementSibling);
    } else {
      var n = b.nextElementSibling, pv = b.previousElementSibling;
      if (n && (n.hasAttribute('data-dc-if') || b.getAttribute('aria-expanded') === 'true')) panel = n;
      else if (pv && pv.hasAttribute('data-dc-if')) panel = pv;
    }
    if (!panel) return;
    b.setAttribute('data-rt-acc-btn', '');
    var sign = $$('span[aria-hidden="true"]', b).filter(function (s) { return /^[+−\-]$/.test(s.textContent.trim()); })[0];
    var textNode = !sign && /^[+−]$/.test(b.textContent.trim()) ? b : null;
    var more = /すべて見る/.test(b.textContent) ? b : null;
    var open = b.getAttribute('aria-expanded') === 'true';
    if (open && panel.hidden) panel.hidden = false;
    function render() {
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (sign) sign.textContent = open ? '−' : '+';
      if (textNode) textNode.textContent = open ? '−' : '+';
      if (more) more.childNodes[0].nodeValue = open ? '閉じる' : 'すべて見る';
      if (/^エントリー/.test(label)) b.setAttribute('aria-label', open ? 'エントリーを閉じる' : 'エントリーを開く');
    }
    b.addEventListener('click', function () {
      open = !open; render();
      slide(panel, open, open ? function () { $$('.rt-r', panel).forEach(function (x) { x.classList.add('is-in'); }); } : null);
    });
  });

  /* ---------- 6. tabs (HR TECH: push / pull) ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    var onStyle = (tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]).getAttribute('style');
    var offStyle = (tabs.filter(function (t) { return t.getAttribute('aria-selected') !== 'true'; })[0] || tabs[1]).getAttribute('style');
    var panels = [], el = list.nextElementSibling;
    while (el && panels.length < tabs.length) {
      if (el.getAttribute('role') === 'tabpanel' || el.querySelector(':scope > [role="tabpanel"]')) panels.push(el);
      el = el.nextElementSibling;
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x, j) {
          var on = j === i; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.setAttribute('style', on ? onStyle : offStyle);
          if (panels[j]) {
            if (!panels[j].hasAttribute('data-rt-disp')) panels[j].setAttribute('data-rt-disp', panels[j].style.display || '');
            panels[j].hidden = !on; panels[j].style.display = on ? panels[j].getAttribute('data-rt-disp') : 'none';
            var tp = panels[j].getAttribute('role') === 'tabpanel' ? panels[j] : panels[j].querySelector('[role="tabpanel"]');
            if (tp) { tp.classList.remove('rt-tab-in'); if (on) { void tp.offsetWidth; tp.classList.add('rt-tab-in'); } }
          }
        });
      });
    });
  });

  /* ---------- 7. carousels: scroll-snap tracks with progress bar + arrows ---------- */
  $$('button[aria-label="前へ"]').forEach(function (prev) {
    var ctrl = prev.parentElement, next = ctrl.querySelector('button[aria-label="次へ"]');
    var bar = ctrl.querySelector('span > span');
    var track = ctrl.nextElementSibling;
    while (track && !/scroll-snap-type/.test(track.getAttribute('style') || '')) track = track.nextElementSibling;
    if (!track) return;
    track.setAttribute('data-rt-track', ''); if (bar) bar.setAttribute('data-rt-bar', '');
    track.style.scrollBehavior = 'smooth';
    function stepW() { var c = track.children[0]; return c ? c.getBoundingClientRect().width + 12 : track.clientWidth * 0.85; }
    function update() {
      if (!bar) return;
      var max = track.scrollWidth - track.clientWidth;
      var n = track.children.length;
      var p = max > 0 ? track.scrollLeft / max : 0;
      bar.style.width = ((1 / n) + p * (1 - 1 / n)) * 100 + '%';
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -stepW() }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: stepW() }); });
    track.addEventListener('scroll', update, { passive: true });
    update();
  });

  /* board carousel (RECRUIT SP): translateX(calc(17.5% - N * (65% + 12px))) */
  $$('button[aria-label="前のメンバー"]').forEach(function (prev) {
    var ctrl = prev.parentElement, next = ctrl.querySelector('button[aria-label="次のメンバー"]');
    var dots = $$('button', ctrl).filter(function (b) { return b !== prev && b !== next; });
    var wrap = ctrl.previousElementSibling, track = wrap && wrap.firstElementChild;
    if (!track || !/translateX\(calc\(/.test(track.getAttribute('style') || '')) return;
    track.setAttribute('data-rt-board', '');
    var m = (track.getAttribute('style') || '').match(/translateX\(calc\(([\d.]+%)\s*-\s*\d+\s*\*\s*\(([\d.]+%)\s*\+\s*([\d.]+px)\)\)\)/);
    var n = track.children.length, idx = 0;
    function tf(i) { return m ? 'translateX(calc(' + m[1] + ' - ' + i + ' * (' + m[2] + ' + ' + m[3] + ')))' : 'translateX(calc(17.5% - ' + i + ' * (65% + 12px)))'; }
    var onBg = dots[0] ? dots[0].style.background : '#FFFFFF', offBg = dots[1] ? dots[1].style.background : 'rgba(255,255,255,.4)';
    dots.forEach(function (d) { d.setAttribute('data-rt-dot', ''); });
    // name block under the dots follows the slide (the export only carries the first member's name)
    var MEMBERS = { '小堀 和隆': ['Kazutaka Kobori', '代表取締役社長'], '原田 陸也': ['Rikuya Harada', '取締役副社長'] };
    var nameBox = ctrl.nextElementSibling, nameSpans = nameBox ? $$(':scope > span', nameBox) : [];
    function go(i) {
      idx = (i + n) % n;
      track.style.transform = tf(idx);
      var img = track.children[idx].querySelector('img'), ja = img && img.getAttribute('alt');
      if (nameSpans.length >= 3 && ja && MEMBERS[ja]) {
        nameBox.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE });
        nameSpans[0].textContent = ja; nameSpans[1].textContent = MEMBERS[ja][0]; nameSpans[2].textContent = MEMBERS[ja][1];
      }
      dots.forEach(function (d, j) { d.style.background = j === idx ? onBg : offBg; d.setAttribute('aria-current', j === idx ? 'true' : 'false'); });
    }
    prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
    dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); }); });
    // swipe
    var x0 = null;
    wrap.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });
    go(0);
  });

  /* ---------- 8. SP sticky CTA: appears after the hero, hides over the footer / while the menu is open ---------- */
  var sticky = document.getElementById('sp-sticky-cta');
  var stickyHero = document.querySelector('.view-sp [id^="hero-video"], .view-sp section');
  function stickyUpdate() {
    if (!sticky) return;
    var hide = true;
    if (shown(sticky) || SP_MQ.matches) {
      var heroBottom = stickyHero ? stickyHero.getBoundingClientRect().bottom : 400;
      var foot = document.querySelector('.view-sp footer');
      var footIn = foot && foot.getBoundingClientRect().top < window.innerHeight - 40;
      hide = heroBottom > window.innerHeight * 0.5 || !!footIn || document.body.classList.contains('is-menu-open');
    }
    sticky.classList.toggle('is-hidden', hide);
  }
  if (sticky) { sticky.classList.add('is-hidden'); sticky.style.transform = 'none'; sticky.style.visibility = 'visible'; stickyUpdate(); }
  new MutationObserver(stickyUpdate).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- 9. RECRUIT hero: word reveal + swoosh ---------- */
  $$('#hero-video-recruit').forEach(function (hero) {
    $$('#recruit-copy [data-word]', hero).forEach(function (w, i) { w.style.animationDelay = (0.15 + i * 0.09) + 's'; });
    setTimeout(function () { hero.classList.add('rt-ready'); }, 120);
  });

  onScroll();
})();
