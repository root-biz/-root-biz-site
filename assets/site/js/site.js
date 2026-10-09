/* Root corporate site — shared runtime (round 1: header, menu, ids, tracking) */
(function () {
  'use strict';
  var SP_MQ = window.matchMedia('(max-width:767px)');
  var page = document.body.getAttribute('data-page') || '';
  window.dataLayer = window.dataLayer || [];
  function push(o) { try { window.dataLayer.push(o); } catch (e) {} }
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function visible(el) { return !!(el && el.getClientRects().length); }
  function closest(el, sel) { return el && el.closest ? el.closest(sel) : null; }

  /* ---------- 1. PC/SP duplicate ids: keep the id on the copy that is shown ---------- */
  var views = { pc: document.querySelector('.view-pc'), sp: document.querySelector('.view-sp') };
  function syncIds() {
    if (!views.pc || !views.sp) return;
    var showSp = SP_MQ.matches, on = showSp ? views.sp : views.pc, off = showSp ? views.pc : views.sp;
    off.querySelectorAll('[id]').forEach(function (el) {
      if (on.querySelector('[data-rt-id="' + el.id + '"]') || on.querySelector('#' + CSS.escape(el.id))) {
        el.setAttribute('data-rt-id', el.id); el.removeAttribute('id');
      }
    });
    on.querySelectorAll('[data-rt-id]').forEach(function (el) {
      if (!el.id) el.id = el.getAttribute('data-rt-id');
    });
  }
  syncIds();
  (SP_MQ.addEventListener ? SP_MQ.addEventListener('change', syncIds) : SP_MQ.addListener(syncIds));
  if (location.hash) {
    var t0 = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t0) setTimeout(function () { t0.scrollIntoView(); }, 60);
  }

  /* tablet: fit the 1024px PC layout into 768–1023px screens */
  function fitTablet() {
    var w = document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--rt-zoom', (w >= 768 && w < 1024) ? (w / 1024).toFixed(4) : '1');
  }
  fitTablet(); window.addEventListener('resize', fitTablet);

  /* ---------- 2. Header ---------- */
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="#F2661F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  function readMenu(root) {
    // menu data lives in the SP drawer markup of the same header component
    var items = [];
    root.querySelectorAll('[role="dialog"] nav > div').forEach(function (block) {
      var btn = block.querySelector('button');
      if (!btn) return;
      var spans = btn.querySelectorAll('span > span');
      var links = [].slice.call(block.querySelectorAll('a')).map(function (a) {
        return { href: a.getAttribute('href'), label: txt(a), blank: a.getAttribute('target') === '_blank' };
      });
      var top = links[0] || { href: '#' };
      var seen = {};
      var sub = links.slice(1).filter(function (l) {
        var k = l.href + '|' + l.label; if (seen[k]) return false; seen[k] = 1;
        return !(l.href === top.href && /トップ$/.test(l.label));
      });
      items.push({ en: spans[0] ? txt(spans[0]) : '', ja: spans[1] ? txt(spans[1]) : '', href: top.href, links: sub });
    });
    return items;
  }

  document.querySelectorAll('nav[aria-label="メインメニュー"]').forEach(function (nav) {
    var pcLinks = nav.querySelectorAll('a[aria-haspopup="true"]');
    if (!pcLinks.length) return;
    var box = nav.parentElement.parentElement;           // white pill container
    var panel = box.querySelector('[data-dc-if="isOpen"]');
    var comp = closest(nav, '[style*="sticky"]') || box.parentElement.parentElement;
    var menu = readMenu(comp.parentElement || document);
    if (!panel || !menu.length) return;
    panel.setAttribute('data-rt-panel', '');
    var titleA = panel.querySelector('a');
    var titleSpans = titleA.querySelectorAll('span');
    var grid = panel.querySelector('[style*="grid-template-columns"]');
    var timer = null, current = -1;

    function fill(i) {
      var m = menu[i]; if (!m) return;
      titleA.setAttribute('href', m.href);
      titleSpans[1].textContent = m.en;           // big EN text
      titleSpans[titleSpans.length - 1].textContent = m.ja;
      grid.innerHTML = m.links.map(function (l) {
        return '<a class="rt-mega-link" href="' + l.href + '" data-rt-navsub>' + l.label + ARROW + '</a>';
      }).join('');
    }
    function open(i) {
      clearTimeout(timer);
      if (current !== i) { fill(i); current = i; }
      panel.hidden = false;
      pcLinks.forEach(function (a, j) { a.setAttribute('aria-expanded', j === i ? 'true' : 'false'); a.classList.toggle('is-active', j === i); });
    }
    function close() {
      panel.hidden = true; current = -1;
      pcLinks.forEach(function (a) { a.setAttribute('aria-expanded', 'false'); a.classList.remove('is-active'); });
    }
    function closeSoon() { clearTimeout(timer); timer = setTimeout(close, 160); }
    pcLinks.forEach(function (a, i) {
      a.setAttribute('data-rt-nav', '');
      a.addEventListener('mouseenter', function () { open(i); });
      a.addEventListener('focus', function () { open(i); });
    });
    box.addEventListener('mouseleave', closeSoon);
    box.addEventListener('mouseenter', function () { clearTimeout(timer); });
    box.addEventListener('focusout', function (e) { if (!box.contains(e.relatedTarget)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { close(); } });
  });

  /* SP drawer */
  document.querySelectorAll('button[aria-label="メニューを開く"]').forEach(function (openBtn) {
    var wrap = openBtn.parentElement.parentElement;
    var drawerWrap = wrap.querySelector('[data-dc-if="spIsOpen"]');
    if (!drawerWrap) return;
    var closeBtn = drawerWrap.querySelector('button[aria-label="メニューを閉じる"]');
    function setOpen(v) {
      drawerWrap.hidden = !v; openBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
      document.body.classList.toggle('is-menu-open', v);
      if (v && closeBtn) closeBtn.focus(); else openBtn.focus({ preventScroll: true });
    }
    openBtn.addEventListener('click', function () { setOpen(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawerWrap.hidden) setOpen(false); });
    drawerWrap.querySelectorAll('nav > div').forEach(function (block) {
      var b = block.querySelector('button'), sub = block.querySelector('[data-dc-if="m.spIsOpen"]');
      if (!b || !sub) return;
      var sign = b.querySelector('span[aria-hidden="true"]:last-child');
      b.addEventListener('click', function () {
        var v = sub.hidden; sub.hidden = !v; b.setAttribute('aria-expanded', v ? 'true' : 'false');
        if (sign) sign.textContent = v ? '−' : '+';
      });
    });
    drawerWrap.addEventListener('click', function (e) {
      var a = closest(e.target, 'a'); if (a) setTimeout(function () { setOpen(false); }, 0);
    });
  });

  /* ---------- 3. Links that are intentionally inert ---------- */
  document.addEventListener('click', function (e) {
    var a = closest(e.target, 'a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------- 4. Tracking (GTM dataLayer) ---------- */
  function locationOf(el) {
    var sec = closest(el, '[id]');
    var lab = sec ? sec.id : '';
    if (closest(el, 'nav[aria-label="メインメニュー"]') || closest(el, '[data-rt-panel]') || closest(el, '[role="dialog"]')) lab = 'header';
    if (closest(el, 'footer')) lab = 'footer';
    return page + ':' + (lab || 'body') + ':' + (SP_MQ.matches ? 'sp' : 'pc');
  }
  document.addEventListener('click', function (e) {
    var a = closest(e.target, 'a'); if (!a) return;
    var href = a.getAttribute('href') || '';
    var card = closest(a, '[data-service-link]');
    if (card) {
      push({ event: 'service_card_click', service_id: card.getAttribute('data-service-link'), service_name: card.getAttribute('data-service-name') || txt(card).slice(0, 40) });
      return;
    }
    if (/^\/mtg(\?|$)/.test(href) || href === '/contact') {
      push({ event: 'cta_click', cta_location: locationOf(a), cta_type: (href.split('type=')[1] || (href === '/contact' ? 'contact' : 'service')), cta_text: txt(a).slice(0, 60), link_url: href });
      return;
    }
    if (a.hasAttribute('data-rt-nav') || a.hasAttribute('data-rt-navsub') || closest(a, '[role="dialog"]')) {
      push({ event: 'nav_click', nav_item: txt(a).slice(0, 40), link_url: href });
    }
  }, true);

  if ('IntersectionObserver' in window) {
    var seen = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id || en.target.getAttribute('data-rt-id');
        if (!id || seen[id] || !visible(en.target)) return;
        seen[id] = 1; push({ event: 'section_view', section_name: page + ':' + id });
        io.unobserve(en.target);
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('section[id],section[data-rt-id]').forEach(function (s) { io.observe(s); });
  }
})();
