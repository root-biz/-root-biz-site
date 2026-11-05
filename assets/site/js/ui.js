/* Root — small UI behaviours added with the 2026-11 UI refresh */
(function () {
  'use strict';
  /* TOP: latest column carousel (arrows + dots, swipe on SP) */
  [].slice.call(document.querySelectorAll('#latest-column, [data-rt-id="latest-column"]')).forEach(function (sec) {
    var cards = [].slice.call(sec.querySelectorAll('a[href^="/column/"]'));
    if (!cards.length) return;
    var track = cards[0].parentElement;
    track.style.overflowX = 'auto';
    track.style.scrollSnapType = 'x mandatory';
    track.style.scrollBehavior = 'smooth';
    track.style.scrollbarWidth = 'none';
    track.style.scrollPaddingLeft = getComputedStyle(track).paddingLeft;
    cards.forEach(function (c) { c.style.scrollSnapAlign = 'start'; });
    var prev = sec.querySelector('button[aria-label="前の記事"]');
    var next = sec.querySelector('button[aria-label="次の記事"]');
    var dotBox = null;
    [].slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      var kids = [].slice.call(d.children);
      if (!dotBox && kids.length === cards.length && kids.every(function (k) { return k.tagName === 'SPAN' && /border-radius:\s*999px/.test(k.getAttribute('style') || ''); })) dotBox = d;
    });
    var dots = dotBox ? [].slice.call(dotBox.children) : [];
    function index() {
      var x = track.scrollLeft, best = 0, bd = Infinity;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - track.offsetLeft - parseFloat(track.style.scrollPaddingLeft || 0) - x); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function paint() {
      var i = index();
      dots.forEach(function (d, j) { d.style.width = j === i ? '24px' : '8px'; d.style.background = j === i ? '#F2661F' : 'rgba(255,255,255,.3)'; });
      if (prev) prev.style.opacity = track.scrollLeft <= 2 ? '.4' : '1';
      if (next) next.style.opacity = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2 ? '.4' : '1';
    }
    function to(i) { i = Math.max(0, Math.min(cards.length - 1, i)); track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft }); }
    if (prev) prev.addEventListener('click', function () { to(index() - 1); });
    if (next) next.addEventListener('click', function () { to(index() + 1); });
    dots.forEach(function (d, j) { d.style.cursor = 'pointer'; d.addEventListener('click', function () { to(j); }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(paint); }, { passive: true });
    paint();
  });
})();
