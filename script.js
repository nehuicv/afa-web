// Simple hash routing to show/hide pages and set active nav
const pages = document.querySelectorAll('.page');
function showPage(id){
  pages.forEach(p=>p.hidden = (p.id !== id));
  document.querySelectorAll('#main-nav .navlink').forEach(a=>{
    a.classList.toggle('active', a.dataset.target === id);
  });
  window.location.hash = id;
  window.scrollTo({top:0,behavior:'smooth'});
}
function initRouting(){
  const hash = (location.hash||'#home').replace('#','');
  showPage(hash || 'home');
  document.querySelectorAll('#main-nav .navlink').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const t = a.dataset.target;
      showPage(t);
    });
  });
}
initRouting();

// Delegated handler: any element with data-target should navigate via SPA routing
document.addEventListener('click', function(e){
  const el = e.target.closest && e.target.closest('[data-target]');
  if(!el) return;
  if(el.closest && el.closest('#main-nav')) return;
  const target = el.getAttribute('data-target');
  if(!target) return;
  e.preventDefault();
  navigateTo(target);
});

function navigateTo(page){
  showPage(page);
}

// --- Mobile menu toggle (hamburger) ---
(function(){
  const toggleBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  const headerEl = document.querySelector('header');
  if(!toggleBtn || !nav) return;

  const closeMenu = ()=>{
    nav.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded','false');
  };
  const openMenu = ()=>{
    nav.classList.add('open');
    toggleBtn.setAttribute('aria-expanded','true');
  };
  const toggleMenu = ()=>{
    const isOpen = nav.classList.contains('open');
    if(isOpen) closeMenu(); else openMenu();
  };

  toggleBtn.addEventListener('click', e=>{
    e.preventDefault();
    toggleMenu();
  });

  // Cerrar al hacer clic en cualquier enlace del menú
  nav.addEventListener('click', e=>{
    const a = e.target.closest('a');
    if(a){ closeMenu(); }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') closeMenu();
  });

  // Cerrar al cambiar a escritorio
  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 768) closeMenu();
  });

  // Cerrar si se hace clic fuera del header/nav
  document.addEventListener('click', e=>{
    if(!headerEl) return;
    if(!headerEl.contains(e.target)) closeMenu();
  });
})();

// --- i18n helpers ---------------------------------------------------------
const DEFAULT_LANG = 'es';
let currentLang = DEFAULT_LANG;

function getAllTranslations(){
  return window.AFA_TRANSLATIONS || {};
}

function safeParseJSON(value){
  if(!value) return null;
  try { return JSON.parse(value); }
  catch(err){ return null; }
}

function formatTranslation(str, replacements){
  if(typeof str !== 'string') return str;
  if(!replacements || typeof replacements !== 'object') return str;
  return str.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, token)=>{
    const key = token.trim();
    if(Object.prototype.hasOwnProperty.call(replacements, key)){
      const val = replacements[key];
      return val == null ? '' : String(val);
    }
    return '';
  });
}

function translate(key, replacements = {}, lang = currentLang){
  if(!key) return '';
  const resources = getAllTranslations();
  const langMap = resources[lang] || {};
  let value = langMap[key];
  if(value == null){
    const fallbackMap = resources[DEFAULT_LANG] || {};
    value = fallbackMap[key];
  }
  if(value == null) return key;
  return formatTranslation(value, replacements);
}

function updateDynamicMessage(el, key, replacements = {}, mode){
  if(!el) return;
  if(!key){
    el.textContent = '';
    el.removeAttribute('data-i18n');
    delete el.dataset.i18nArgs;
    return;
  }
  el.setAttribute('data-i18n', key);
  if(replacements && Object.keys(replacements).length){
    el.dataset.i18nArgs = JSON.stringify(replacements);
  } else {
    delete el.dataset.i18nArgs;
  }
  const value = translate(key, replacements);
  if(mode === 'html'){
    el.innerHTML = value;
  } else {
    el.textContent = value;
  }
}

function applyTranslations(lang){
  currentLang = lang || DEFAULT_LANG;

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    if(!key) return;
    const replacements = safeParseJSON(el.dataset.i18nArgs) || {};
    const value = translate(key, replacements, currentLang);
    if(el.dataset.i18nMode === 'html'){
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.dataset.i18nPlaceholder;
    if(!key) return;
    el.placeholder = translate(key, {}, currentLang);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(el=>{
    const raw = el.dataset.i18nAttr;
    if(!raw) return;
    let attrMap = safeParseJSON(raw);
    if(!attrMap && raw.includes(':')){
      attrMap = {};
      raw.split(';').forEach(part=>{
        const [attrKey, attrValue] = part.split(':').map(s=>s && s.trim());
        if(attrKey && attrValue){
          attrMap[attrKey] = attrValue;
        }
      });
    }
    if(!attrMap) return;
    const replacements = safeParseJSON(el.dataset.i18nArgs) || {};
    Object.entries(attrMap).forEach(([attrName, key])=>{
      const value = translate(key, replacements, currentLang);
      if(attrName === 'innerHTML'){
        el.innerHTML = value;
      } else if(attrName === 'textContent'){
        el.textContent = value;
      } else {
        el.setAttribute(attrName, value);
      }
    });
  });

  document.querySelectorAll('select option[data-i18n]').forEach(opt=>{
    const key = opt.dataset.i18n;
    if(key) opt.textContent = translate(key, {}, currentLang);
  });

  document.querySelectorAll('[data-i18n-select]').forEach(sel=>{
    const key = sel.dataset.i18nSelect;
    if(key) sel.setAttribute('aria-label', translate(key, {}, currentLang));
  });

  updateLangUI(currentLang);
  document.documentElement.lang = currentLang;
  localStorage.setItem('afa-lang', currentLang);
  if(document && document.title !== undefined){
    document.title = translate('meta.title', {}, currentLang);
  }

  refreshDynamicTranslations();
}

function refreshDynamicTranslations(){
  const label = document.getElementById('timeline-label-5y');
  if(label && label.dataset.i18n){
    const replacements = safeParseJSON(label.dataset.i18nArgs) || {};
    label.textContent = translate(label.dataset.i18n, replacements, currentLang);
  }

  document.querySelectorAll('.member').forEach(card=>{
    const details = card.querySelector('.details');
    const btn = card.querySelector('.view-profile');
    if(!details || !btn) return;
    const key = details.hidden ? 'equipo.view_profile' : 'equipo.hide_profile';
    btn.textContent = translate(key, {}, currentLang);
  });
}

// News carousel
let newsIndex = 0;
const track = document.getElementById('news-track');
function updateCarousel(){
  track.style.transform = `translateX(-${newsIndex * 100}%)`;
}
function nextNews(){ newsIndex = (newsIndex+1) % 3; updateCarousel(); }
function prevNews(){ newsIndex = (newsIndex+2) % 3; updateCarousel(); }
// auto rotate
// intervals (milliseconds)
const NEWS_INTERVAL = 10000; // news carousel rotate interval (10s)
const HERO_INTERVAL = 9000;  // hero slider rotate interval (9s)

// auto rotate
setInterval(()=>{ nextNews(); }, NEWS_INTERVAL);

// Hero slider (image.png and foto.png)
let heroIndex = 0;
const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
function updateHero(){
  heroSlides.forEach((s,i)=> s.classList.toggle('active', i === heroIndex));
}
function nextHero(){ if(heroSlides.length === 0) return; heroIndex = (heroIndex+1) % heroSlides.length; updateHero(); }
function prevHero(){ if(heroSlides.length === 0) return; heroIndex = (heroIndex-1 + heroSlides.length) % heroSlides.length; updateHero(); }
// init hero state and auto-rotate every 6s
// init hero state and auto-rotate using HERO_INTERVAL
if(heroSlides.length){ updateHero(); setInterval(()=>{ nextHero(); }, HERO_INTERVAL); }

// indicators (dynamic)
;(function(){
  const container = document.getElementById('hero-indicators');
  if(!container || heroSlides.length === 0) return;
  container.innerHTML = '';
  const dots = [];
  for(let i=0;i<heroSlides.length;i++){
    const btn = document.createElement('button');
    btn.className = 'hero-dot';
    btn.dataset.index = String(i);
    btn.dataset.i18nAttr = JSON.stringify({"aria-label":"hero.slider.dot"});
    btn.dataset.i18nArgs = JSON.stringify({index: i+1});
    btn.addEventListener('click', ()=>{ heroIndex = i; updateHero(); });
    container.appendChild(btn);
    dots.push(btn);
  }
  function updateDots(){ dots.forEach((d,i)=> d.classList.toggle('active', i === heroIndex)); }
  // wrap updateHero to also update dots
  const baseUpdate = updateHero;
  updateHero = function(){ baseUpdate(); updateDots(); };
  // initial state
  updateDots();
})();

// Blog: open planificacioesportiva.jpg when clicking the Planificación Deportiva card
(function(){
  const card = document.getElementById('card-planificacion-deportiva');
  if(!card) return;
  const inner = document.getElementById('card-planificacion-deportiva-inner');
  const openImageInTab = ()=>{
    const imgSrc = 'planificacioesportiva.jpg';
    window.open(imgSrc, '_blank');
  };
  inner.addEventListener('click', openImageInTab);
  inner.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openImageInTab(); } });
})();

// ripple effect for clickable cards
(function(){
  const cards = document.querySelectorAll('.card.clickable');
  cards.forEach(card=>{
    card.addEventListener('click', function(e){
      const rect = card.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      card.appendChild(ripple);
      setTimeout(()=> ripple.remove(), 600);
    });
  });
})();

// touch / swipe support
;(function(){
  const slider = document.getElementById('hero-slider');
  if(!slider) return;
  let startX = 0, deltaX = 0, touching = false;
  slider.addEventListener('touchstart', e=>{
    touching = true; startX = e.touches[0].clientX; deltaX = 0; pauseHeroAuto();
  }, {passive:true});
  slider.addEventListener('touchmove', e=>{
    if(!touching) return; deltaX = e.touches[0].clientX - startX;
  }, {passive:true});
  slider.addEventListener('touchend', ()=>{
    touching = false; if(Math.abs(deltaX) > 40){ if(deltaX < 0) nextHero(); else prevHero(); } resumeHeroAuto();
  });
})();

// auto-rotate control (pause on hover and when interacting)
let heroAutoTimer = null;
function startHeroAuto(){ if(heroAutoTimer) clearInterval(heroAutoTimer); heroAutoTimer = setInterval(()=> nextHero(), HERO_INTERVAL); }
function pauseHeroAuto(){ if(heroAutoTimer) clearInterval(heroAutoTimer); heroAutoTimer = null; }
function resumeHeroAuto(){ if(!heroAutoTimer) startHeroAuto(); }
// wire hover
(function(){
  const container = document.querySelector('.hero-image');
  if(!container) return;
  container.addEventListener('mouseenter', pauseHeroAuto);
  container.addEventListener('mouseleave', resumeHeroAuto);
  // start auto if not running
  startHeroAuto();
})();

// keyboard navigation
document.addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft') prevHero();
  if(e.key === 'ArrowRight') nextHero();
});

// Gallery click to open image in new tab (simple modal could be added)
// Instalaciones gallery -> open modal viewer
(function(){
  const gallery = document.getElementById('inst-gallery') || document.getElementById('gallery');
  if(!gallery) return;
  const images = Array.from(gallery.querySelectorAll('img'));

  // Helper: openImageModal(imagesArray, startIndex)
  // imagesArray: [{src, caption}, ...]
  window.openImageModal = function(imagesArray, startIndex){
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const btnClose = document.getElementById('modal-close');
    const btnPrev = document.getElementById('modal-prev');
    const btnNext = document.getElementById('modal-next');
    if(!modal || !modalImg) return;

    let current = Math.max(0, Math.min(imagesArray.length-1, startIndex || 0));

    function show(i){
      const item = imagesArray[i];
      if(!item) return;
      current = i;
      modalImg.src = item.src;
      modalImg.alt = item.caption || '';
      modalCaption.textContent = item.caption || '';
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      btnClose?.focus();
    }

    function close(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; modalImg.src = ''; }
    function next(){ show((current+1) % imagesArray.length); }
    function prev(){ show((current-1 + imagesArray.length) % imagesArray.length); }

    // attach handlers
    btnPrev && btnPrev.addEventListener('click', prev);
    btnNext && btnNext.addEventListener('click', next);
    btnClose && btnClose.addEventListener('click', close);

    const onKey = e=>{
      if(modal.getAttribute('aria-hidden') === 'false'){
        if(e.key === 'Escape') close();
        if(e.key === 'ArrowRight') next();
        if(e.key === 'ArrowLeft') prev();
      }
    };

    document.addEventListener('keydown', onKey);

    // focus trap
    function getFocusable(el){
      return Array.from(el.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'))
        .filter(e=>e.offsetParent !== null);
    }

    const onTab = e=>{
      if(modal.getAttribute('aria-hidden') === 'false' && e.key === 'Tab'){
        const focusables = getFocusable(modal);
        if(focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length -1];
        if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
        else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
      }
    };

    document.addEventListener('keydown', onTab);

    const onClickOutside = e=>{ if(e.target === modal) close(); };
    modal.addEventListener('click', onClickOutside);

    // cleanup observer: when modal hidden remove listeners
    const obs = new MutationObserver(()=>{
      if(modal.getAttribute('aria-hidden') === 'true'){
        btnPrev && btnPrev.removeEventListener('click', prev);
        btnNext && btnNext.removeEventListener('click', next);
        btnClose && btnClose.removeEventListener('click', close);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keydown', onTab);
        modal.removeEventListener('click', onClickOutside);
        obs.disconnect();
      }
    });
    obs.observe(modal, {attributes:true, attributeFilter:['aria-hidden']});

    // show initial
    show(current);
  };

  // wire gallery thumbnails to open the modal using the helper
  images.forEach((img,i)=> img.addEventListener('click', e=>{
    e.preventDefault();
    const arr = images.map(im=> ({src: im.src, caption: im.dataset.caption || im.alt || ''}));
    window.openImageModal(arr, i);
  }));

})();

// Accordion behaviour for instalaciones
(function(){
  const accordions = document.querySelectorAll('.accordion');
  if(!accordions || accordions.length === 0) return;
  accordions.forEach(container=>{
    const buttons = container.querySelectorAll('.accordion-button');
    buttons.forEach(btn=>{
      const panelId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      if(!panel) return;

      // Ensure consistent initial state
      panel.hidden = panel.hidden === false ? false : true;
      panel.setAttribute('aria-expanded', 'false');

      const closePanel = () => {
        btn.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-expanded', 'false');
        btn.classList.remove('open');
        // smooth measured height collapse
        const startH = panel.scrollHeight;
        panel.style.height = startH + 'px';
        // force layout
        void panel.offsetHeight;
        panel.style.transition = 'height 420ms cubic-bezier(.2,.9,.2,1), padding 360ms ease';
        panel.style.height = '0px';
        panel.style.paddingTop = '0px';
        panel.style.paddingBottom = '0px';
        setTimeout(()=>{
          panel.hidden = true;
          panel.style.height = '';
          panel.style.transition = '';
          panel.style.paddingTop = '';
          panel.style.paddingBottom = '';
        }, 440);
      };

      const openPanel = () => {
        // close siblings (single-open behaviour)
        buttons.forEach(other=>{
          const otherPanel = document.getElementById(other.getAttribute('aria-controls'));
          if(other !== btn && otherPanel){
            other.setAttribute('aria-expanded','false');
            otherPanel.setAttribute('aria-expanded','false');
            setTimeout(()=> otherPanel.hidden = true, 380);
          }
        });

        // measured expand: unhide, set height from 0 to scrollHeight
        panel.hidden = false; // unhide before animation
        panel.style.height = '0px';
        // ensure padding restored when opening
        panel.style.paddingTop = '';
        panel.style.paddingBottom = '';
        // allow next frame to measure
        requestAnimationFrame(()=>{
          const targetH = panel.scrollHeight;
          panel.style.transition = 'height 420ms cubic-bezier(.2,.9,.2,1), padding 360ms ease';
          panel.style.height = targetH + 'px';
          btn.setAttribute('aria-expanded','true');
          panel.setAttribute('aria-expanded','true');
          btn.classList.add('open');
          // after animation, clear explicit height to allow responsive changes
          setTimeout(()=>{
            panel.style.height = '';
            panel.style.transition = '';
          }, 450);
        });
        panel.focus && panel.focus();
      };

      const toggle = () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if(isOpen) closePanel(); else openPanel();
      };

      btn.addEventListener('click', ()=> toggle());
      btn.addEventListener('keydown', e=>{
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
        // arrow navigation between accordion headers
        if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){
          e.preventDefault(); const next = btn.parentElement.nextElementSibling?.querySelector('.accordion-button'); next && next.focus();
        }
        if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){
          e.preventDefault(); const prev = btn.parentElement.previousElementSibling?.querySelector('.accordion-button'); prev && prev.focus();
        }
      });
    });
  });
})();

// Forms
document.getElementById('apply-form').addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const nombre = (fd.get('nombre') || '').toString().trim();
  const edad = (fd.get('edad') || '').toString().trim();
  const correo = (fd.get('email') || '').toString().trim();
  const categoriaRaw = (fd.get('categoria') || 'U16').toString();
  const categoryKey = categoriaRaw === 'Femenino-U18' ? 'cat.FU18' : categoriaRaw === 'U18' ? 'cat.U18' : 'cat.U16';
  const categoryLabel = translate(categoryKey);
  const applyResult = document.getElementById('apply-result');
  updateDynamicMessage(applyResult, 'form.apply_confirmation', {
    name: nombre,
    age: edad,
    email: correo,
    category: categoryLabel
  });
  e.target.reset();
});
function saveDraft(){
  const f = document.getElementById('apply-form');
  const data = {nombre:f.nombre.value,edad:f.edad.value,email:f.email.value,categoria:f.categoria.value,mensaje:f.mensaje.value};
  localStorage.setItem('afa-draft',JSON.stringify(data));
  alert(translate('form.draft_saved'));
}
// load draft if exists
try{const draft=JSON.parse(localStorage.getItem('afa-draft')||'null'); if(draft){const f=document.getElementById('apply-form'); f.nombre.value=draft.nombre||''; f.edad.value=draft.edad||''; f.email.value=draft.email||''; f.categoria.value=draft.categoria||'U16'; f.mensaje.value=draft.mensaje||''; }}catch(e){}

document.getElementById('contact-form').addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const contactResult = document.getElementById('contact-result');
  updateDynamicMessage(contactResult, 'form.contact_confirmation', {
    name: (fd.get('name') || '').toString().trim(),
    email: (fd.get('email') || '').toString().trim()
  });
  e.target.reset();
});

/* language init moved down so DOM nodes used by updateLangUI exist */

// language dropdown (interactive)
const langDropdown = document.getElementById('lang-dropdown');
const langToggle = document.getElementById('lang-toggle');
const langMenu = document.getElementById('lang-menu');
const langLabel = document.getElementById('lang-label');

const langMeta = {
  es:{label:'Español', flag:'🇪🇸'},
  ca:{label:'Català', flag:'🇦🇩'},
  fr:{label:'Français', flag:'🇫🇷'},
  en:{label:'English', flag:'🇬🇧'}
};

function updateLangUI(lang){
  const meta = langMeta[lang] || langMeta['es'];
  if(langLabel) langLabel.textContent = meta.label;
  if(langToggle){
    // Provide tooltip and accessible label; button shows only text
    langToggle.setAttribute('title', meta.label);
    langToggle.setAttribute('aria-label', meta.label);
  }
  // mark active in menu
  if(langMenu){
    Array.from(langMenu.children).forEach(li=>{
      li.classList.toggle('active', li.dataset.lang === lang);
    });
  }
}

// UI state will be initialized by applyTranslations called earlier

// toggle menu
if(langToggle && langMenu){
  langToggle.addEventListener('click', ()=>{
    const open = langDropdown.classList.toggle('open');
    langToggle.setAttribute('aria-expanded', open? 'true':'false');
  });

  // click selection
  langMenu.addEventListener('click', e=>{
    const li = e.target.closest('li[data-lang]');
    if(!li) return;
    const chosen = li.dataset.lang;
    applyTranslations(chosen);
    updateLangUI(chosen);
    langDropdown.classList.remove('open');
    langToggle.setAttribute('aria-expanded','false');
  });

  // close on outside click
  document.addEventListener('click', e=>{
    if(!langDropdown.contains(e.target)){
      langDropdown.classList.remove('open');
      if(langToggle) langToggle.setAttribute('aria-expanded','false');
    }
  });

  // keyboard navigation (Esc closes)
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){
      langDropdown.classList.remove('open');
      if(langToggle) langToggle.setAttribute('aria-expanded','false');
    }
  });
}

// Now initialize translations (DOM and handlers ready)
(function(){
  const saved = localStorage.getItem('afa-lang');
  const browser = (navigator.language||navigator.userLanguage||'es').slice(0,2);
  const lang = saved || (['es','ca','fr','en'].includes(browser)?browser:'es');
  applyTranslations(lang);
})();

// --- NEW: category selector handler ---
(function(){
  const buttons = document.querySelectorAll('.select-category');
  if(!buttons || buttons.length === 0) return;
  buttons.forEach(b=>{
    b.addEventListener('click', e=>{
      const cat = b.dataset.cat;
      // navigate to admissions page
      navigateTo('admisiones');
      // set category select when admissions form is available
      const setCategory = ()=>{
        const form = document.getElementById('apply-form');
        if(!form) return;
        const sel = form.querySelector('select[name="categoria"]');
        if(sel){
          sel.value = cat;
        }
        const nameInput = form.querySelector('input[name="nombre"]');
        if(nameInput) nameInput.focus();
      };
      // if form is in DOM and visible, set immediately, else wait a short time for routing
      setTimeout(setCategory, 120);
    });
  });
})();

// --- Program card interactivity: timeline animation and scholarship toggle ---
(function(){
  const timeline = document.querySelector('.program-card .timeline-progress');
  const toggle = document.getElementById('scholarship-toggle');
  const details = document.getElementById('scholarship-details');
  const applyBtn = document.getElementById('program-apply-btn');

  // Top card controls
  const scholarshipTop = document.getElementById('scholarship-toggle-top');
  const detailsTop = document.getElementById('scholarship-details-top');
  const applyTop = document.getElementById('program-apply-btn-top');

  if(timeline){
    // simple animation: grow to 20% (year1), 60% (year3), 100% (year5) when visible
    const steps = [20, 60, 100];
    let current = 0;
    const animateTo = pct => {
      timeline.style.width = pct + '%';
      timeline.setAttribute('aria-valuenow', String(pct));
    };

    const observer = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          // stagger through steps
          animateTo(steps[0]);
          setTimeout(()=> animateTo(steps[1]), 800);
          setTimeout(()=> animateTo(steps[2]), 1700);
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.3});
    observer.observe(timeline.closest('.program-card'));
  }

  if(toggle && details){
    toggle.addEventListener('click', ()=>{
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open? 'false' : 'true');
      if(open){ details.hidden = true; } else { details.hidden = false; details.classList.add('visible'); }
    });
  }

  if(scholarshipTop && detailsTop){
    scholarshipTop.addEventListener('click', ()=>{
      const open = scholarshipTop.getAttribute('aria-expanded') === 'true';
      scholarshipTop.setAttribute('aria-expanded', open? 'false' : 'true');
      detailsTop.hidden = open;
      if(!open) detailsTop.classList.add('visible');
    });
  }

  if(applyBtn){
    applyBtn.addEventListener('click', e=>{
      e.preventDefault();
      navigateTo('admisiones');
      setTimeout(()=>{ const sel = document.querySelector('#apply-form select[name="categoria"]'); if(sel) sel.value = 'U16'; const nameInput = document.querySelector('#apply-form input[name="nombre"]'); nameInput && nameInput.focus(); }, 150);
    });
  }

  if(applyTop){
    applyTop.addEventListener('click', e=>{
      e.preventDefault();
      navigateTo('admisiones');
      setTimeout(()=>{ const sel = document.querySelector('#apply-form select[name="categoria"]'); if(sel) sel.value = 'U16'; const nameInput = document.querySelector('#apply-form input[name="nombre"]'); nameInput && nameInput.focus(); }, 150);
    });
  }

  // Interactive 5-year timeline: draggable handle, snap to 1..5, endpoints green
  (function(){
    const bar = document.getElementById('timeline-bar-5y');
    const progress = document.getElementById('timeline-progress-5y');
    const handle = document.getElementById('timeline-handle-5y');
    const label = document.getElementById('timeline-label-5y');
    if(!bar || !progress || !handle || !label) return;

    const YEARS = 5;
    const endpointValues = {1:54, 2:72, 3:90, 4:126, 5:144};

    // Create mobile chips under the slider (without removing the slider)
    let chips = [];
    (function createChips(){
      const wrapper = document.querySelector('#price-timeline-5y .timeline-wrapper');
      if(!wrapper) return;
      if(document.getElementById('timeline-chips-5y')) return; // already created
      const chipsWrap = document.createElement('div');
      chipsWrap.id = 'timeline-chips-5y';
      chipsWrap.className = 'timeline-chips';
      for(let y=1; y<=YEARS; y++){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'timeline-chip';
        btn.dataset.year = String(y);
        btn.setAttribute('aria-pressed','false');
        // Show just the year number; label below already shows players
        btn.textContent = String(y);
        btn.addEventListener('click', ()=> setYear(y));
        chipsWrap.appendChild(btn);
        chips.push(btn);
      }
      wrapper.insertAdjacentElement('afterend', chipsWrap);
    })();

    // helper: set position based on year (1..5)
    function setYear(year, opts){
      year = Math.max(1, Math.min(YEARS, Math.round(year)));
      const pct = ( (year-1) / (YEARS-1) ) * 100;
      progress.style.width = pct + '%';
      const barRect = bar.getBoundingClientRect();
      const x = barRect.left + (pct/100) * barRect.width;
      // position handle center
      handle.style.left = `calc(${pct}% )`;
      bar.setAttribute('aria-valuenow', String(year));
      // update label
      // show exact values for specified years
      const val = endpointValues[year] || Math.round(endpointValues[1] + ( (year-1)/(YEARS-1) ) * (endpointValues[5]-endpointValues[1] ));
      const replacements = {year: String(year), players: String(val)};
      label.dataset.i18nArgs = JSON.stringify(replacements);
      label.textContent = translate('programas.plan.label', replacements);
      // highlight the corresponding value box
      document.querySelectorAll('.timeline-value').forEach(n=> n.classList.toggle('active', Number(n.dataset.year) === Number(year)));
      // update chips active state
      if(chips && chips.length){
        chips.forEach((c,i)=>{
          const active = (i+1) === year;
          c.classList.toggle('active', active);
          c.setAttribute('aria-pressed', active? 'true':'false');
        });
      }
      // green when at endpoints (1 or 5)
      if(year === 1 || year === YEARS){ bar.classList.add('green'); } else { bar.classList.remove('green'); }
      if(!opts || !opts.silent){
        // small aria update
        progress.setAttribute('aria-valuenow', String(Math.round((pct))))
      }
    }

    // initialize at year 1 (≈54)
    setYear(1, {silent:true});

    // clicking a value box selects the year
    document.querySelectorAll('.timeline-value').forEach(n=>{
      n.addEventListener('click', e=>{
        const y = Number(n.dataset.year);
        if(!isNaN(y)) setYear(y);
      });
    });

    // dragging
    let dragging = false;
    function calcYearFromClientX(clientX){
      const rect = bar.getBoundingClientRect();
      let rel = (clientX - rect.left) / rect.width;
      rel = Math.max(0, Math.min(1, rel));
      const exactYear = 1 + rel * (YEARS-1);
      return exactYear;
    }

    function onPointerDown(e){
      e.preventDefault();
      dragging = true; bar.classList.add('dragging');
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp, {once:true});
    }
    function onPointerMove(e){
      if(!dragging) return;
      const yearFloat = calcYearFromClientX(e.clientX);
      // update progressive position without snapping
      const pct = ((yearFloat-1)/(YEARS-1)) * 100;
      progress.style.width = pct + '%';
      handle.style.left = `calc(${pct}% )`;
  // live label update (rounded year) and highlight box
    const r = Math.round(yearFloat);
    const liveVal = endpointValues[r] || Math.round(endpointValues[1] + ( (r-1)/(YEARS-1) ) * (endpointValues[5]-endpointValues[1]));
    const replacements = {year: String(r), players: String(liveVal)};
    label.dataset.i18nArgs = JSON.stringify(replacements);
    label.textContent = translate('programas.plan.label', replacements);
  document.querySelectorAll('.timeline-value').forEach(n=> n.classList.toggle('active', Number(n.dataset.year) === Number(r)));
  if(r === 1 || r === YEARS) bar.classList.add('green'); else bar.classList.remove('green');
    }
    function onPointerUp(e){
      dragging = false; bar.classList.remove('dragging');
      document.removeEventListener('pointermove', onPointerMove);
      // snap to nearest year
      const yearFloat = calcYearFromClientX(e.clientX || e.changedTouches && e.changedTouches[0].clientX);
      const snapped = Math.round(yearFloat);
      setYear(snapped);
    }

    handle.addEventListener('pointerdown', onPointerDown);
    bar.addEventListener('pointerdown', function(e){
      // jump to clicked position and start dragging
      const yearFloat = calcYearFromClientX(e.clientX);
      const snapped = Math.round(yearFloat);
      setYear(snapped);
      // begin dragging so user can continue moving
      onPointerDown(e);
    });

    // keyboard support: left/right to move between years
    bar.addEventListener('keydown', e=>{
      const cur = Number(bar.getAttribute('aria-valuenow') || '1');
      if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){
        e.preventDefault(); setYear(Math.max(1, cur-1));
      }
      if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){
        e.preventDefault(); setYear(Math.min(YEARS, cur+1));
      }
      if(e.key === 'Home'){ e.preventDefault(); setYear(1); }
      if(e.key === 'End'){ e.preventDefault(); setYear(YEARS); }
    });

    // make handle focusable and forward key events to bar
    handle.addEventListener('keydown', e=>{ bar.dispatchEvent(new KeyboardEvent('keydown', e)); });

    // ensure handle positions after resize, keep active chip
    window.addEventListener('resize', ()=>{ const cur = Number(bar.getAttribute('aria-valuenow')||'1'); setYear(cur,{silent:true}); });

  })();

})();

// --- NEW: reveal on scroll for elements with .reveal ---
(function(){
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if(!reveals.length) return;

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el = entry.target;
        // add visible class with small stagger based on dataset or index
        const delay = Number(el.dataset.revealDelay) || 0;
        setTimeout(()=> el.classList.add('visible'), delay);
        observer.unobserve(el);
      }
    });
  }, {threshold: 0.12});

  // stagger slightly
  reveals.forEach((r,i)=>{
    r.dataset.revealDelay = String(i * 80);
    observer.observe(r);
  });
})();

// --- NEW: team profile toggle (Ver perfil) ---
(function(){
  document.querySelectorAll('.view-profile').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const card = btn.closest('.member');
      if(!card) return;
      const details = card.querySelector('.details');
      if(!details) return;
      const open = details.hidden;
      details.hidden = !open;
      btn.textContent = translate(details.hidden ? 'equipo.view_profile' : 'equipo.hide_profile');
    });
  });
})();

// --- NEW: staff CV form handler ---
(function(){
  const form = document.getElementById('staff-form');
  const result = document.getElementById('staff-result');
  if(!form) return;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    updateDynamicMessage(result);
    const fd = new FormData(form);
    const nombre = fd.get('nombre')||'';
    const email = fd.get('email')||'';
    // basic validation
    if(!nombre.trim() || !email.toString().includes('@')){
      updateDynamicMessage(result, 'staff.error');
      return;
    }

    // simulate upload and processing with progress
    updateDynamicMessage(result, 'staff.uploading');
    // simple progress simulation
    const simulate = ms => new Promise(r=> setTimeout(r, ms));
    await simulate(800);
    updateDynamicMessage(result, 'staff.analyzing');
    await simulate(900);
    // show success message
    updateDynamicMessage(result, 'staff.success', {name: nombre.toString().trim()});
    form.reset();
  });
})();

// --- NEW: Planos viewer in blog - integrate with #img-modal ---
(function(){
  const post = document.getElementById('post-planos');
  if(!post) return;

  const mainImg = document.getElementById('plan-main-img');
  const mainCaption = document.getElementById('plan-main-caption');
  const thumbs = Array.from(post.querySelectorAll('.thumb'));
  const btnOpen = document.getElementById('open-plan-modal');

  if(!mainImg || !thumbs.length || !window.openImageModal) return;

  // update main image on thumbnail click
  thumbs.forEach((t)=>{
    t.addEventListener('click', e=>{ e.preventDefault(); const src = t.dataset.src; const caption = t.dataset.caption || ''; if(src){ mainImg.src = src; mainCaption.textContent = caption; } });
  });

  // prepare images array
  const images = thumbs.map(t=> ({src: t.dataset.src, caption: t.dataset.caption || ''}));

  // no modal open: keep only thumbnail -> main image behavior

})();
