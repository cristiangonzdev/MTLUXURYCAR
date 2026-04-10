/* ════════════════════════════════════════════════════════════
   MT LUX CARS - Cookie Consent Banner
   Banner ligero y autocontenido. Compatible con LSSI y RGPD.
   No necesita librerías externas.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'mtlux_cookies_consent';
  const VERSION = '1';

  /* ─── Estilos inyectados ─── */
  const STYLES = `
    .cc-banner {
      position: fixed;
      left: 1.2rem;
      right: 1.2rem;
      bottom: 1.2rem;
      max-width: 980px;
      margin: 0 auto;
      z-index: 9500;
      background: rgba(10, 10, 10, .96);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(201, 168, 76, .25);
      padding: 1.4rem 1.6rem;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1.4rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #F0EAD6;
      box-shadow: 0 10px 40px rgba(0, 0, 0, .55);
      opacity: 0;
      transform: translateY(20px);
      transition: opacity .5s ease, transform .5s ease;
    }
    .cc-banner.cc-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .cc-banner-text {
      flex: 1;
      min-width: 0;
      font-size: .88rem;
      line-height: 1.6;
      color: #D4CCBA;
      font-weight: 400;
    }
    .cc-banner-text strong {
      color: #F0EAD6;
      font-weight: 600;
      display: block;
      margin-bottom: .25rem;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.05rem;
      letter-spacing: .01em;
    }
    .cc-banner-text a {
      color: #C9A84C;
      text-decoration: none;
      border-bottom: 1px solid rgba(201, 168, 76, .4);
      transition: color .3s ease, border-color .3s ease;
    }
    .cc-banner-text a:hover {
      color: #E4C97A;
      border-bottom-color: #E4C97A;
    }
    .cc-banner-actions {
      display: flex;
      gap: .7rem;
      flex-shrink: 0;
    }
    .cc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: .8rem 1.5rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 500;
      font-size: .76rem;
      letter-spacing: .12em;
      text-transform: uppercase;
      cursor: pointer;
      background: transparent;
      transition: background .35s ease, color .35s ease, border-color .35s ease;
      min-height: 44px;
      white-space: nowrap;
    }
    .cc-btn-accept {
      background: #C9A84C;
      color: #060606;
      border: 1px solid #C9A84C;
    }
    .cc-btn-accept:hover {
      background: #E4C97A;
      border-color: #E4C97A;
    }
    .cc-btn-reject {
      background: transparent;
      color: #D4CCBA;
      border: 1px solid rgba(201, 168, 76, .4);
    }
    .cc-btn-reject:hover {
      color: #C9A84C;
      border-color: #C9A84C;
    }
    .cc-btn:focus-visible {
      outline: 2px solid #E4C97A;
      outline-offset: 3px;
    }

    /* Mapa bloqueado: placeholder que sustituye al iframe */
    .cc-map-blocked {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem 1.5rem;
      text-align: center;
      background: #0a0a0a;
      color: #D4CCBA;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .cc-map-blocked-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 500;
      font-size: 1.25rem;
      color: #F0EAD6;
      line-height: 1.3;
      max-width: 320px;
    }
    .cc-map-blocked-desc {
      font-size: .85rem;
      color: #888880;
      max-width: 360px;
      line-height: 1.65;
    }
    .cc-map-blocked-btn {
      margin-top: .4rem;
      padding: .85rem 1.8rem;
      background: transparent;
      border: 1px solid #C9A84C;
      color: #C9A84C;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 500;
      font-size: .74rem;
      letter-spacing: .14em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background .35s ease, color .35s ease;
      min-height: 44px;
    }
    .cc-map-blocked-btn:hover {
      background: #C9A84C;
      color: #060606;
    }
    .cc-map-blocked-btn:focus-visible {
      outline: 2px solid #E4C97A;
      outline-offset: 3px;
    }

    /* Móvil: apilar botones bajo el texto */
    @media (max-width: 720px) {
      .cc-banner {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        padding: 1.2rem 1.3rem;
      }
      .cc-banner-actions {
        flex-direction: row;
        width: 100%;
      }
      .cc-banner-actions .cc-btn {
        flex: 1;
        padding: .8rem 1rem;
        font-size: .72rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .cc-banner { transition: none; }
    }
  `;

  /* ─── Helpers ─── */
  function injectStyles() {
    if (document.getElementById('cc-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== VERSION) return null;
      return data.value;
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: VERSION,
        value: value,
        date: new Date().toISOString()
      }));
    } catch (e) { /* no-op */ }
    document.dispatchEvent(new CustomEvent('cookieconsent', { detail: value }));
  }

  /* ─── Banner ─── */
  function buildBanner() {
    const banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Aviso de cookies');

    banner.innerHTML = `
      <div class="cc-banner-text">
        <strong>Usamos cookies</strong>
        Este sitio utiliza cookies de terceros (Google Maps) para mostrarte la ubicación de nuestro showroom. No usamos cookies de seguimiento ni analíticas. Más información en nuestra <a href="politica-cookies.html">Política de Cookies</a>.
      </div>
      <div class="cc-banner-actions">
        <button type="button" class="cc-btn cc-btn-reject" data-cc-action="reject">Rechazar</button>
        <button type="button" class="cc-btn cc-btn-accept" data-cc-action="accept">Aceptar</button>
      </div>
    `;

    banner.addEventListener('click', function (e) {
      const action = e.target.getAttribute('data-cc-action');
      if (action === 'accept') {
        setConsent('accepted');
        hideBanner(banner);
      } else if (action === 'reject') {
        setConsent('rejected');
        hideBanner(banner);
      }
    });

    return banner;
  }

  function showBanner() {
    injectStyles();
    const banner = buildBanner();
    document.body.appendChild(banner);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('cc-visible');
      });
    });
  }

  function hideBanner(banner) {
    banner.classList.remove('cc-visible');
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 500);
  }

  /* ─── Mapa Google: solo se carga si hay consentimiento ─── */
  function initMapPlaceholder() {
    const placeholder = document.querySelector('[data-cc-map]');
    if (!placeholder) return;

    const mapSrc = placeholder.getAttribute('data-cc-map-src');
    const mapTitle = placeholder.getAttribute('data-cc-map-title') || 'Mapa de ubicación';

    function loadMap() {
      placeholder.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = mapSrc;
      iframe.title = mapTitle;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.setAttribute('allowfullscreen', '');
      placeholder.appendChild(iframe);
    }

    function showBlocked() {
      placeholder.innerHTML = `
        <div class="cc-map-blocked">
          <p class="cc-map-blocked-title">Mapa bloqueado</p>
          <p class="cc-map-blocked-desc">Para ver nuestra ubicación necesitamos cargar Google Maps, que utiliza cookies de terceros. Acepta las cookies para visualizarlo.</p>
          <button type="button" class="cc-map-blocked-btn" data-cc-action="accept-map">Aceptar y ver mapa</button>
        </div>
      `;
      const btn = placeholder.querySelector('[data-cc-action="accept-map"]');
      btn.addEventListener('click', function () {
        setConsent('accepted');
        loadMap();
      });
    }

    const consent = getConsent();
    if (consent === 'accepted') {
      loadMap();
    } else {
      showBlocked();
    }

    // Si el usuario acepta cookies en el banner posteriormente, cargar el mapa
    document.addEventListener('cookieconsent', function (e) {
      if (e.detail === 'accepted') {
        loadMap();
      }
    });
  }

  /* ─── Init ─── */
  function init() {
    if (!getConsent()) {
      showBanner();
    }
    initMapPlaceholder();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
