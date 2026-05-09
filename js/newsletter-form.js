(function () {
  "use strict";

  const STYLE_ID = "mtlux-newsletter-form-style";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const CSS = `
    .nf-section { background: var(--black, #060606); padding: 6rem 2rem; position: relative; border-top: 1px solid rgba(201,168,76,.12); border-bottom: 1px solid rgba(201,168,76,.12); }
    .nf-section::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(201,168,76,.04), transparent 60%); pointer-events: none; }
    .nf-wrap { max-width: 680px; margin: 0 auto; text-align: center; position: relative; }
    .nf-eyebrow { font-size: .72rem; letter-spacing: .32em; text-transform: uppercase; color: var(--gold, #C9A84C); margin-bottom: 1rem; }
    .nf-title { font-family: var(--font-display, Georgia, serif); font-weight: 400; font-size: clamp(2.2rem, 5vw, 3.4rem); color: var(--cream, #F0EAD6); line-height: 1.1; margin-bottom: 1.4rem; }
    .nf-title em { color: var(--gold-light, #E4C97A); font-style: italic; }
    .nf-copy { font-size: 1.02rem; color: var(--cream-soft, #D4CCBA); line-height: 1.7; max-width: 520px; margin: 0 auto 2.4rem; }
    .nf-form { display: flex; gap: .6rem; max-width: 480px; margin: 0 auto; align-items: stretch; }
    @media (max-width: 540px) { .nf-form { flex-direction: column; } }
    .nf-input { flex: 1; padding: 1rem 1.2rem; background: rgba(255,255,255,.03); border: 1px solid rgba(201,168,76,.2); color: var(--cream, #F0EAD6); font-family: inherit; font-size: .95rem; min-height: 50px; transition: border-color .25s ease, background .25s ease; }
    .nf-input::placeholder { color: rgba(255,255,255,.3); }
    .nf-input:focus { outline: none; border-color: var(--gold, #C9A84C); background: rgba(255,255,255,.05); }
    .nf-input.nf-invalid { border-color: #c25151; }
    .nf-submit { padding: 1rem 1.8rem; background: var(--gold, #C9A84C); border: 1px solid var(--gold, #C9A84C); color: var(--black, #060606); font-family: inherit; font-size: .78rem; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; cursor: pointer; transition: background .35s ease, color .35s ease, border-color .35s ease; min-height: 50px; white-space: nowrap; }
    .nf-submit:hover:not(:disabled) { background: var(--gold-light, #E4C97A); border-color: var(--gold-light, #E4C97A); }
    .nf-submit:disabled { opacity: .55; cursor: not-allowed; }
    .nf-fineprint { font-size: .72rem; color: var(--gray, #888880); margin-top: 1rem; letter-spacing: .04em; }
    .nf-fineprint a { color: var(--cream-soft, #D4CCBA); text-decoration: underline; text-underline-offset: 3px; }
    .nf-error-msg { display: none; font-size: .78rem; color: #e08585; margin-top: .8rem; }
    .nf-error-msg.show { display: block; }
    .nf-success { padding: 1.6rem; border: 1px solid rgba(201,168,76,.3); background: rgba(201,168,76,.04); max-width: 480px; margin: 0 auto; }
    .nf-success-title { font-family: var(--font-display, Georgia, serif); font-style: italic; font-size: 1.4rem; color: var(--gold-light, #E4C97A); margin-bottom: .5rem; }
    .nf-success-text { font-size: .92rem; color: var(--cream-soft, #D4CCBA); line-height: 1.55; }
    .nf-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: nf-spin .7s linear infinite; vertical-align: middle; margin-right: .5rem; }
    @keyframes nf-spin { to { transform: rotate(360deg); } }
  `;

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function getUtms() {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source"),
      utm_medium: p.get("utm_medium"),
      utm_campaign: p.get("utm_campaign"),
    };
  }

  function render(container) {
    container.innerHTML = `
      <section class="nf-section">
        <div class="nf-wrap">
          <p class="nf-eyebrow">Garaje Privado</p>
          <h2 class="nf-title">Lo que pasa <em>dentro</em> de un concesionario de lujo</h2>
          <p class="nf-copy">Una vez por semana, una historia real desde MT Lux Cars. Importaciones que salen mal, clientes que cambian de idea a última hora, errores caros del sector. Sin ofertas. Sin spam. Para los que un coche es algo más que cuatro ruedas.</p>
          <form class="nf-form" novalidate>
            <input class="nf-input" type="email" name="email" placeholder="tu@email.com" autocomplete="email" required maxlength="254" aria-label="Email" />
            <button type="submit" class="nf-submit">Quiero leerlo</button>
          </form>
          <p class="nf-error-msg" data-error-for="email">Introduce un email válido</p>
          <p class="nf-fineprint">1 email a la semana · te das de baja en 1 click · <a href="politica-privacidad.html" target="_blank" rel="noopener">política de privacidad</a></p>
        </div>
      </section>
    `;

    const form = container.querySelector("form");
    const input = form.querySelector('input[name="email"]');
    const submitBtn = form.querySelector(".nf-submit");
    const errorEl = container.querySelector('[data-error-for="email"]');

    function setError(show) {
      errorEl.classList.toggle("show", show);
      input.classList.toggle("nf-invalid", show);
    }

    input.addEventListener("blur", () => {
      const v = input.value.trim();
      if (v.length > 0) setError(!EMAIL_RE.test(v));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!EMAIL_RE.test(email) || email.length > 254) {
        setError(true);
        input.focus();
        return;
      }
      setError(false);

      submitBtn.disabled = true;
      const original = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="nf-spinner" aria-hidden="true"></span>Enviando...';

      const utms = getUtms();
      const payload = {
        email,
        lead_type: "newsletter",
        source: window.location.pathname,
        ...utms,
      };

      try {
        const cfg = window.MTLUX_CONFIG;
        if (!cfg || !cfg.FUNCTIONS_URL) throw new Error("config missing");
        const res = await fetch(`${cfg.FUNCTIONS_URL}/submit-lead`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        renderSuccess(container);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
        errorEl.textContent = "No se ha podido suscribir. Inténtalo de nuevo.";
        errorEl.classList.add("show");
      }
    });
  }

  function renderSuccess(container) {
    container.innerHTML = `
      <section class="nf-section">
        <div class="nf-wrap">
          <p class="nf-eyebrow">Garaje Privado</p>
          <div class="nf-success">
            <p class="nf-success-title">Estás dentro</p>
            <p class="nf-success-text">El próximo lunes te llega el primer email. Si no ves nada, revisa la carpeta de promociones de Gmail y muévelo a "Principal" para que no se pierda ninguno.</p>
          </div>
        </div>
      </section>
    `;
  }

  function mount(container) {
    if (!container) return;
    injectStyleOnce();
    render(container);
  }

  window.MTLUXNewsletterForm = { mount };
})();
