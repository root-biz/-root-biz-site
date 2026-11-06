/* Root — small UI behaviours added with the 2026-11 UI refresh */
(function () {
  'use strict';
  /*
   * TOP: latest column carousel
   * The active article is shown large with its tag / date / title rising in beside it (PC) or under it (SP);
   * the other articles stay small and dimmed. Slides every 3s (1.2s transition) and loops endlessly.
   */
  var EASE = 'cubic-bezier(.65,0,.35,1)';
  var SPEED = 1200, DELAY = 3000;

  [].slice.call(document.querySelectorAll('#latest-column, [data-rt-id="latest-column"]')).forEach(function (sec) {
    var src = [].slice.call(sec.querySelectorAll('a[href^="/column/"]'));
    if (!src.length) return;
    var N = src.length;
    var track = src[0].parentElement;
    var sp = !!sec.closest('.view-sp');
    var G = sp
      ? { big: 300, small: 136, gap: 16, at: 44, infoW: 300 }
      : { big: 560, small: 264, gap: 30, at: 168, infoW: 380 };
    var R = 670 / 1280;

    // collect the data of each article from the static markup
    var items = src.map(function (a) {
      var img = a.querySelector('img');
      var badge = a.querySelector('span > span[style*="999px"]');
      var time = a.querySelector('time');
      var tt = a.getAttribute('data-title');
      if (!tt) { var spans = [].slice.call(a.children).filter(function (c) { return c.tagName === 'SPAN' && !c.querySelector('img,time'); }); tt = spans.length ? spans[spans.length - 1].textContent.trim() : ''; }
      return { href: a.getAttribute('href'), img: img ? img.getAttribute('src') : '', tag: badge ? badge.textContent.trim() : '', date: time ? time.textContent.trim() : '', dt: time ? time.getAttribute('datetime') : '', title: tt };
    });

    // rebuild the track: 3 copies so the loop can continue in both directions
    track.innerHTML = '';
    track.setAttribute('style', 'position:relative;padding:0;overflow:hidden;min-width:0;width:100%;min-height:' + (sp ? Math.round(G.big * R) + 120 : Math.round(G.big * R) + 4) + 'px');
    var rail = document.createElement('div');
    rail.setAttribute('style', 'display:flex;align-items:flex-start;gap:' + G.gap + 'px;will-change:transform;transition:transform ' + SPEED + 'ms ' + EASE);
    track.appendChild(rail);
    var slides = [];
    for (var copy = 0; copy < 3; copy++) {
      items.forEach(function (it, i) {
        var a = document.createElement('a');
        a.href = it.href;
        a.setAttribute('style', 'position:relative;flex:none;display:block;text-decoration:none;color:#FFFFFF;width:' + G.small + 'px;transition:width .7s ease');
        if (copy !== 1) { a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1; }
        a.innerHTML =
          '<span data-im style="position:relative;display:block;width:100%;aspect-ratio:1280/670;border-radius:12px;overflow:hidden;background:#2E2620">' +
            '<img src="' + it.img + '" alt="" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover">' +
            '<span data-dim style="position:absolute;inset:0;background:rgba(0,0,0,.5);transition:opacity .7s ease"></span>' +
          '</span>' +
          '<span data-info style="position:absolute;display:block;overflow:hidden;' +
            (sp ? 'left:0;top:calc(100% + 16px);width:' + G.infoW + 'px;' : 'left:calc(100% + 30px);bottom:0;width:' + G.infoW + 'px;') + 'visibility:hidden">' +
            '<span data-rise style="display:grid;gap:12px;transform:translateY(105%);transition:none">' +
              '<span style="display:flex;align-items:center;gap:12px">' +
                (it.tag ? '<span style="display:inline-flex;align-items:center;padding:3px 12px;border-radius:999px;background:#F2661F;color:#FFFFFF;font:700 11px \'Noto Sans JP\',sans-serif">' + it.tag + '</span>' : '') +
                (it.date ? '<time datetime="' + it.dt + '" style="font:600 ' + (sp ? 13 : 15) + 'px \'Archivo\',sans-serif;letter-spacing:.06em;color:#FFFFFF">' + it.date + '</time>' : '') +
              '</span>' +
              '<span style="font:700 ' + (sp ? 16 : 18) + 'px/1.7 \'Noto Sans JP\',sans-serif;color:#FFFFFF;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + it.title + '</span>' +
            '</span>' +
          '</span>';
        rail.appendChild(a);
        slides.push(a);
      });
    }

    var prev = sec.querySelector('button[aria-label="前の記事"]');
    var next = sec.querySelector('button[aria-label="次の記事"]');
    var dotBox = null;
    [].slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      var kids = [].slice.call(d.children);
      if (!dotBox && kids.length === N && kids.every(function (k) { return k.tagName === 'SPAN' && /border-radius:\s*999px/.test(k.getAttribute('style') || ''); })) dotBox = d;
    });
    var dots = dotBox ? [].slice.call(dotBox.children) : [];

    var cur = N; // middle copy, first article
    function offset(i) { return G.at - i * (G.small + G.gap); } // every slide before the active one is small
    function setActive(i, animate) {
      slides.forEach(function (s, j) {
        var on = j === i;
        s.style.transition = animate ? 'width .7s ease' : 'none';
        s.style.width = (on ? G.big : G.small) + 'px';
        s.querySelector('[data-dim]').style.opacity = on ? '0' : '1';
        var info = s.querySelector('[data-info]'), rise = s.querySelector('[data-rise]');
        if (on) {
          info.style.visibility = 'visible';
          rise.style.transition = 'none'; rise.style.transform = 'translateY(105%)';
          void rise.offsetWidth;
          rise.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1) ' + (animate ? '.55s' : '0s');
          rise.style.transform = 'translateY(0)';
        } else {
          info.style.visibility = 'hidden'; rise.style.transition = 'none'; rise.style.transform = 'translateY(105%)';
        }
      });
      var k = ((i % N) + N) % N;
      dots.forEach(function (d, j) { d.style.transition = 'width .4s ease,background .4s ease'; d.style.width = j === k ? '24px' : '8px'; d.style.background = j === k ? '#F2661F' : 'rgba(255,255,255,.3)'; });
    }
    function place(i, animate) {
      rail.style.transition = animate ? 'transform ' + SPEED + 'ms ' + EASE : 'none';
      rail.style.transform = 'translateX(' + offset(i) + 'px)';
    }
    var busy = false;
    function go(i) {
      if (busy) return;
      busy = true; cur = i;
      place(cur, true); setActive(cur, true);
      setTimeout(function () {
        // stay inside the middle copy so the loop never runs out
        if (cur < N || cur >= 2 * N) {
          cur = N + (((cur % N) + N) % N);
          place(cur, false); setActive(cur, false);
          var r = slides[cur].querySelector('[data-rise]'); r.style.transition = 'none'; r.style.transform = 'translateY(0)';
        }
        busy = false;
      }, SPEED + 30);
    }
    place(cur, false); setActive(cur, false);

    // autoplay: wait DELAY after each transition (pauses off screen / hidden tab / reduced motion)
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var inView = false, timer = null;
    function schedule() { clearTimeout(timer); if (!reduce) timer = setTimeout(function () { if (inView && !document.hidden && track.offsetParent !== null) go(cur + 1); schedule(); }, DELAY + SPEED); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.2 }).observe(sec);
    else inView = true;

    if (prev) prev.addEventListener('click', function () { go(cur - 1); schedule(); });
    if (next) next.addEventListener('click', function () { go(cur + 1); schedule(); });
    dots.forEach(function (d, j) { d.style.cursor = 'pointer'; d.addEventListener('click', function () { go(N + j); schedule(); }); });
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); schedule(); }
    }, { passive: true });
    schedule();
  });
})();
