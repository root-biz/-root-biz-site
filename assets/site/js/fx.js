/* Root — interaction effects (2026-11): loading skeleton/spinner, mouse stalker (PC),
   underline animation for key phrases, parallax for photos & videos */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function visible(el) { return el.offsetParent !== null || getComputedStyle(el).position === 'fixed'; }

  /* ---------- 1. skeleton while images / videos load ---------- */
  function skel(el, done) {
    if (done()) return;
    el.classList.add('rt-skel');
    var off = function () { el.classList.remove('rt-skel'); };
    el.addEventListener(el.tagName === 'VIDEO' ? 'loadeddata' : 'load', off, { once: true });
    el.addEventListener('error', off, { once: true });
    setTimeout(off, 15000);
  }
  $$('img').forEach(function (img) {
    var r = img.getBoundingClientRect();
    if (r.width < 48 || r.height < 32) return; // icons / logos
    skel(img, function () { return img.complete && img.naturalWidth > 0; });
  });
  $$('video').forEach(function (v) { skel(v, function () { return v.readyState >= 2; }); });

  /* ---------- 2. spinner + progress bar while moving to another page ---------- */
  var bar = document.createElement('div'); bar.className = 'rt-pbar'; bar.setAttribute('aria-hidden', 'true');
  var spin = document.createElement('div'); spin.className = 'rt-spin'; spin.setAttribute('role', 'status'); spin.setAttribute('aria-live', 'polite');
  spin.innerHTML = '<span class="rt-spin-ring" aria-hidden="true"></span><span class="rt-sr">読み込み中</span>';
  document.body.appendChild(bar); document.body.appendChild(spin);
  var spinT = null;
  function startLoading() {
    document.documentElement.classList.add('rt-leaving');
    clearTimeout(spinT); spinT = setTimeout(function () { document.documentElement.classList.add('rt-leaving-slow'); }, 350);
  }
  function stopLoading() { clearTimeout(spinT); document.documentElement.classList.remove('rt-leaving', 'rt-leaving-slow'); }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.target === '_blank' || a.hasAttribute('download') || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;
    var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return; // same page / hash
    startLoading();
  });
  window.addEventListener('pageshow', stopLoading); // back/forward cache
  // forms: spinner on the submit button while sending (contact / mtg set disabled while posting)
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      var b = m.target; if (!b.matches || !b.matches('button, a[data-rt="submit"], a[data-rt="meet"]')) return;
      var busy = b.disabled || b.getAttribute('aria-busy') === 'true' || b.getAttribute('aria-disabled') === 'true';
      b.classList.toggle('rt-busy', busy && /送信|予約|確定/.test(b.textContent));
    });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-busy', 'aria-disabled'] });

  /* ---------- 3. mouse stalker (PC / fine pointer only) ---------- */
  if (finePointer && !reduce) {
    var dot = document.createElement('div'); dot.className = 'rt-stalker'; dot.setAttribute('aria-hidden', 'true');
    var ring = document.createElement('div'); ring.className = 'rt-stalker-ring'; ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; document.documentElement.classList.add('rt-stalk-on'); }
      var t = e.target.closest && e.target.closest('a, button, [role="button"], label, summary, input, select, textarea');
      document.documentElement.classList.toggle('rt-stalk-hover', !!t);
      document.documentElement.classList.toggle('rt-stalk-text', !!(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
    }, { passive: true });
    document.addEventListener('pointerleave', function () { shown = false; document.documentElement.classList.remove('rt-stalk-on'); });
    document.addEventListener('mousedown', function () { document.documentElement.classList.add('rt-stalk-down'); });
    document.addEventListener('mouseup', function () { document.documentElement.classList.remove('rt-stalk-down'); });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 4. underline animation on key phrases ---------- */
  // orange-coloured phrases inside headings (e.g. 「常駐型コンサルティング」「新しいリファラル採用」)
  var keys = $$('h1 span, h2 span, h3 span').filter(function (s) {
    var st = (s.getAttribute('style') || '').replace(/\s/g, '').toLowerCase();
    if (!/color:(#(f2661f|c94e10)|rgb\((242,102,31|201,78,16)\))/.test(st)) return false; // only the highlighted phrases
    if (/background(-color)?:/.test(st) || s.children.length > 1) return false; // skip boxed labels
    return s.textContent.trim().length >= 2;
  });
  keys.forEach(function (s) { s.classList.add('rt-uline'); });
  if (reduce || !('IntersectionObserver' in window)) keys.forEach(function (s) { s.classList.add('is-drawn'); });
  else {
    // headings use clip-path for their own reveal, so watch the heading's parent box instead
    var uo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        (e.target._rtU || []).forEach(function (el) { setTimeout(function () { el.classList.add('is-drawn'); }, 450); });
        uo.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    keys.forEach(function (s) { var h = s.closest('h1,h2,h3'), t = (h && h.parentElement) || s; (t._rtU = t._rtU || []).push(s); uo.observe(t); });
  }

  /* ---------- 5. parallax for photos and videos ---------- */
  if (!reduce) {
    var px = [];
    $$('img, video').forEach(function (m) {
      var cs = getComputedStyle(m), p = m.parentElement; if (!p) return;
      if (cs.objectFit !== 'cover') return;
      var r = m.getBoundingClientRect(); if (r.width < 280 || r.height < 160) return;
      if (getComputedStyle(p).overflow === 'visible' && !/overflow:\s*(hidden|clip)/.test(p.getAttribute('style') || '')) return;
      if (m.closest('[data-rt-slide], #latest-column, [role="dialog"], [data-rt-panel]')) return; // carousels & menus move on their own
      var hero = !!m.closest('section') && m.closest('section') === m.closest('.view-pc, .view-sp').querySelector('section');
      m.classList.add('rt-plx');
      px.push({ el: m, k: hero ? 0.22 : 0.08 });
    });
    var ticking = false;
    function run() {
      ticking = false; var vh = window.innerHeight;
      px.forEach(function (o) {
        if (!visible(o.el)) return;
        var r = o.el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var c = (r.top + r.height / 2 - vh / 2); // distance of the box centre from the viewport centre
        var y = Math.max(-60, Math.min(60, -c * o.k));
        o.el.style.translate = '0 ' + y.toFixed(1) + 'px';
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(run); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    run();
  }

  /* ---------- 6. "ふわっと" fade-up for blocks the base reveal does not cover ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var skipSel = 'header, nav, footer, [role="dialog"], [data-rt-panel], [data-rt-slide], [data-rt-track], [data-rt-board], #latest-column, [hidden], .rt-acc-body';
    function okEl(el) {
      if (el.matches('[data-rt-zoom], [data-rt-side], [data-rt-pop]')) return false;
      if (el.closest(skipSel) || el.closest('[data-rt-tagged]') || el.querySelector('[data-rt-tagged]')) return false;
      var st = el.getAttribute('style') || '';
      if (/transform|opacity|animation|position:\s*(absolute|fixed|sticky)/.test(st)) return false;
      var box = el.closest('.view-pc, .view-sp'); if (!box) return false;
      var first = box.querySelector('section'); if (first && first.contains(el)) return false; // hero keeps its own entrance
      var cs = getComputedStyle(el); return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed';
    }
    var fade = [];
    function add(el, i) { if (!okEl(el)) return; el.setAttribute('data-rt-tagged', '1'); el.classList.add('rt-r'); el.style.transitionDelay = (Math.min(i || 0, 5) * 80) + 'ms'; fade.push(el); }
    // cards: siblings that look like cards (rounded box with a fill or border)
    $$('.view-pc section div, .view-sp section div').forEach(function (g) {
      var kids = [].slice.call(g.children).filter(function (k) {
        var st = (k.getAttribute('style') || '').replace(/\s/g, '');
        return /border-radius:\d/.test(st) && /(background(-color)?:(#(?!fff)|rgb)|border:)/i.test(st) && k.children.length;
      });
      if (kids.length >= 2 && kids.length <= 10) kids.forEach(add);
    });
    $$('.view-pc section p, .view-sp section p, .view-pc section figure, .view-sp section figure, .view-pc section ul, .view-sp section ul, .view-pc section table, .view-sp section table, .view-pc section dl, .view-sp section dl, [data-rt-cta-c]').forEach(function (el) { add(el, 0); });
    $$('.view-pc section img, .view-sp section img').forEach(function (im) { if (im.getBoundingClientRect().width > 160 && !im.closest('figure, a')) add(im, 0); });
    var vh2 = window.innerHeight;
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); fo.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    fade.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh2 * 0.92 && r.bottom > 0) { el.classList.add('rt-now', 'is-in'); setTimeout(function () { el.classList.remove('rt-now'); }, 50); }
      else fo.observe(el);
    });
  }

  /* ---------- 7. sliders: swipe rows get dot indicators (and mouse drag on PC) ---------- */
  $$('.view-pc [style*="scroll-snap-type"], .view-sp [style*="scroll-snap-type"]').forEach(function (track) {
    if (track.hasAttribute('data-rt-track') || track.closest('#latest-column') || track.classList.contains('rt-ostrip')) return;
    var items = [].slice.call(track.children).filter(function (c) { return c.nodeType === 1; });
    if (items.length < 2) return;
    track.setAttribute('data-rt-slider', '');
    var dots = document.createElement('div'); dots.className = 'rt-dots'; dots.setAttribute('role', 'tablist'); dots.setAttribute('aria-label', 'スライド');
    items.forEach(function (it, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rt-dot'; b.setAttribute('aria-label', (i + 1) + '枚目へ');
      b.addEventListener('click', function () { track.scrollTo({ left: it.offsetLeft - items[0].offsetLeft, behavior: 'smooth' }); });
      dots.appendChild(b);
    });
    track.parentNode.insertBefore(dots, track.nextSibling);
    function cur() {
      var x = track.scrollLeft, best = 0, bd = Infinity;
      items.forEach(function (it, i) { var d = Math.abs(it.offsetLeft - items[0].offsetLeft - x); if (d < bd) { bd = d; best = i; } });
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 4) best = items.length - 1;
      [].slice.call(dots.children).forEach(function (d, i) { d.classList.toggle('is-on', i === best); d.setAttribute('aria-selected', i === best ? 'true' : 'false'); });
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(cur); }, { passive: true });
    cur();
    if (finePointer) { // drag with the mouse
      var down = false, sx = 0, sl = 0, moved = false;
      track.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; track.classList.add('is-drag'); });
      window.addEventListener('mousemove', function (e) { if (!down) return; var dx = e.pageX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
      window.addEventListener('mouseup', function () { if (!down) return; down = false; track.classList.remove('is-drag'); track.style.scrollSnapType = 'x mandatory'; });
      track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
  });

  /* ---------- 8. accordions for long text on SP (privacy policy sections) ---------- */
  var secs = $$('.view-sp section[id^="p"]').filter(function (s) { return /^p\d+$/.test(s.id) && s.querySelector(':scope > h2'); });
  if (secs.length >= 4) {
    secs.forEach(function (sec, i) {
      var h = sec.querySelector(':scope > h2');
      var body = document.createElement('div'); body.className = 'rt-acc-body';
      while (h.nextSibling) body.appendChild(h.nextSibling);
      sec.appendChild(body);
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'rt-acc-btn';
      btn.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
      btn.innerHTML = '<span class="rt-acc-sign" aria-hidden="true"></span>';
      h.insertBefore(btn, null); h.classList.add('rt-acc-h');
      var inner = document.createElement('div'); inner.className = 'rt-acc-inner';
      while (body.firstChild) inner.appendChild(body.firstChild);
      body.appendChild(inner);
      function set(open, anim) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        sec.classList.toggle('is-open', open);
        if (!anim || reduce) { body.style.height = open ? 'auto' : '0px'; return; }
        var from = body.getBoundingClientRect().height; body.style.height = from + 'px';
        var to = open ? inner.getBoundingClientRect().height : 0;
        requestAnimationFrame(function () { body.style.height = to + 'px'; });
        body.addEventListener('transitionend', function te() { body.removeEventListener('transitionend', te); if (open) body.style.height = 'auto'; });
      }
      set(i === 0, false);
      h.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true', true); });
      sec._rtOpen = function () { set(true, false); };
    });
    // table-of-contents links open their section
    $$('.view-sp a[href^="#p"]').forEach(function (a) {
      a.addEventListener('click', function () { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t && t._rtOpen) t._rtOpen(); });
    });
  }

  /* ---------- 9. child pages: image wipe, list slide-in, icon pop (data-rt-zoom / data-rt-side / data-rt-pop) ---------- */
  (function () {
    var els = $$('[data-rt-zoom], [data-rt-side], [data-rt-pop]');
    if (!els.length || reduce || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('rt-x');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();
})();
