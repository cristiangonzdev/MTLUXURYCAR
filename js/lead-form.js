(function () {
  "use strict";

  const STYLE_ID = "mtlux-lead-form-style";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const E164_RE = /^\+[1-9]\d{6,14}$/;

  const CSS = `
    .lf-wrap { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(201,168,76,.15); }
    .lf-eyebrow { font-size: .68rem; letter-spacing: .26em; text-transform: uppercase; color: var(--gold, #C9A84C); margin-bottom: .35rem; }
    .lf-title { font-family: var(--font-display, Georgia, serif); font-size: 1.2rem; color: var(--cream, #F0EAD6); margin-bottom: 1.1rem; line-height: 1.3; }
    .lf-field { display: block; margin-bottom: .9rem; }
    .lf-label { display: block; font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--cream-soft, #D4CCBA); margin-bottom: .35rem; }
    .lf-label .lf-hint { color: var(--gray, #888880); font-size: .68rem; text-transform: none; letter-spacing: .04em; margin-left: .35rem; font-style: italic; }
    .lf-input { width: 100%; padding: .8rem 1rem; background: rgba(255,255,255,.03); border: 1px solid rgba(201,168,76,.18); color: var(--cream, #F0EAD6); font-family: inherit; font-size: .95rem; min-height: 44px; transition: border-color .25s ease, background .25s ease; }
    .lf-input:focus { outline: none; border-color: var(--gold, #C9A84C); background: rgba(255,255,255,.05); }
    .lf-input.lf-invalid { border-color: #c25151; }
    .lf-error-msg { display: none; font-size: .72rem; color: #e08585; margin-top: .3rem; }
    .lf-error-msg.show { display: block; }
    .lf-intent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .55rem; }
    @media (max-width: 520px) { .lf-intent-grid { grid-template-columns: 1fr; } }
    .lf-intent { padding: .85rem .7rem; background: rgba(255,255,255,.025); border: 1px solid rgba(201,168,76,.15); color: var(--cream-soft, #D4CCBA); font-family: inherit; text-align: center; cursor: pointer; transition: background .25s ease, border-color .25s ease, color .25s ease; min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .15rem; }
    .lf-intent:hover { border-color: rgba(201,168,76,.4); }
    .lf-intent.lf-active { border-color: var(--gold, #C9A84C); background: rgba(201,168,76,.08); color: var(--cream, #F0EAD6); }
    .lf-intent-title { font-size: .82rem; font-weight: 500; letter-spacing: .04em; }
    .lf-intent-sub { font-size: .65rem; color: var(--gray, #888880); letter-spacing: .04em; text-transform: uppercase; }
    .lf-intent.lf-active .lf-intent-sub { color: var(--gold-light, #E4C97A); }
    .lf-submit { width: 100%; padding: 1rem; background: transparent; border: 1px solid var(--gold, #C9A84C); color: var(--gold, #C9A84C); font-family: inherit; font-size: .82rem; letter-spacing: .16em; text-transform: uppercase; cursor: pointer; transition: background .35s ease, color .35s ease; margin-top: .6rem; min-height: 48px; }
    .lf-submit:hover:not(:disabled) { background: var(--gold, #C9A84C); color: var(--black, #060606); }
    .lf-submit:disabled { opacity: .55; cursor: not-allowed; }
    .lf-success { padding: 1.5rem; text-align: center; border: 1px solid rgba(201,168,76,.25); background: rgba(201,168,76,.05); }
    .lf-success-title { font-family: var(--font-display, Georgia, serif); font-style: italic; font-size: 1.25rem; color: var(--gold-light, #E4C97A); margin-bottom: .5rem; }
    .lf-success-text { font-size: .9rem; color: var(--cream-soft, #D4CCBA); margin-bottom: 1rem; line-height: 1.55; }
    .lf-success-link { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold, #C9A84C); border-bottom: 1px solid var(--gold, #C9A84C); padding-bottom: 2px; }
    .lf-error-banner { padding: .8rem 1rem; background: rgba(194,81,81,.1); border: 1px solid rgba(194,81,81,.4); color: #e8a4a4; font-size: .82rem; margin-bottom: 1rem; }
    .lf-consent { display: flex; align-items: flex-start; gap: .55rem; margin: .6rem 0; cursor: pointer; user-select: none; padding: .65rem; border: 1px solid rgba(201,168,76,.1); background: rgba(255,255,255,.015); transition: border-color .25s ease; }
    .lf-consent:hover { border-color: rgba(201,168,76,.25); }
    .lf-consent input[type="checkbox"] { width: 16px; height: 16px; margin-top: 2px; accent-color: var(--gold, #C9A84C); cursor: pointer; flex-shrink: 0; }
    .lf-consent-text { font-size: .76rem; color: var(--cream-soft, #D4CCBA); line-height: 1.45; }
    .lf-consent-text a { color: var(--gold, #C9A84C); text-decoration: underline; }
    .lf-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: lf-spin .7s linear infinite; vertical-align: middle; margin-right: .5rem; }
    @keyframes lf-spin { to { transform: rotate(360deg); } }
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

  function parseEuroPrice(s) {
    if (typeof s === "number") return s;
    if (typeof s !== "string") return null;
    const digits = s.replace(/[^\d]/g, "");
    if (!digits) return null;
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function render(container, vehicle) {
    container.innerHTML = `
      <div class="lf-wrap">
        <p class="lf-eyebrow">Solicitar informe</p>
        <h3 class="lf-title">Recibe el informe completo de este vehículo</h3>
        <div class="lf-error-banner" hidden></div>
        <form novalidate>
          <label class="lf-field">
            <span class="lf-label">Email</span>
            <input class="lf-input" type="email" name="email" autocomplete="email" required maxlength="254" />
            <span class="lf-error-msg" data-error-for="email">Introduce un email válido</span>
          </label>
          <label class="lf-field">
            <span class="lf-label">Teléfono <span class="lf-hint">recomendado para respuesta rápida</span></span>
            <input class="lf-input" type="tel" name="phone" autocomplete="tel" placeholder="+34 600 000 000" />
            <span class="lf-error-msg" data-error-for="phone">Formato internacional, ej: +34600000000</span>
          </label>
          <div class="lf-field">
            <span class="lf-label">¿Cuándo te lo planteas?</span>
            <div class="lf-intent-grid" role="radiogroup" aria-label="Intención de compra">
              <button type="button" class="lf-intent" data-intent="immediate" role="radio" aria-checked="false">
                <span class="lf-intent-title">Comprar ahora</span>
                <span class="lf-intent-sub">Esta semana</span>
              </button>
              <button type="button" class="lf-intent" data-intent="short_term" role="radio" aria-checked="false">
                <span class="lf-intent-title">En 1-3 meses</span>
                <span class="lf-intent-sub">Próximamente</span>
              </button>
              <button type="button" class="lf-intent" data-intent="exploring" role="radio" aria-checked="false">
                <span class="lf-intent-title">Explorando</span>
                <span class="lf-intent-sub">Sin prisa</span>
              </button>
            </div>
            <span class="lf-error-msg" data-error-for="intent">Selecciona una opción</span>
          </div>
          <label class="lf-consent">
            <input type="checkbox" id="lf-newsletter" name="newsletter_opt_in" />
            <span class="lf-consent-text">
              Quiero recibir por email novedades sobre vehículos exclusivos de MT Lux Cars.
              <a href="politica-privacidad.html" target="_blank" rel="noopener">Política de privacidad</a>.
            </span>
          </label>
          <button type="submit" class="lf-submit">Recibir informe completo</button>
        </form>
      </div>
    `;

    const form = container.querySelector("form");
    const submitBtn = form.querySelector(".lf-submit");
    const errorBanner = container.querySelector(".lf-error-banner");
    const inputs = {
      email: form.querySelector('input[name="email"]'),
      phone: form.querySelector('input[name="phone"]'),
    };
    const newsletterEl = form.querySelector('#lf-newsletter');
    const intents = container.querySelectorAll(".lf-intent");
    let selectedIntent = null;

    function setError(field, show) {
      const el = container.querySelector(`[data-error-for="${field}"]`);
      if (el) el.classList.toggle("show", show);
      if (inputs[field]) inputs[field].classList.toggle("lf-invalid", show);
    }

    function validate() {
      let ok = true;
      const email = inputs.email.value.trim();
      const emailOk = EMAIL_RE.test(email) && email.length <= 254;
      setError("email", !emailOk);
      if (!emailOk) ok = false;

      const phone = inputs.phone.value.trim();
      if (phone.length > 0) {
        const phoneOk = E164_RE.test(phone.replace(/\s/g, ""));
        setError("phone", !phoneOk);
        if (!phoneOk) ok = false;
      } else {
        setError("phone", false);
      }

      const intentOk = !!selectedIntent;
      const intentErr = container.querySelector('[data-error-for="intent"]');
      if (intentErr) intentErr.classList.toggle("show", !intentOk);
      if (!intentOk) ok = false;

      return ok;
    }

    intents.forEach((btn) => {
      btn.addEventListener("click", () => {
        intents.forEach((b) => {
          b.classList.remove("lf-active");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("lf-active");
        btn.setAttribute("aria-checked", "true");
        selectedIntent = btn.dataset.intent;
        const intentErr = container.querySelector('[data-error-for="intent"]');
        if (intentErr) intentErr.classList.remove("show");
      });
    });

    inputs.email.addEventListener("blur", () => {
      const v = inputs.email.value.trim();
      if (v.length > 0) setError("email", !EMAIL_RE.test(v));
    });
    inputs.phone.addEventListener("blur", () => {
      const v = inputs.phone.value.trim().replace(/\s/g, "");
      if (v.length > 0) setError("phone", !E164_RE.test(v));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBanner.hidden = true;
      if (!validate()) return;

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="lf-spinner" aria-hidden="true"></span>Enviando...';

      const utms = getUtms();
      const payload = {
        email: inputs.email.value.trim(),
        phone: inputs.phone.value.trim().replace(/\s/g, "") || null,
        intent: selectedIntent,
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name ?? null,
        vehicle_price: parseEuroPrice(vehicle.price),
        newsletter_opt_in: newsletterEl ? newsletterEl.checked : false,
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
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        renderSuccess(container);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        errorBanner.hidden = false;
        errorBanner.textContent = "No se ha podido enviar. Inténtalo de nuevo o escríbenos por WhatsApp.";
      }
    });
  }

  function renderSuccess(container) {
    container.innerHTML = `
      <div class="lf-wrap">
        <div class="lf-success">
          <p class="lf-success-title">Recibido</p>
          <p class="lf-success-text">Un asesor de MT Lux Cars te contactará en menos de 1 hora con el informe completo del vehículo.</p>
          <a class="lf-success-link" href="vehiculos.html">Ver más vehículos</a>
        </div>
      </div>
    `;
  }

  function mountLeadForm(container, vehicle) {
    if (!container || !vehicle || !vehicle.id) return;
    injectStyleOnce();
    render(container, vehicle);
  }

  window.MTLUXLeadForm = { mount: mountLeadForm };
})();
