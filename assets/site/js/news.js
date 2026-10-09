/* Root — /news : カテゴリ・年・キーワードで絞り込み */
(function () {
  'use strict';
  var ON = { border: '#F2661F', bg: '#F2661F', color: '#FFFFFF' }, OFF = { border: '#E3D9CC', bg: '#FFFFFF', color: '#221B14' };
  var S = { cat: 'すべて', year: '最新', q: '' };
  var roots = [].slice.call(document.querySelectorAll('.view-pc, .view-sp'));
  function paint(b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.borderColor = on ? ON.border : OFF.border; b.style.background = on ? ON.bg : OFF.bg; b.style.color = on ? ON.color : OFF.color; }
  function apply() {
    roots.forEach(function (r) {
      var cards = [].slice.call(r.querySelectorAll('[data-news-card]')), n = 0;
      cards.forEach(function (c) {
        var ok = (S.cat === 'すべて' || c.getAttribute('data-category') === S.cat)
              && (S.year === '最新' || c.getAttribute('data-year') === S.year)
              && (!S.q || (c.getAttribute('data-title') + ' ' + c.getAttribute('data-category')).toLowerCase().indexOf(S.q.toLowerCase()) !== -1);
        c.hidden = !ok; c.style.display = ok ? '' : 'none'; if (ok) n++;
      });
      var empty = r.querySelector('[data-dc-if="empty"]'); if (empty) { empty.hidden = n > 0; empty.style.display = n > 0 ? 'none' : ''; }
      if (cards.length) { var list = cards[0].parentElement; list.style.display = n > 0 ? '' : 'none'; }
      [].slice.call(r.querySelectorAll('[aria-label="カテゴリで絞り込む"] button')).forEach(function (b) { paint(b, b.textContent.trim() === S.cat); });
      [].slice.call(r.querySelectorAll('[aria-label="年で絞り込む"] button')).forEach(function (b) { paint(b, b.textContent.trim() === S.year); });
      var inp = r.querySelector('input[type="search"]'); if (inp && inp.value !== S.q) inp.value = S.q;
    });
  }
  roots.forEach(function (r) {
    [].slice.call(r.querySelectorAll('[aria-label="カテゴリで絞り込む"] button')).forEach(function (b) { b.addEventListener('click', function () { S.cat = b.textContent.trim(); apply(); }); });
    [].slice.call(r.querySelectorAll('[aria-label="年で絞り込む"] button')).forEach(function (b) { b.addEventListener('click', function () { S.year = b.textContent.trim(); apply(); }); });
    var inp = r.querySelector('input[type="search"]');
    if (inp) { inp.addEventListener('input', function () { S.q = inp.value.trim(); apply(); }); var lab = inp.closest('label'); if (lab) lab.addEventListener('submit', function (e) { e.preventDefault(); }); }
  });
  // deep links from the header menu: /news#press /news#info /news#media
  var H = { press: 'プレスリリース', info: 'お知らせ', media: 'メディア掲載' };
  function fromHash() { var k = location.hash.replace('#', ''); if (H[k]) { S.cat = H[k]; apply(); var g = document.querySelector('[aria-label="カテゴリで絞り込む"]'); roots.forEach(function (r) { var x = r.querySelector('[aria-label="カテゴリで絞り込む"]'); if (x && x.getClientRects().length) g = x; }); if (g) { g.style.scrollMarginTop = '120px'; g.scrollIntoView({ block: 'start' }); } } }
  window.addEventListener('hashchange', fromHash);
  apply(); fromHash();
})();
