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
// init
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

// News carousel
let newsIndex = 0;
const track = document.getElementById('news-track');
function updateCarousel(){
  track.style.transform = `translateX(-${newsIndex * 100}%)`;
}
function nextNews(){ newsIndex = (newsIndex+1) % 3; updateCarousel(); }
function prevNews(){ newsIndex = (newsIndex+2) % 3; updateCarousel(); }
// auto rotate (10s)
setInterval(()=>{ nextNews(); },10000);

// Gallery click to open image in new tab (simple modal could be added)
document.getElementById('gallery').addEventListener('click', e=>{
  if(e.target.tagName === 'IMG') window.open(e.target.src, '_blank');
});

// Forms
document.getElementById('apply-form').addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  // For demo: show summary
  const out = `Solicitud enviada: ${fd.get('nombre')} — ${fd.get('edad')} años — ${fd.get('email')} (categoría: ${fd.get('categoria')})`;
  document.getElementById('apply-result').textContent = out;
  e.target.reset();
});
function saveDraft(){
  const f = document.getElementById('apply-form');
  const data = {nombre:f.nombre.value,edad:f.edad.value,email:f.email.value,categoria:f.categoria.value,mensaje:f.mensaje.value};
  localStorage.setItem('afa-draft',JSON.stringify(data));
  alert('Borrador guardado en el navegador');
}
// load draft if exists
try{const draft=JSON.parse(localStorage.getItem('afa-draft')||'null'); if(draft){const f=document.getElementById('apply-form'); f.nombre.value=draft.nombre||''; f.edad.value=draft.edad||''; f.email.value=draft.email||''; f.categoria.value=draft.categoria||'U16'; f.mensaje.value=draft.mensaje||''; }}catch(e){}

document.getElementById('contact-form').addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  document.getElementById('contact-result').textContent = `Mensaje recibido: ${fd.get('name')} — Nos pondremos en contacto al ${fd.get('email')}`;
  e.target.reset();
});

// --- i18n: simple client-side translations ---
const translations = {
  es: {
  'nav.home':'Inicio','nav.la_academia':'La Academia','nav.modelo':'Modelo Formativo','nav.programas':'Programa','nav.instalaciones':'Instalaciones','nav.equipo':'Nuestro Equipo','nav.admisiones':'Admisiones','nav.contacto':'Contacto','nav.blog':'Blog','nav.apply':'Aplica ahora',
  'hero.title':'Forjando el futuro del fútbol en el corazón de los Pirineos',
  'hero.subtitle':'Aran Football Academy — Bossòst, Vall d\'Aran. Formación deportiva, académica y humana en un entorno natural único. Competición en la FFF y proyección internacional.',
  'hero.discover':'Descubre nuestro programa','hero.apply':'Aplica ahora',
    'news.title':'Últimas noticias','testimonials.title':'Testimonios','contact.quick':'Contacto rápido',
  'la_academia.title':'La Academia','modelo.title':'Modelo Formativo','programas.title':'Programa','instalaciones.title':'Instalaciones','equipo.title':'Nuestro Equipo','admisiones.title':'Admisiones','contacto.title':'Contacto','contacto.data':'Datos','contacto.map':'Mapa','contacto.form':'Formulario de contacto','blog.title':'Blog / Noticias'
  },
  ca: {
    'nav.home':'Inici','nav.la_academia':'L\'Acadèmia','nav.modelo':'Model Formatiu','nav.programas':'Programes','nav.instalaciones':'Instal·lacions','nav.equipo':'El Nostre Equip','nav.admisiones':'Admissions','nav.contacto':'Contacte','nav.blog':'Blog','nav.apply':'Aplica ara',
    'hero.title':'Forjant el futur del futbol al cor dels Pirineus',
    'hero.subtitle':'Aran Football Academy — Bossòst, Vall d\'Aran. Formació esportiva, acadèmia i humana en un entorn natural únic. Competició a la FFF i projecció internacional.',
    'hero.discover':'Descobreix els nostres programes','hero.apply':'Aplica ara',
    'news.title':'Últimes notícies','testimonials.title':'Testimonis','contact.quick':'Contacte ràpid',
    'la_academia.title':'L\'Acadèmia','modelo.title':'Model Formatiu','programas.title':'Programes','instalaciones.title':'Instal·lacions','equipo.title':'El Nostre Equip','admisiones.title':'Admissions','contacto.title':'Contacte','contacto.data':'Dades','contacto.map':'Mapa','contacto.form':'Formulari de contacte','blog.title':'Blog / Notícies'
  },
  fr: {
    'nav.home':'Accueil','nav.la_academia':'L\'Académie','nav.modelo':'Modèle de formation','nav.programas':'Programmes','nav.instalaciones':'Installations','nav.equipo':'Notre Équipe','nav.admisiones':'Admissions','nav.contacto':'Contact','nav.blog':'Blog','nav.apply':'Postuler maintenant',
    'hero.title':'Façonner l\'avenir du football au cœur des Pyrénées',
    'hero.subtitle':'Aran Football Academy — Bossòst, Vall d\'Aran. Formation sportive, académique et humaine dans un cadre naturel unique. Compétition en FFF et projection internationale.',
    'hero.discover':'Découvrez nos programmes','hero.apply':'Postuler maintenant',
    'news.title':'Dernières nouvelles','testimonials.title':'Témoignages','contact.quick':'Contact rapide',
    'la_academia.title':'L\'Académie','modelo.title':'Modèle de formation','programas.title':'Programmes','instalaciones.title':'Installations','equipo.title':'Notre Équipe','admisiones.title':'Admissions','contacto.title':'Contact','contacto.data':'Coordonnées','contacto.map':'Carte','contacto.form':'Formulaire de contact','blog.title':'Blog / Nouvelles'
  },
  en: {
    'nav.home':'Home','nav.la_academia':'The Academy','nav.modelo':'Training Model','nav.programas':'Programs','nav.instalaciones':'Facilities','nav.equipo':'Our Team','nav.admisiones':'Admissions','nav.contacto':'Contact','nav.blog':'Blog','nav.apply':'Apply now',
    'hero.title':'Shaping the future of football in the heart of the Pyrenees',
    'hero.subtitle':'Aran Football Academy — Bossòst, Vall d\'Aran. Sporting, academic and personal education in a unique natural environment. Competition in the FFF and international projection.',
    'hero.discover':'Discover our programs','hero.apply':'Apply now',
    'news.title':'Latest news','testimonials.title':'Testimonials','contact.quick':'Quick contact',
    'la_academia.title':'The Academy','modelo.title':'Training Model','programas.title':'Programs','instalaciones.title':'Facilities','equipo.title':'Our Team','admisiones.title':'Admissions','contacto.title':'Contact','contacto.data':'Details','contacto.map':'Map','contacto.form':'Contact form','blog.title':'Blog / News'
  }
};

function applyTranslations(lang){
  const map = translations[lang] || translations['es'];
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(map[key]) el.textContent = map[key];
  });
  // update UI and persist selection
  updateLangUI(lang);
  document.documentElement.lang = lang;
  localStorage.setItem('afa-lang', lang);
}

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
  if(langToggle) langToggle.querySelector('.flag').textContent = meta.flag;
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