/* ══════════════════════════════════════════════════════════════
   iTura studio — main.js
   Interactividad del cliente: nav, animaciones, formulario
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN DE EMAIL — info@itura.studio
   ─────────────────────────────────────────────────────────────

   FORMSPREE (sin backend):
     Formulario «iTura studio · Contacto» → info@itura.studio.
     Si formspreeId vuelve a null, el envío no falla en silencio:
     muestra un aviso con un enlace mailto:info@itura.studio que
     lleva los datos escritos. Detalles: README.md → «Formulario».

   ─────────────────────────────────────────────────────────────
*/
const CONFIG = {
  formspreeId:      'xqppoavv', // https://formspree.io/f/xqppoavv → info@itura.studio

  /* Asunto con el que llega cada mensaje y correo de respaldo */
  formSubject:      'Nuevo contacto web · iTura studio',
  contactEmail:     'info@itura.studio',

  /* EmailJS (alternativa) */
  emailServiceId:   null,
  emailTemplateId:  null,
  emailPublicKey:   null,

  /* API propia (alternativa) */
  apiEndpoint:      null,

  navScrollOffset:  80,
};

/* ─────────────────────────────────────────────────────────────
   Utilidades DOM
   ───────────────────────────────────────────────────────────── */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const NETWORK_TIMEOUT_MS = 10000;
const MAX_NETWORK_RETRIES = 1;

function cloneFormData(formData) {
  const copy = new FormData();
  for (const [key, value] of formData.entries()) copy.append(key, value);
  return copy;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = NETWORK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Timeout de red');
      timeoutErr.code = 'ETIMEDOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ─────────────────────────────────────────────────────────────
   NAVEGACIÓN
   ───────────────────────────────────────────────────────────── */
function initNav() {
  const nav        = $('#nav');
  const hamburger  = $('#js-hamburger');
  const mobileMenu = $('#js-mobile-menu');
  if (!nav) return;

  /* ── Scroll state ─────────────────────────────────────────── */
  const updateNav = () =>
    nav.classList.toggle('is-scrolled', window.scrollY > CONFIG.navScrollOffset);

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Mobile menu ──────────────────────────────────────────── */
  if (!hamburger || !mobileMenu) return;

  const overlay = document.createElement('div');
  overlay.className = 'nav__overlay';
  overlay.id = 'js-nav-overlay';
  document.body.appendChild(overlay);

  const isOpen    = () => hamburger.getAttribute('aria-expanded') === 'true';
  const openMenu  = () => setMenuState(true);
  const closeMenu = () => setMenuState(false);

  function setMenuState(open) {
    hamburger.setAttribute('aria-expanded', open);
    hamburger.setAttribute('aria-label',
      open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    mobileMenu.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', mobileMenu)?.focus({ preventScroll: true });
  }

  hamburger.addEventListener('click', () => {
    isOpen() ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  $$('.nav__mobile-link').forEach(l => l.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (!isOpen()) return;

    /* Escape key closes menu and returns focus to the button */
    if (e.key === 'Escape') {
      closeMenu();
      hamburger.focus();
      return;
    }

    /* Tab stays between the button and the menu links */
    if (e.key === 'Tab') {
      const focusables = [hamburger, ...$$('a', mobileMenu)];
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* Desktop layout has no mobile menu */
  window.matchMedia('(min-width: 1024px)').addEventListener('change', e => {
    if (e.matches && isOpen()) closeMenu();
  });
}

/* ─────────────────────────────────────────────────────────────
   SECCIÓN ACTIVA — marca el enlace de la sección en pantalla
   ───────────────────────────────────────────────────────────── */
function initScrollSpy() {
  const links = $$('.nav__link, .nav__mobile-link');
  const sections = $$('main section[id]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const setCurrent = href => links.forEach(link => {
    if (link.getAttribute('href') === href) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  /* Una franja horizontal en el centro de la pantalla decide la sección */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section = entry.target;
      setCurrent(section.dataset.navTarget || `#${section.id}`);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(section => observer.observe(section));
}

/* ─────────────────────────────────────────────────────────────
   SMOOTH SCROLL — anclas internas
   ───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 84;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - navH,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
    /* El foco sigue al destino para que el teclado continúe desde allí */
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* ─────────────────────────────────────────────────────────────
   ANIMACIONES DE SCROLL — IntersectionObserver
   ───────────────────────────────────────────────────────────── */
const REVEAL_SELECTOR =
  '.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-media, .reveal-line, .reveal-wipe';

function initScrollAnimations() {
  const elements = $$(REVEAL_SELECTOR);

  /* Movimiento reducido o navegador antiguo: todo visible al instante */
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        /* Stagger siblings inside the same parent */
        const siblings = $$(REVEAL_SELECTOR, entry.target.parentElement || document);
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 0.10}s`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   FORMULARIO DE CONTACTO
   ───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form      = $('#contact-form');
  if (!form) return;

  const submitBtn = $('#js-form-submit');
  const statusEl  = $('#js-form-status');
  const captchaRange = document.getElementById('form-captcha');
  const captchaValue = document.getElementById('form-captcha-value');
  const captchaWrap  = form.querySelector('.form-captcha');

  function updateCaptchaState() {
    if (!captchaRange || !captchaValue) return;
    const value = Number(captchaRange.value || 0);
    captchaValue.textContent = `${value}%`;
    captchaWrap?.classList.toggle('is-verified', value === 100);
  }

  updateCaptchaState();
  captchaRange?.addEventListener('input', updateCaptchaState);

  /* Mensaje de estado; con mailtoHref añade el correo como enlace */
  function setStatus(type, message, mailtoHref) {
    statusEl.className = type ? `form-status form-status--${type}` : 'form-status';
    statusEl.replaceChildren();
    if (!message) return;
    statusEl.append(message);
    if (mailtoHref) {
      const link = document.createElement('a');
      link.href = mailtoHref;
      link.textContent = CONFIG.contactEmail;
      statusEl.append(' ', link, '.');
    }
  }

  /* Validation rules per field */
  const validators = {
    'form-name':    v => (v.trim().length >= 2 ? '' : 'Ingresa tu nombre completo.'),
    'form-email':   v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
                           ? '' : 'Ingresa un correo electrónico válido.'),
    'form-area-code': v => (v.trim() ? '' : 'Selecciona un código de área.'),
    'form-phone':   v => {
      const digits = v.replace(/\D/g, '');
      return (digits.length >= 7 && digits.length <= 15)
        ? '' : 'Ingresa un número telefónico válido.';
    },
    'form-captcha': v => (Number(v) === 100
      ? '' : 'Desliza hasta 100 para verificar que no eres un bot.'),
    'form-subject': v => (v.trim().length >= 3 ? '' : 'El asunto es requerido.'),
    'form-message': v => (v.trim().length >= 10
                           ? '' : 'El mensaje debe tener al menos 10 caracteres.'),
  };

  function validateField(id) {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`${id}-error`);
    if (!input || !errEl) return true;
    const err = validators[id](input.value);
    errEl.textContent = err;
    input.classList.toggle('is-error', !!err);
    input.setAttribute('aria-invalid', err ? 'true' : 'false');
    return !err;
  }

  /* Live validation on blur / input */
  Object.keys(validators).forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('blur', () => validateField(id));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-error')) validateField(id);
    });
  });

  /* Submit */
  form.addEventListener('submit', async e => {
    e.preventDefault();

    /* Honeypot check (Formspree _gotcha) */
    const honey = form.querySelector('[name="_gotcha"]');
    if (honey?.value) return;

    /* Validate all fields; focus the first one with an error */
    const invalid = Object.keys(validators).filter(id => !validateField(id));
    if (invalid.length) {
      document.getElementById(invalid[0])?.focus();
      return;
    }

    /* UI: loading */
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    setStatus('');

    const formData = new FormData(form);

    try {
      await sendFormData(formData);
      setStatus('success', 'Mensaje enviado. Te respondemos en menos de 48 h.');
      form.reset();
      updateCaptchaState();
    } catch (err) {
      if (err?.code === 'ENOSERVICE') {
        /* Formulario sin activar: los datos quedan escritos y el enlace los lleva al correo */
        setStatus('info',
          'El formulario aún no está activo. Escríbenos directamente a',
          buildMailto(formData));
      } else {
        console.error('[Form] Error:', err);
        setStatus('error',
          err?.userMessage || 'No pudimos enviar el mensaje. Intenta de nuevo o escríbenos a',
          buildMailto(formData));
      }
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}

/**
 * mailto: con el asunto y los datos del formulario, como alternativa
 * cuando no hay servicio de envío o el envío falla.
 *
 * @param {FormData} formData
 */
function buildMailto(formData) {
  const field = name => String(formData.get(name) || '').trim();
  const subject = field('subject') || CONFIG.formSubject;
  const body = [
    `Nombre: ${field('name')}`,
    `Correo: ${field('email')}`,
    `Teléfono: ${[field('areaCode'), field('phone')].filter(Boolean).join(' ')}`,
    '',
    field('message'),
  ].join('\r\n');
  return `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Sends form data to the configured email service.
 * Edit CONFIG at the top to activate your chosen service.
 *
 * @param {FormData} formData
 */
async function sendFormData(formData) {

  /* ── OPCIÓN 1: FORMSPREE ─────────────────────────────────── */
  if (CONFIG.formspreeId) {
    const endpoint = `https://formspree.io/f/${CONFIG.formspreeId}`;
    const payload = cloneFormData(formData);
    payload.set('_subject', CONFIG.formSubject);
    payload.set('_replyto', String(formData.get('email') || '').trim());

    for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
      try {
        const res = await fetchWithTimeout(endpoint, {
          method: 'POST',
          body: cloneFormData(payload),
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          if (res.status >= 500 && attempt < MAX_NETWORK_RETRIES) continue;
          throw new Error(`Formspree: HTTP ${res.status}`);
        }
        return;
      } catch (err) {
        const isTimeout = err?.code === 'ETIMEDOUT';
        const isNetwork = err?.name === 'TypeError';
        const canRetry = attempt < MAX_NETWORK_RETRIES && (isTimeout || isNetwork);
        if (canRetry) continue;

        if (isTimeout) {
          err.userMessage =
            'La conexión está lenta. Intenta de nuevo en unos segundos o escríbenos a';
        }
        throw err;
      }
    }
  }

  /* ── OPCIÓN 2: API PROPIA ────────────────────────────────── */
  if (CONFIG.apiEndpoint) {
    const body = Object.fromEntries(formData.entries());
    const res = await fetchWithTimeout(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API: HTTP ${res.status}`);
    return;
  }

  /* ── OPCIÓN 3: EMAILJS ───────────────────────────────────────
     El SDK no se carga en index.html. Para usarlo, añade su
     <script> antes de main.js y descomenta este bloque.

  if (CONFIG.emailServiceId && typeof emailjs !== 'undefined') {
    emailjs.init(CONFIG.emailPublicKey);
    await emailjs.send(CONFIG.emailServiceId, CONFIG.emailTemplateId, {
      from_name:  formData.get('name'),
      from_email: formData.get('email'),
      subject:    formData.get('subject'),
      message:    formData.get('message'),
    });
    return;
  }
  ─────────────────────────────────────────────────────────────── */

  /* ── SIN SERVICIO — formulario pendiente de activar ─────── */
  console.warn(
    '[iTura studio] No hay servicio de email configurado.\n' +
    'Edita CONFIG en assets/js/main.js (ver README.md).'
  );
  const noService = new Error('Sin servicio de envío configurado');
  noService.code = 'ENOSERVICE';
  throw noService;
}

/* ─────────────────────────────────────────────────────────────
   INICIALIZACIÓN
   ───────────────────────────────────────────────────────────── */
function init() {
  initNav();
  initScrollSpy();
  initSmoothScroll();
  initScrollAnimations();
  initContactForm();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
