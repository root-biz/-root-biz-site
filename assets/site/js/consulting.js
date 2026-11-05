/* Root — /service/consulting : FLOW & OUTPUT carousel (PC) and output image switcher */
(function () {
  'use strict';
  var root = document.querySelector('.view-pc');
  if (!root) return;
  var track = root.querySelector('[data-rt-ctrack]');
  var slides = [].slice.call(root.querySelectorAll('[data-rt-slide]'));
  var prev = root.querySelector('[aria-label="前のフェーズへ"]');
  var next = root.querySelector('[aria-label="次のフェーズへ"]');
  var bar = root.querySelector('[data-rt-cbar]');
  var cnt = root.querySelector('[data-rt-ccnt]');
  var N = slides.length, W = '84%', GAP = 28, ph = 0;

  function slideStyle(on) {
    return 'position:relative;flex:none;width:' + W + ';box-sizing:border-box;padding:40px;border-radius:20px;background:' + (on ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)') +
      ';border:1px solid ' + (on ? 'rgba(242,102,31,.7)' : 'rgba(255,255,255,.12)') + ';transition:opacity .4s ease,border-color .4s ease;opacity:' + (on ? '1' : '.45') + ';cursor:' + (on ? 'default' : 'pointer');
  }
  function btnStyle(dir) {
    var ok = dir < 0 ? ph > 0 : ph < N - 1, hot = dir > 0;
    return 'flex:none;display:grid;place-items:center;width:60px;height:60px;padding:0;border-radius:4px;cursor:' + (ok ? 'pointer' : 'not-allowed') + ';transition:background .2s ease,color .2s ease,opacity .2s ease;' +
      (hot ? 'background:#F2661F;color:#FFFFFF;border:1.5px solid #F2661F;' : 'background:#FFFFFF;color:#221B14;border:1.5px solid #FFFFFF;') + 'opacity:' + (ok ? '1' : '.35');
  }
  function render() {
    if (track) track.style.transform = 'translateX(calc(' + (-ph) + ' * (' + W + ' + ' + GAP + 'px)))';
    slides.forEach(function (s, i) { s.setAttribute('style', slideStyle(i === ph)); s.setAttribute('aria-current', i === ph ? 'true' : 'false'); });
    if (bar) bar.style.width = ((ph + 1) / N * 100) + '%';
    if (cnt) cnt.textContent = '0' + ph;
    if (prev) { prev.setAttribute('style', btnStyle(-1)); prev.disabled = ph === 0; }
    if (next) { next.setAttribute('style', btnStyle(1)); next.disabled = ph === N - 1; }
  }
  function go(i) { ph = Math.max(0, Math.min(N - 1, i)); render(); }
  if (N) {
    slides.forEach(function (s, i) { s.addEventListener('click', function () { if (i !== ph) go(i); }); });
    if (prev) prev.addEventListener('click', function () { go(ph - 1); });
    if (next) next.addEventListener('click', function () { go(ph + 1); });
    // keyboard + swipe
    if (track) {
      var x0 = null;
      track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(ph + (dx < 0 ? 1 : -1)); });
    }
    render();
  }

  /* output thumbnails: click a thumbnail to show that page in the large frame */
  var groups = {};
  [].slice.call(root.querySelectorAll('[data-rt-oth]')).forEach(function (b) {
    var k = b.getAttribute('data-rt-oth').split('_'); (groups[k[0]] = groups[k[0]] || []).push(b);
  });
  function thStyle(sel) {
    return 'display:block;width:100%;min-width:0;padding:4px;border-radius:8px;cursor:pointer;font:inherit;transition:background .2s ease,border-color .2s ease,color .2s ease;background:' + (sel ? 'rgba(242,102,31,.16)' : 'rgba(255,255,255,.04)') +
      ';border:1.5px solid ' + (sel ? '#F2661F' : 'rgba(255,255,255,.16)') + ';color:' + (sel ? '#FFFFFF' : 'rgba(255,255,255,.6)');
  }
  Object.keys(groups).forEach(function (a) {
    groups[a].forEach(function (b, c) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        groups[a].forEach(function (x, j) { x.setAttribute('style', thStyle(j === c)); x.setAttribute('aria-pressed', j === c ? 'true' : 'false'); });
        [].slice.call(root.querySelectorAll('[data-rt-oimg^="' + a + '_"]')).forEach(function (img) {
          img.style.opacity = img.getAttribute('data-rt-oimg') === a + '_' + c ? '1' : '0';
        });
        var sl = b.closest('[data-rt-slide]'); if (sl && +sl.getAttribute('data-rt-slide') !== ph) go(+sl.getAttribute('data-rt-slide'));
      });
    });
  });
})();
