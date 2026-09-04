(function(){
  var form = document.getElementById('contact-form'); if (!form) return;
  var type = 'サービス導入・協業';
  var chips = form.querySelectorAll('.type-chip');
  chips.forEach(function(b){ b.addEventListener('click', function(){ chips.forEach(function(x){ x.classList.remove('is-active'); }); b.classList.add('is-active'); type = b.getAttribute('data-type'); hideErr(); }); });
  if (window.location.hash === '#recruit') { chips.forEach(function(b){ if (b.getAttribute('data-type') === '採用への応募') b.click(); }); }
  var err = document.getElementById('form-err');
  function hideErr(){ err.hidden = true; }
  form.addEventListener('input', hideErr);
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v = function(n){ return (form.elements[n].value || '').trim(); };
    if (!v('name') || !v('email') || !v('msg')) { err.hidden = false; return; }
    // --- GA4 / GTM 計測イベント ---
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'contact_submit',
      contact_type: type,
      has_company: v('company') ? 'yes' : 'no'
    });

    var subject = '【' + type + '】お問い合わせ（' + v('name') + '）';
    var body = '株式会社Root コーポレートサイトのお問い合わせフォームより\n\n■ 種別\n' + type + '\n\n■ 会社名\n' + (v('company') || '—') + '\n\n■ お名前\n' + v('name') + '\n\n■ メールアドレス\n' + v('email') + '\n\n■ 内容\n' + v('msg') + '\n';
    window.location.href = 'mailto:info@root-biz.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
