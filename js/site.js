(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.style.opacity='1'; en.target.style.transform='none'; io.unobserve(en.target); } }); }, { threshold: 0.1 });
  document.querySelectorAll('[data-fade]').forEach(function(el){ el.style.opacity='0'; el.style.transform='translateY(24px)'; el.style.transition='opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)'; io.observe(el); });
  if (!window.matchMedia('(pointer: coarse)').matches && document.querySelector('[data-plx]')) {
    var st = { tx:0, ty:0, cx:0, cy:0, hover:false };
    document.addEventListener('mousemove', function(e){ st.hover=true; st.tx=(e.clientX/window.innerWidth-.5)*2; st.ty=(e.clientY/window.innerHeight-.5)*2; });
    document.documentElement.addEventListener('mouseleave', function(){ st.hover=false; });
    var tick = function(t){ t=t||0; var gx=st.hover?st.tx:Math.sin(t/2600)*.22, gy=st.hover?st.ty:Math.cos(t/3300)*.18; st.cx+=(gx-st.cx)*.06; st.cy+=(gy-st.cy)*.06; document.querySelectorAll('[data-plx]').forEach(function(l){ var d=parseFloat(l.getAttribute('data-plx'))||0; l.style.translate=(st.cx*d*26).toFixed(2)+'px '+(st.cy*d*18).toFixed(2)+'px'; }); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
})();
