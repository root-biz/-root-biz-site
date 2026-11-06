/* Root — small UI behaviours added with the 2026-11 UI refresh */
(function () {
  'use strict';
  /* TOP: latest column carousel (arrows + dots, swipe on SP, auto slide every 5s with seamless loop) */
  [].slice.call(document.querySelectorAll('#latest-column, [data-rt-id="latest-column"]')).forEach(function (sec) {
    var cards = [].slice.call(sec.querySelectorAll('a[href^="/column/"]'));
    if (!cards.length) return;
    var N = cards.length;
    var track = cards[0].parentElement;
    track.style.overflowX = 'auto';
    track.style.scrollSnapType = 'x mandatory';
    track.style.scrollBehavior = 'smooth';
    track.style.scrollbarWidth = 'none';
    track.style.scrollPaddingLeft = getComputedStyle(track).paddingLeft;
    cards.forEach(function (c) { c.style.scrollSnapAlign = 'start'; });
    // clones after the last card so the loop back to the first card is seamless
    var clones = cards.map(function (c) {
      var k = c.cloneNode(true);
      k.setAttribute('aria-hidden', 'true'); k.setAttribute('tabindex', '-1');
      [].slice.call(k.querySelectorAll('a,button,[tabindex]')).forEach(function (x) { x.setAttribute('tabindex', '-1'); });
      track.appendChild(k); return k;
    });
    var slots = cards.concat(clones);
    var prev = sec.querySelector('button[aria-label="前の記事"]');
    var next = sec.querySelector('button[aria-label="次の記事"]');
    var dotBox = null;
    [].slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      var kids = [].slice.call(d.children);
      if (!dotBox && kids.length === N && kids.every(function (k) { return k.tagName === 'SPAN' && /border-radius:\s*999px/.test(k.getAttribute('style') || ''); })) dotBox = d;
    });
    var dots = dotBox ? [].slice.call(dotBox.children) : [];
    function left(el) { return el.offsetLeft - cards[0].offsetLeft; }
    function slot() {
      var x = track.scrollLeft, best = 0, bd = Infinity;
      slots.forEach(function (c, i) { var d = Math.abs(left(c) - x); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function paint() {
      var i = slot() % N;
      dots.forEach(function (d, j) { d.style.width = j === i ? '24px' : '8px'; d.style.background = j === i ? '#F2661F' : 'rgba(255,255,255,.3)'; });
      if (prev) prev.style.opacity = '1';
      if (next) next.style.opacity = '1';
    }
    function jump(x) { track.style.scrollBehavior = 'auto'; track.scrollLeft = x; track.style.scrollBehavior = 'smooth'; }
    var settle = null;
    function normalize() { // when resting on a clone, silently move to the matching original card
      var s = slot(); if (s >= N) jump(left(cards[s - N])); paint();
    }
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(paint);
      clearTimeout(settle); settle = setTimeout(normalize, 160);
    }, { passive: true });
    function to(i) { i = Math.max(0, Math.min(slots.length - 1, i)); track.scrollTo({ left: left(slots[i]) }); }
    if (prev) prev.addEventListener('click', function () { var s = slot(); if (s === 0) { jump(left(clones[0])); s = N; } to(s - 1); });
    if (next) next.addEventListener('click', function () { to(slot() + 1); });
    dots.forEach(function (d, j) { d.style.cursor = 'pointer'; d.addEventListener('click', function () { to(j); }); });
    paint();

    /* auto slide: pause while hovered/touched/focused, off screen, or the tab is hidden */
    var DELAY = 5000, timer = null, hold = false, inView = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick() {
      if (hold || !inView || document.hidden || track.offsetParent === null) return;
      to(slot() + 1);
    }
    function restart() { if (timer) clearInterval(timer); timer = reduce ? null : setInterval(tick, DELAY); }
    sec.addEventListener('mouseenter', function () { hold = true; });
    sec.addEventListener('mouseleave', function () { hold = false; restart(); });
    track.addEventListener('touchstart', function () { hold = true; }, { passive: true });
    track.addEventListener('touchend', function () { hold = false; restart(); }, { passive: true });
    sec.addEventListener('keyup', function (e) { if (e.key === 'Tab') hold = sec.contains(document.activeElement); });
    [prev, next].concat(dots).forEach(function (b) { if (b) b.addEventListener('click', restart); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(sec);
    } else inView = true;
    restart();
  });
})();
