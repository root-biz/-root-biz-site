/* Root — /mtg : 空き枠の取得と予約（GAS API） */
(function () {
  'use strict';
  var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxPxy0g9u-2qg0OdASEF7r8l0vuYiJtHp8yNVmL_clRyRwcWgiW8Og_NkH1NVQNWP-0/exec';
  var params = new URLSearchParams(location.search);
  var DEMO = params.get('demo') === '1';
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  window.dataLayer = window.dataLayer || [];

  var FIELDS = {
    company: { label: '会社名', ph: '例：株式会社〇〇', ac: 'organization', max: 100 },
    name: { label: 'お名前', ph: '例：山田 太郎', ac: 'name', max: 60 },
    position: { label: '役職', ph: '例：マーケティング部 部長', ac: 'organization-title', max: 60 },
    tel: { label: '電話番号', ph: '例：03-1234-5678', type: 'tel', ac: 'tel', kind: 'tel', max: 20 },
    email: { label: 'メールアドレス', ph: '例：info@example.co.jp', type: 'email', ac: 'email', kind: 'email', max: 120 },
    detail: { label: 'お悩みごと・事業の共有事項', ph: '例：Web広告の費用対効果を改善したい', multi: true, max: 2000, full: true },
    question: { key: 'detail', label: 'ご質問・共有事項', ph: '例：面談で聞いてみたいこと、ご経歴の補足など', multi: true, max: 2000, full: true },
    school: { label: '学校名', ph: '例：〇〇大学', max: 100 },
    faculty: { label: '学部・学科', ph: '例：経済学部 経済学科', max: 100 },
    grade: { label: '学年', options: ['学部1年', '学部2年', '学部3年', '学部4年', '修士1年', '修士2年', 'その他'] },
    job: { label: 'ご希望の職種', options: ['広告運用コンサルタント', 'ビジネス開発', 'その他・未定'] },
    occupation: { label: '現在のご職業', ph: '例：Web広告代理店 運用担当', max: 100 }
  };
  var BIZ_DESC = 'ご都合のよい日時をお選びください。ご予約確定後、Google Meet の参加URLとサービス概要資料をメールでお送りします。';
  var REC_DESC = 'ご都合のよい日時をお選びください。ご予約確定後、Google Meet の参加URLをメールでお送りします。';
  var TYPES = {
    service: { title: 'サービス概要資料送付＆オンラインMTG調整', desc: BIZ_DESC, fields: ['company', 'name', 'position', 'tel', 'email', 'detail?'], done: 'ご入力のメールアドレス宛に、カレンダー招待と資料をお送りしました。' },
    marketing: { title: 'マーケティング支援 無料相談のご予約', desc: BIZ_DESC, fields: ['company', 'name', 'position', 'tel', 'email', 'detail?'], done: 'ご入力のメールアドレス宛に、カレンダー招待と資料をお送りしました。' },
    hrtech: { title: 'リファラル採用SNS「Root」オンライン相談のご予約', desc: BIZ_DESC, fields: ['company', 'name', 'position', 'tel', 'email', 'detail?'], done: 'ご入力のメールアドレス宛に、カレンダー招待と資料をお送りしました。' },
    diagnosis: { title: '無料「つながり資産」診断 ヒアリングのご予約', desc: 'ご都合のよい日時をお選びください。ご予約確定後、Google Meet の参加URLと資料をメールでお送りします。', fields: ['company', 'name', 'position', 'tel', 'email', 'detail?'], done: 'ご入力のメールアドレス宛に、カレンダー招待と資料をお送りしました。' },
    career: { title: '中途採用　カジュアル面談の日程調整', desc: REC_DESC, recruit: true, fields: ['name', 'tel', 'email', 'job', 'occupation?', 'question?'], done: 'ご入力のメールアドレス宛に、カレンダー招待をお送りしました。' },
    intern: { title: '学生インターンシップ　カジュアル面談の日程調整', desc: REC_DESC, recruit: true, fields: ['name', 'school', 'faculty', 'grade', 'tel', 'email', 'job', 'question?'], done: 'ご入力のメールアドレス宛に、カレンダー招待をお送りしました。' }
  };
  var typeKey = TYPES[params.get('type')] ? params.get('type') : 'service';
  var T = TYPES[typeKey];

  var roots = [].slice.call(document.querySelectorAll('.view-pc, .view-sp')).filter(function (r) { return r.querySelector('[data-rt="grid"]'); });
  if (!roots.length) return;
  function q(root, name) { return root.querySelector('[data-rt="' + name + '"]'); }
  function each(name, fn) { roots.forEach(function (r) { var el = q(r, name); if (el) fn(el, r); }); }
  function tplOf(root, name) { return root.querySelector('template[data-rt-tpl="' + name + '"]').content.firstElementChild; }
  function clone(root, name) { return tplOf(root, name).cloneNode(true); }

  /* ---------- state ---------- */
  var S = { days: {}, weeks: [], wi: 0, step: 1, sel: null, values: {}, touched: {}, submitting: false, loading: true, error: false, notice1: '', notice2: '', result: null };

  /* ---------- dates (ymd handled as UTC so the viewer's timezone never shifts a day) ---------- */
  function ymdToDate(ymd) { var p = ymd.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function dateToYmd(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
  function jp(d) { return (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日（' + WD[d.getUTCDay()] + '）'; }
  function short(d) { return (d.getUTCMonth() + 1) + '/' + d.getUTCDate(); }

  function buildWeeks(days) {
    var ymds = Object.keys(days).sort();
    if (!ymds.length) return [];
    var first = ymdToDate(ymds[0]), last = ymdToDate(ymds[ymds.length - 1]);
    var mon = addDays(first, -((first.getUTCDay() + 6) % 7));
    var weeks = [];
    while (mon <= last) {
      var cols = [];
      for (var i = 0; i < 5; i++) { var d = addDays(mon, i); cols.push({ date: d, ymd: dateToYmd(d), day: days[dateToYmd(d)] || null }); }
      weeks.push(cols);
      mon = addDays(mon, 7);
    }
    return weeks;
  }
  function weekHasOpen(w) { return w.some(function (c) { return c.day && c.day.slots.some(function (s) { return s.ok; }); }); }

  /* ---------- API ---------- */
  function demoDays() {
    var days = {}, d = new Date(); d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var n = 0, k = 1;
    while (n < 20) {
      var dd = addDays(d, k++); var dow = dd.getUTCDay(); if (dow === 0 || dow === 6) continue;
      var ymd = dateToYmd(dd), holiday = n === 6, slots = [];
      for (var m = 600; m < 1200; m += 30) {
        var h = Math.floor(m / 60), mm = m % 60, h2 = Math.floor((m + 30) / 60), mm2 = (m + 30) % 60;
        slots.push({ t: ymdToDate(ymd).getTime() + (m - 540) * 60000, label: h + ':' + (mm ? '30' : '00'), endLabel: h2 + ':' + (mm2 ? '30' : '00'), ok: !holiday && ((n * 7 + m / 30) % 3 !== 0) && n !== 0 });
      }
      days[ymd] = { ymd: ymd, dow: dow, holiday: holiday, slots: slots }; n++;
    }
    return { days: Object.keys(days).map(function (k) { return days[k]; }) };
  }
  function loadAvailability() {
    S.loading = true; S.error = false; render();
    var p = DEMO ? new Promise(function (r) { setTimeout(function () { r(demoDays()); }, 700); })
                 : fetch(GAS_API_URL + '?action=availability', { cache: 'no-store' }).then(function (r) { return r.json(); });
    return p.then(function (res) {
      if (!res || !res.days) throw new Error('no days');
      S.days = {}; res.days.forEach(function (d) { S.days[d.ymd] = d; });
      S.weeks = buildWeeks(S.days);
      var firstOpen = S.weeks.findIndex(weekHasOpen); S.wi = firstOpen >= 0 ? firstOpen : 0;
      S.loading = false; render();
    }).catch(function () { S.loading = false; S.error = true; render(); });
  }
  function postJSON(body) {
    if (DEMO) return new Promise(function (r) { setTimeout(function () { r({ ok: true, dateLabel: '', timeLabel: '', meet: 'https://meet.google.com/demo-link' }); }, 900); });
    return fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }

  /* ---------- render ---------- */
  function setText(el, t) { if (el) el.textContent = t; }
  function show(el, v) {
    if (!el) return;
    if (!el.hasAttribute('data-rt-disp')) el.setAttribute('data-rt-disp', el.style.display || '');
    el.hidden = !v; el.style.display = v ? el.getAttribute('data-rt-disp') : 'none';
  }
  function style(el, props) { Object.keys(props).forEach(function (k) { el.style.setProperty(k, props[k]); }); }

  function renderHero(root) {
    setText(q(root, 'title'), T.title);
    setText(q(root, 'desc'), T.desc);
    show(q(root, 'pill-recruit'), !!T.recruit);
    var steps = q(root, 'steps');
    if (steps) [].slice.call(steps.querySelectorAll('li')).forEach(function (li, i) {
      var n = i + 1, circle = li.querySelector('span > span'), label = circle && circle.nextElementSibling;
      if (n === S.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      if (!circle) return;
      if (n < S.step) { style(circle, { background: '#FBF1E6', 'border-color': '#F2661F', color: '#C94E10' }); if (label) style(label, { color: '#6B6259', 'font-weight': '500' }); }
      else if (n === S.step) { style(circle, { background: '#C94E10', 'border-color': '#C94E10', color: '#FFFFFF' }); if (label) style(label, { color: '#1F1F1F', 'font-weight': '700' }); }
      else { style(circle, { background: '#FFFFFF', 'border-color': '#D3CBBF', color: '#6B6259' }); if (label) style(label, { color: '#6B6259', 'font-weight': '500' }); }
    });
  }

  function renderStep1(root) {
    show(q(root, 'step1'), S.step === 1); show(q(root, 'step2'), S.step === 2); show(q(root, 'step3'), S.step === 3);
    var n1 = q(root, 'notice1'); show(n1, !!S.notice1); if (S.notice1) setText(n1.querySelector('[data-rt="msg"]'), S.notice1);
    show(q(root, 'loading'), S.loading); show(q(root, 'error'), S.error);
    var grid = q(root, 'grid'); grid.hidden = S.loading || S.error;
    var w = S.weeks[S.wi];
    show(q(root, 'weekfull'), !S.loading && !S.error && !!w && !weekHasOpen(w));
    var prev = q(root, 'prev'), next = q(root, 'next');
    [[prev, S.wi <= 0], [next, S.wi >= S.weeks.length - 1]].forEach(function (p) {
      var b = p[0], off = p[1] || S.loading || S.error; if (!b) return;
      b.disabled = off; style(b, { 'border-color': off ? '#D3CBBF' : '#F2661F', color: off ? '#B5ACA2' : '#C94E10', cursor: off ? 'not-allowed' : 'pointer' });
      b.classList.toggle('h0', !off);
    });
    if (w) setText(q(root, 'range'), jp(w[0].date) + '〜 ' + jp(w[4].date));
    [].slice.call(grid.children).forEach(function (c) { if (c.tagName !== 'TEMPLATE') grid.removeChild(c); });
    if (!w) return;
    w.forEach(function (c) {
      var col = clone(root, 'col');
      setText(col.querySelector('[data-rt="d"]'), short(c.date)); setText(col.querySelector('[data-rt="w"]'), '（' + WD[c.date.getUTCDay()] + '）');
      var anyOpen = !!(c.day && c.day.slots.some(function (s) { return s.ok; }));
      col.querySelector('[data-rt="colhead"]').style.borderBottomColor = anyOpen ? '#F2661F' : '#D3CBBF';
      var slotsBox = col.querySelector('[data-rt="slots"]') || col;
      if (!c.day) { if (slotsBox !== col) slotsBox.remove(); col.appendChild(clone(root, 'out')); }
      else if (c.day.holiday) { if (slotsBox !== col) slotsBox.remove(); col.appendChild(clone(root, 'holiday')); }
      else c.day.slots.forEach(function (s) {
        var b = clone(root, s.ok ? 'open' : 'closed');
        b.textContent = s.label;
        b.setAttribute('aria-label', jp(c.date) + ' ' + s.label + (s.ok ? ' 予約できます' : ' 予約できません'));
        if (s.ok) b.addEventListener('click', function () { pick(c, s); });
        slotsBox.appendChild(b);
      });
      grid.appendChild(col);
    });
  }

  function fieldDefs() {
    return T.fields.map(function (k) {
      var opt = /\?$/.test(k); k = k.replace('?', '');
      var d = FIELDS[k]; return Object.assign({ name: d.key || k, id: k, required: !opt }, d);
    });
  }
  var DEFS = fieldDefs();

  function buildFields(root) {
    var box = q(root, 'fields'); if (!box || box.getAttribute('data-rt-built')) return;
    box.setAttribute('data-rt-built', '1');
    var hp = box.querySelector('[data-rt="website"]');
    var sfx = root.classList.contains('view-sp') ? '-sp' : '-pc';
    DEFS.forEach(function (d) {
      var f = clone(root, 'field'), id = 'mtg-' + d.id + sfx;
      var label = f.querySelector('[data-rt="label"]'); label.setAttribute('for', id); label.childNodes[0].nodeValue = d.label + ' ';
      show(f.querySelector('[data-rt="req"]'), d.required); show(f.querySelector('[data-rt="opt"]'), !d.required);
      var input = f.querySelector('[data-rt="input"]'), sw = f.querySelector('[data-rt="selectwrap"]'), mw = f.querySelector('[data-rt="multiwrap"]');
      var ctl;
      if (d.options) {
        input.remove(); mw.remove(); sw.hidden = false; sw.style.display = 'grid'; ctl = sw.querySelector('select');
        ctl.innerHTML = '<option value="">選択してください</option>' + d.options.map(function (o) { return '<option value="' + o + '">' + o + '</option>'; }).join('');
        ctl.addEventListener('change', function () { ctl.style.color = ctl.value ? '#1F1F1F' : '#9A8F84'; });
      } else if (d.multi) {
        input.remove(); sw.remove(); mw.hidden = false; mw.style.display = 'grid'; ctl = mw.querySelector('textarea'); ctl.placeholder = d.ph || '';
        f.style.gridColumn = '1 / -1';
      } else {
        sw.remove(); mw.remove(); ctl = input; ctl.type = d.type || 'text'; ctl.placeholder = d.ph || '';
        if (d.ac) ctl.setAttribute('autocomplete', d.ac); else ctl.removeAttribute('autocomplete');
        if (d.kind === 'tel') ctl.setAttribute('inputmode', 'tel');
      }
      ctl.id = id; ctl.name = d.name; if (d.max) ctl.setAttribute('maxlength', d.max);
      if (d.required) ctl.setAttribute('aria-required', 'true');
      ctl.setAttribute('data-rt-field', d.name);
      if (S.values[d.name]) ctl.value = S.values[d.name];
      ctl.addEventListener('input', function () { S.values[d.name] = ctl.value; syncValue(d.name, ctl.value, root); if (S.touched[d.name]) validateField(d); });
      ctl.addEventListener('change', function () { S.values[d.name] = ctl.value; syncValue(d.name, ctl.value, root); });
      ctl.addEventListener('blur', function () { S.touched[d.name] = true; validateField(d); });
      box.insertBefore(f, hp);
    });
  }
  function syncValue(name, v, from) {
    roots.forEach(function (r) { if (r === from) return; var c = r.querySelector('[data-rt-field="' + name + '"]'); if (c && c.value !== v) c.value = v; });
  }
  function validateField(d) {
    var v = (S.values[d.name] || '').trim(), msg = '';
    if (d.required && !v) msg = d.label + (d.options ? 'を選択してください' : 'をご入力ください');
    else if (v && d.kind === 'tel' && !/^[0-9+\-() ]{10,20}$/.test(v)) msg = '半角数字（ハイフン可）でご入力ください';
    else if (v && d.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'メールアドレスの形式をご確認ください';
    roots.forEach(function (r) {
      var c = r.querySelector('[data-rt-field="' + d.name + '"]'); if (!c) return;
      var f = c.closest('[data-rt="field"]'), err = f.querySelector('[data-rt="err"]');
      err.hidden = !msg; setText(err.querySelector('[data-rt="errmsg"]'), msg);
      c.setAttribute('aria-invalid', msg ? 'true' : 'false'); c.style.borderColor = msg ? '#C42B1C' : '#D3CBBF';
    });
    return !msg;
  }
  function validateAll() {
    var ok = true, first = null;
    DEFS.forEach(function (d) { S.touched[d.name] = true; if (!validateField(d) ) { ok = false; first = first || d; } });
    if (first) { var c = document.querySelector('[data-rt-field="' + first.name + '"]'); roots.forEach(function (r) { var x = r.querySelector('[data-rt-field="' + first.name + '"]'); if (x && x.getClientRects().length) c = x; }); if (c) c.focus(); }
    return ok;
  }

  function renderStep2(root) {
    buildFields(root);
    var n2 = q(root, 'notice2'); show(n2, !!S.notice2); if (S.notice2) setText(n2.querySelector('[data-rt="msg"]'), S.notice2);
    if (S.sel) { var sel = q(root, 'sel'); if (sel) { sel.childNodes[0].nodeValue = jp(S.sel.date) + ' '; setText(q(root, 'sel-time'), S.sel.label + '〜' + S.sel.endLabel); } }
    show(q(root, 'submit'), !S.submitting); show(q(root, 'submitting'), S.submitting);
    var back = q(root, 'back'); if (back) back.disabled = S.submitting;
  }

  function renderStep3(root) {
    if (!S.result) return;
    setText(q(root, 'done-desc'), T.done);
    var dd = q(root, 'done-time'); if (dd) { dd.parentElement.childNodes[0].nodeValue = jp(S.sel.date) + ' '; setText(dd, S.sel.label + '〜' + S.sel.endLabel); }
    var a = q(root, 'meet'); if (a) { var url = S.result.meet || ''; a.href = url || '#'; a.textContent = url || '（参加URLはメールでお送りします）'; a.target = '_blank'; a.rel = 'noopener'; }
  }

  function render() { roots.forEach(function (r) { renderHero(r); renderStep1(r); renderStep2(r); renderStep3(r); }); }

  /* ---------- actions ---------- */
  function goStep(n) {
    S.step = n; render();
    var st = null; roots.forEach(function (r) { var s = q(r, 'steps'); if (s && s.getClientRects().length) st = s; });
    if (st) { st.style.scrollMarginTop = '120px'; st.scrollIntoView({ block: 'start' }); }
  }
  function pick(c, s) {
    S.sel = { t: s.t, date: c.date, label: s.label, endLabel: s.endLabel }; S.notice1 = ''; S.notice2 = '';
    dataLayer.push({ event: 'reservation_start', reservation_type: typeKey });
    goStep(2);
  }
  function submit() {
    if (S.submitting) return;
    if (!validateAll()) return;
    S.notice2 = ''; S.submitting = true; render();
    var body = { action: 'book', type: typeKey, start: S.sel.t, website: '' };
    DEFS.forEach(function (d) { body[d.name] = (S.values[d.name] || '').trim(); });
    var hp = document.querySelector('[data-rt="website"]'); if (hp && hp.value) body.website = hp.value;
    postJSON(body).then(function (res) {
      S.submitting = false;
      if (res && res.ok) {
        S.result = res; dataLayer.push({ event: 'reservation_complete', reservation_type: typeKey });
        goStep(3); return;
      }
      var reason = res && res.reason;
      if (reason === 'taken' || reason === 'invalid') {
        S.notice1 = '申し訳ございません。選択された日時は直前に埋まってしまいました。別の日時をお選びください。';
        S.sel = null; goStep(1); loadAvailability(); return;
      }
      if (reason === 'busy') { S.notice2 = 'ただいま混み合っています。数秒おいてから、もう一度お試しください。'; render(); return; }
      S.notice2 = (res && res.message) || '送信できませんでした。時間をおいて再度お試しください。'; render();
    }).catch(function () {
      S.submitting = false; S.notice2 = '通信エラーが発生しました。電波状況をご確認のうえ、もう一度お試しください。'; render();
    });
  }

  roots.forEach(function (r) {
    var prev = q(r, 'prev'), next = q(r, 'next');
    if (prev) prev.addEventListener('click', function () { if (S.wi > 0) { S.wi--; render(); } });
    if (next) next.addEventListener('click', function () { if (S.wi < S.weeks.length - 1) { S.wi++; render(); } });
    var ch = q(r, 'change'); if (ch) ch.addEventListener('click', function (e) { e.preventDefault(); S.notice2 = ''; goStep(1); });
    var back = q(r, 'back'); if (back) back.addEventListener('click', function () { S.notice2 = ''; goStep(1); });
    var sub = q(r, 'submit'); if (sub) sub.addEventListener('click', submit);
    var fields = q(r, 'fields'); if (fields) fields.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submit(); } });
  });

  document.title = T.title + '｜株式会社Root';
  render();
  loadAvailability();
})();
