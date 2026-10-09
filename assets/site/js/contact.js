/* Root — /contact : お問い合わせフォーム（GAS action:"contact" → info@root-biz.com） */
(function () {
  'use strict';
  var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxPxy0g9u-2qg0OdASEF7r8l0vuYiJtHp8yNVmL_clRyRwcWgiW8Og_NkH1NVQNWP-0/exec';
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var SHADOW = '0 8px 24px rgba(242,102,31,.4),0 2px 0 #B8420E';
  window.dataLayer = window.dataLayer || [];
  var S = { category: '', values: {}, touched: {}, agree: false, sending: false };
  var FIELDS = [
    { name: 'company', label: '会社名・団体名', required: false, max: 100 },
    { name: 'name', label: 'お名前', required: true, max: 60 },
    { name: 'email', label: 'メールアドレス', required: true, kind: 'email', max: 120 },
    { name: 'tel', label: '電話番号', required: false, kind: 'tel', max: 20 },
    { name: 'message', label: 'お問い合わせ内容', required: true, max: 4000 }
  ];
  var forms = [].slice.call(document.querySelectorAll('form'));
  if (!forms.length) return;
  function q(root, sel) { return root.querySelector(sel); }
  function show(el, v) {
    if (!el) return;
    if (!el.hasAttribute('data-rt-disp')) el.setAttribute('data-rt-disp', el.style.display || '');
    el.hidden = !v; el.style.display = v ? el.getAttribute('data-rt-disp') : 'none';
  }
  function setText(el, t) { if (el) el.textContent = t; }

  function ctl(form, name) { return form.querySelector('[name="' + name + '"]:not([type="hidden"])'); }

  function render() {
    forms.forEach(function (form) {
      [].slice.call(form.querySelectorAll('[role="radio"]')).forEach(function (b) {
        var on = b.textContent.trim() === S.category;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.style.borderColor = on ? '#F2661F' : '#D3CBBF'; b.style.background = on ? '#FBF1E6' : '#FFFFFF'; b.style.color = on ? '#C94E10' : '#221B14';
      });
      var sub = q(form, '[data-rt="submit"]');
      if (sub) { var ready = S.agree && !S.sending; sub.setAttribute('aria-disabled', ready ? 'false' : 'true'); sub.style.boxShadow = ready ? SHADOW : 'none'; sub.style.opacity = ready ? '1' : '.6'; sub.style.cursor = ready ? 'pointer' : 'not-allowed'; }
      show(q(form, '[data-rt="submit"]'), !S.sending); show(q(form, '[data-rt="sending"]'), S.sending);
      var ag = q(form, '[data-rt="agree"]'); if (ag && ag.checked !== S.agree) ag.checked = S.agree;
    });
  }
  function validateField(d) {
    var v = (S.values[d.name] || '').trim(), msg = '';
    if (d.required && !v) msg = d.label + 'をご入力ください';
    else if (v && d.kind === 'tel' && !/^[0-9+\-() ]{10,20}$/.test(v)) msg = '半角数字（ハイフン可）でご入力ください';
    else if (v && d.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'メールアドレスの形式をご確認ください';
    forms.forEach(function (form) {
      var c = ctl(form, d.name); if (!c) return;
      var err = c.parentElement.querySelector('[data-dc-if="f.err"]');
      if (err) { show(err, !!msg); setText(err.querySelector('[data-rt="errmsg"]'), msg); }
      c.setAttribute('aria-invalid', msg ? 'true' : 'false'); c.style.borderColor = msg ? '#C42B1C' : '#D3CBBF';
    });
    return !msg;
  }
  function validateAll() {
    var ok = true;
    if (!S.category) ok = false;
    forms.forEach(function (f) { var ce = q(f, '[data-rt="caterr"]'); show(ce, !S.category); if (ce) setText(ce.querySelector('[data-rt="errmsg"]'), S.category ? '' : 'お問い合わせ種別を選択してください'); });
    FIELDS.forEach(function (d) { S.touched[d.name] = true; if (!validateField(d)) ok = false; });
    forms.forEach(function (f) { var ae = q(f, '[data-rt="agreeerr"]'); show(ae, !S.agree); if (ae) setText(ae.querySelector('[role="alert"]'), S.agree ? '' : 'プライバシーポリシーへの同意が必要です'); });
    if (!S.agree) ok = false;
    if (!ok) { var first = document.querySelector('form [aria-invalid="true"], form [data-rt="caterr"]:not([hidden])'); if (first && first.getClientRects().length) first.scrollIntoView({ block: 'center' }); }
    return ok;
  }
  function submit() {
    if (S.sending || !S.agree) { if (!S.agree) validateAll(); return; }
    if (!validateAll()) return;
    S.sending = true; render(); forms.forEach(function (f) { show(q(f, '[data-rt="failed"]'), false); });
    var body = { action: 'contact', category: S.category, website: '' };
    FIELDS.forEach(function (d) { body[d.name] = (S.values[d.name] || '').trim(); });
    forms.forEach(function (f) { var hp = f.querySelector('[name="website"]'); if (hp && hp.value) body.website = hp.value; });
    var p = DEMO ? new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 900); })
                 : fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
    p.then(function (res) {
      S.sending = false; render();
      if (res && res.ok) {
        dataLayer.push({ event: 'contact_complete', contact_category: S.category });
        forms.forEach(function (f) {
          show(f, false);
          var done = f.parentElement.querySelector('[data-rt="done"]'); show(done, true);
          if (done && done.getClientRects().length) { done.style.scrollMarginTop = '120px'; done.scrollIntoView({ block: 'start' }); }
        });
        return;
      }
      fail((res && res.message) || '送信できませんでした。時間をおいて再度お試しください。');
    }).catch(function () { S.sending = false; render(); fail('通信エラーが発生しました。電波状況をご確認のうえ、もう一度お試しください。'); });
  }
  function fail(msg) {
    forms.forEach(function (f) { var el = q(f, '[data-rt="failed"]'); show(el, true); if (el) setText(el.querySelector('[data-rt="msg"]'), msg); if (el && el.getClientRects().length) el.scrollIntoView({ block: 'center' }); });
  }

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    [].slice.call(form.querySelectorAll('[role="radio"]')).forEach(function (b) {
      b.addEventListener('click', function () { S.category = b.textContent.trim(); render(); forms.forEach(function (f) { show(q(f, '[data-rt="caterr"]'), false); }); });
    });
    FIELDS.forEach(function (d) {
      var c = ctl(form, d.name); if (!c) return;
      if (d.max) c.setAttribute('maxlength', d.max);
      if (d.required) c.setAttribute('aria-required', 'true');
      c.addEventListener('input', function () {
        S.values[d.name] = c.value;
        forms.forEach(function (f) { var o = ctl(f, d.name); if (o && o !== c && o.value !== c.value) o.value = c.value; });
        if (S.touched[d.name]) validateField(d);
      });
      c.addEventListener('blur', function () { S.touched[d.name] = true; validateField(d); });
    });
    var ag = q(form, '[data-rt="agree"]');
    if (ag) ag.addEventListener('change', function () { S.agree = ag.checked; render(); if (S.agree) forms.forEach(function (f) { show(q(f, '[data-rt="agreeerr"]'), false); }); });
    var sub = q(form, '[data-rt="submit"]');
    if (sub) sub.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); submit(); }, true);
    var sending = q(form, '[data-rt="sending"]'); if (sending) show(sending, false);
  });
  render();
})();
