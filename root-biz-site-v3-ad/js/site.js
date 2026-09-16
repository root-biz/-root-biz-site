(function(){
  // accordion (CASE 01-04)
  var toggles = document.querySelectorAll('[data-acc-toggle]');
  toggles.forEach(function(t){
    t.addEventListener('click', function(){
      var key = t.getAttribute('data-acc-toggle');
      var scope = t.closest('.pc-view, .sp-view') || document;
      var panel = scope.querySelector('[data-acc-panel="'+key+'"]');
      var isOpen = panel && panel.style.display !== 'none';
      scope.querySelectorAll('[data-acc-panel]').forEach(function(pn){ pn.style.display = 'none'; });
      scope.querySelectorAll('[data-acc-mark]').forEach(function(mk){ mk.textContent = '+'; });
      if (!isOpen && panel) {
        panel.style.display = 'block';
        var mark = scope.querySelector('[data-acc-mark="'+key+'"]');
        if (mark) mark.textContent = '\u2212';
      }
    });
  });
  // service card hover
  var DIM = 'saturate(.45) brightness(.8)', FULL = 'saturate(1.08) brightness(1)';
  document.querySelectorAll('[data-hover-card]').forEach(function(card){
    var img = card.querySelector('img');
    if (!img) return;
    card.addEventListener('mouseenter', function(){ img.style.filter = FULL; });
    card.addEventListener('mouseleave', function(){ img.style.filter = DIM; });
  });
})();
