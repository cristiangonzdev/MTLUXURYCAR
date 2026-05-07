(function () {
  "use strict";

  const STYLE_ID = "mtlux-advisory-form-style";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const E164_RE = /^\+[1-9]\d{6,14}$/;
  const WA_PHONE = "34622017410";

  // Modelos por marca: solo los más demandados / habituales en mercado de lujo.
  const BRAND_MODELS = {
    "Mercedes-Benz": [
      "Clase A", "Clase B", "Clase C", "Clase E", "Clase S",
      "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "Clase G",
      "AMG GT", "SL", "EQE", "EQS",
    ],
    "BMW": [
      "Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "Serie 6", "Serie 7", "Serie 8",
      "X1", "X2", "X3", "X4", "X5", "X6", "X7",
      "Z4", "M2", "M3", "M4", "M5", "M8",
      "i4", "i5", "i7", "iX",
    ],
    "Porsche": [
      "911", "Taycan", "Panamera", "Macan", "Cayenne",
      "718 Cayman", "718 Boxster",
    ],
    "Audi": [
      "A3", "A4", "A5", "A6", "A7", "A8",
      "Q2", "Q3", "Q5", "Q7", "Q8",
      "TT", "R8", "e-tron", "e-tron GT",
      "RS3", "RS6", "RS7", "RSQ8",
    ],
    "Lamborghini": ["Huracán", "Urus", "Revuelto", "Aventador"],
    "Range Rover": [
      "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque",
      "Defender", "Discovery", "Discovery Sport",
    ],
    "Ferrari": [
      "Roma", "Portofino M", "296 GTB", "F8 Tributo",
      "SF90 Stradale", "812 Superfast", "Purosangue", "Daytona SP3",
    ],
  };

  const YEARS = (() => {
    const now = new Date().getFullYear();
    const arr = [];
    for (let y = now; y >= 2010; y--) arr.push(y);
    return arr;
  })();

  const KM_OPTIONS = [50000, 100000, 150000, 200000, 250000];

  const BUDGET_OPTIONS = (() => {
    const arr = [];
    for (let b = 20000; b <= 200000; b += 20000) arr.push(b);
    [250000, 300000, 400000, 500000].forEach((b) => arr.push(b));
    return arr;
  })();

  const COLOR_OPTIONS = [
    "Negro", "Blanco", "Gris", "Plateado",
    "Azul", "Rojo", "Verde", "Beige",
    "Marrón", "Burdeos", "Amarillo", "Naranja",
  ];

  const CSS = `
    .af-section { background: var(--black-soft, #0F0F0F); padding: 5rem 2rem; }
    .af-wrap { max-width: 720px; margin: 0 auto; }
    .af-eyebrow { font-size: .72rem; letter-spacing: .28em; text-transform: uppercase; color: var(--gold, #C9A84C); margin-bottom: .7rem; text-align: center; }
    .af-title { font-family: var(--font-display, Georgia, serif); font-weight: 400; font-size: clamp(2rem, 4vw, 2.6rem); color: var(--cream, #F0EAD6); text-align: center; margin-bottom: .8rem; line-height: 1.15; }
    .af-subtitle { text-align: center; color: var(--cream-soft, #D4CCBA); margin-bottom: 2.4rem; font-size: 1rem; line-height: 1.6; }
    .af-card { background: var(--black-card, #141414); border: 1px solid rgba(201,168,76,.15); padding: 2.2rem; }
    @media (max-width: 600px) { .af-card { padding: 1.4rem; } .af-section { padding: 3rem 1rem; } }
    .af-grid { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
    @media (max-width: 540px) { .af-grid { grid-template-columns: 1fr; } }
    .af-grid .af-full { grid-column: 1 / -1; }
    .af-label { display: block; font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--cream-soft, #D4CCBA); margin-bottom: .4rem; }
    .af-label .af-hint { color: var(--gray, #888880); font-size: .68rem; text-transform: none; letter-spacing: .04em; margin-left: .35rem; font-style: italic; }
    .af-input, .af-select { width: 100%; padding: .85rem 1rem; background: rgba(255,255,255,.03); border: 1px solid rgba(201,168,76,.18); color: var(--cream, #F0EAD6); font-family: inherit; font-size: .95rem; min-height: 44px; transition: border-color .25s ease, background .25s ease; }
    .af-select { appearance: none; -webkit-appearance: none; -moz-appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23C9A84C' d='M6 8L0 0h12z'/></svg>"); background-repeat: no-repeat; background-position: right 1rem center; padding-right: 2.4rem; cursor: pointer; }
    .af-select:disabled { opacity: .5; cursor: not-allowed; }
    .af-select option { background: var(--black-card, #141414); color: var(--cream, #F0EAD6); }
    .af-input:focus, .af-select:focus { outline: none; border-color: var(--gold, #C9A84C); background: rgba(255,255,255,.05); }
    .af-input.af-invalid, .af-select.af-invalid { border-color: #c25151; }
    .af-input::placeholder { color: rgba(255,255,255,.25); }
    .af-error-msg { display: none; font-size: .72rem; color: #e08585; margin-top: .3rem; }
    .af-error-msg.show { display: block; }
    .af-intent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .55rem; }
    @media (max-width: 540px) { .af-intent-grid { grid-template-columns: 1fr; } }
    .af-intent { padding: .85rem .7rem; background: rgba(255,255,255,.025); border: 1px solid rgba(201,168,76,.15); color: var(--cream-soft, #D4CCBA); font-family: inherit; text-align: center; cursor: pointer; transition: background .25s ease, border-color .25s ease, color .25s ease; min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .15rem; }
    .af-intent:hover { border-color: rgba(201,168,76,.4); }
    .af-intent.af-active { border-color: var(--gold, #C9A84C); background: rgba(201,168,76,.08); color: var(--cream, #F0EAD6); }
    .af-intent-title { font-size: .82rem; font-weight: 500; }
    .af-intent-sub { font-size: .65rem; color: var(--gray, #888880); letter-spacing: .04em; text-transform: uppercase; }
    .af-intent.af-active .af-intent-sub { color: var(--gold-light, #E4C97A); }
    .af-submit { width: 100%; padding: 1.05rem; background: transparent; border: 1px solid var(--gold, #C9A84C); color: var(--gold, #C9A84C); font-family: inherit; font-size: .82rem; letter-spacing: .16em; text-transform: uppercase; cursor: pointer; transition: background .35s ease, color .35s ease; min-height: 48px; margin-top: 1.2rem; }
    .af-submit:hover:not(:disabled) { background: var(--gold, #C9A84C); color: var(--black, #060606); }
    .af-submit:disabled { opacity: .55; cursor: not-allowed; }
    .af-success { padding: 2rem 1.5rem; text-align: center; border: 1px solid rgba(201,168,76,.25); background: rgba(201,168,76,.05); }
    .af-success-title { font-family: var(--font-display, Georgia, serif); font-style: italic; font-size: 1.5rem; color: var(--gold-light, #E4C97A); margin-bottom: .6rem; }
    .af-success-text { font-size: .95rem; color: var(--cream-soft, #D4CCBA); margin-bottom: 1.4rem; line-height: 1.6; }
    .af-success-actions { display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; }
    .af-success-actions a { padding: .8rem 1.5rem; font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; border: 1px solid var(--gold, #C9A84C); color: var(--gold, #C9A84C); transition: background .35s ease, color .35s ease; }
    .af-success-actions a:hover { background: var(--gold, #C9A84C); color: var(--black, #060606); }
    .af-success-actions a.wa { border-color: #25d366; color: #25d366; }
    .af-success-actions a.wa:hover { background: #25d366; color: var(--black, #060606); }
    .af-error-banner { padding: .8rem 1rem; background: rgba(194,81,81,.1); border: 1px solid rgba(194,81,81,.4); color: #e8a4a4; font-size: .82rem; margin-bottom: 1rem; }
    .af-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: af-spin .7s linear infinite; vertical-align: middle; margin-right: .5rem; }
    @keyframes af-spin { to { transform: rotate(360deg); } }
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

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtKm(n) { return `${n.toLocaleString("es-ES")} km`; }
  function fmtEur(n) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n); }

  function buildWaMessage(details) {
    const parts = [`Hola, busco un ${details.brand} ${details.model}`];
    if (details.year) parts.push(`del ${details.year}`);
    if (details.km_max) parts.push(`con máximo ${fmtKm(details.km_max)}`);
    if (details.budget_max) parts.push(`presupuesto hasta ${fmtEur(details.budget_max)}`);
    let msg = parts.join(", ") + ".";
    if (!details.color) msg += " ¿Qué colores tenéis disponibles?";
    else msg += ` Color preferido: ${details.color}.`;
    return msg;
  }

  function brandOptionsHtml() {
    return Object.keys(BRAND_MODELS)
      .map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
  }

  function modelOptionsHtml(brand) {
    const models = BRAND_MODELS[brand];
    if (!models) return `<option value="">Selecciona primero la marca</option>`;
    return `<option value="">Cualquier modelo</option>` +
      models.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  }

  function yearOptionsHtml() {
    return `<option value="">Cualquier año</option>` +
      YEARS.map((y) => `<option value="${y}">${y}</option>`).join("") +
      `<option value="2009">Anterior a 2010</option>`;
  }

  function kmOptionsHtml() {
    return `<option value="">Sin límite</option>` +
      KM_OPTIONS.map((k) => `<option value="${k}">Hasta ${fmtKm(k)}</option>`).join("");
  }

  function budgetOptionsHtml() {
    return `<option value="">Sin tope</option>` +
      BUDGET_OPTIONS.map((b) => `<option value="${b}">Hasta ${fmtEur(b)}</option>`).join("");
  }

  function colorOptionsHtml() {
    return `<option value="">Cualquier color</option>` +
      COLOR_OPTIONS.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  function render(container) {
    container.innerHTML = `
      <section class="af-section">
        <div class="af-wrap">
          <p class="af-eyebrow">Cuéntanos qué buscas</p>
          <h2 class="af-title">¿No encuentras tu coche ideal? Lo encontramos por ti</h2>
          <p class="af-subtitle">Importamos cualquier marca y modelo bajo pedido. Dinos qué buscas y en menos de 24h te enviamos unidades disponibles que cumplen tus criterios.</p>
          <div class="af-card">
            <div class="af-error-banner" hidden></div>
            <form novalidate>
              <div class="af-grid">
                <div>
                  <label class="af-label" for="af-brand">Marca</label>
                  <select class="af-select" id="af-brand" name="brand" required>
                    <option value="">Selecciona marca</option>
                    ${brandOptionsHtml()}
                  </select>
                  <span class="af-error-msg" data-error-for="brand">Selecciona la marca</span>
                </div>
                <div>
                  <label class="af-label" for="af-model">Modelo</label>
                  <select class="af-select" id="af-model" name="model" disabled>
                    <option value="">Selecciona primero la marca</option>
                  </select>
                </div>
                <div>
                  <label class="af-label" for="af-year">Año <span class="af-hint">opcional</span></label>
                  <select class="af-select" id="af-year" name="year">
                    ${yearOptionsHtml()}
                  </select>
                </div>
                <div>
                  <label class="af-label" for="af-km">Km máximo <span class="af-hint">opcional</span></label>
                  <select class="af-select" id="af-km" name="km_max">
                    ${kmOptionsHtml()}
                  </select>
                </div>
                <div>
                  <label class="af-label" for="af-color">Color <span class="af-hint">opcional</span></label>
                  <select class="af-select" id="af-color" name="color">
                    ${colorOptionsHtml()}
                  </select>
                </div>
                <div>
                  <label class="af-label" for="af-budget">Presupuesto máx. <span class="af-hint">opcional</span></label>
                  <select class="af-select" id="af-budget" name="budget_max">
                    ${budgetOptionsHtml()}
                  </select>
                </div>
                <div class="af-full">
                  <label class="af-label" for="af-email">Email</label>
                  <input class="af-input" id="af-email" name="email" type="email" autocomplete="email" required maxlength="254" />
                  <span class="af-error-msg" data-error-for="email">Introduce un email válido</span>
                </div>
                <div class="af-full">
                  <label class="af-label" for="af-phone">Teléfono <span class="af-hint">recomendado para respuesta más rápida</span></label>
                  <input class="af-input" id="af-phone" name="phone" type="tel" autocomplete="tel" placeholder="+34 600 000 000" />
                  <span class="af-error-msg" data-error-for="phone">Formato internacional, ej: +34600000000</span>
                </div>
                <div class="af-full">
                  <span class="af-label">¿Cuándo lo necesitas?</span>
                  <div class="af-intent-grid" role="radiogroup" aria-label="Urgencia">
                    <button type="button" class="af-intent" data-intent="immediate" role="radio" aria-checked="false">
                      <span class="af-intent-title">Comprar ahora</span>
                      <span class="af-intent-sub">Esta semana</span>
                    </button>
                    <button type="button" class="af-intent" data-intent="short_term" role="radio" aria-checked="false">
                      <span class="af-intent-title">En 1-3 meses</span>
                      <span class="af-intent-sub">Próximamente</span>
                    </button>
                    <button type="button" class="af-intent" data-intent="exploring" role="radio" aria-checked="false">
                      <span class="af-intent-title">Explorando</span>
                      <span class="af-intent-sub">Sin prisa</span>
                    </button>
                  </div>
                  <span class="af-error-msg" data-error-for="intent">Selecciona una opción</span>
                </div>
              </div>
              <button type="submit" class="af-submit">Buscarme unidades</button>
            </form>
          </div>
        </div>
      </section>
    `;

    const form = container.querySelector("form");
    const submitBtn = form.querySelector(".af-submit");
    const errorBanner = container.querySelector(".af-error-banner");
    const fields = {
      brand: form.querySelector("#af-brand"),
      model: form.querySelector("#af-model"),
      year: form.querySelector("#af-year"),
      km_max: form.querySelector("#af-km"),
      color: form.querySelector("#af-color"),
      budget_max: form.querySelector("#af-budget"),
      email: form.querySelector("#af-email"),
      phone: form.querySelector("#af-phone"),
    };
    const intents = container.querySelectorAll(".af-intent");
    let selectedIntent = null;

    function setError(name, show) {
      const el = container.querySelector(`[data-error-for="${name}"]`);
      if (el) el.classList.toggle("show", show);
      if (fields[name]) fields[name].classList.toggle("af-invalid", show);
    }

    fields.brand.addEventListener("change", () => {
      const brand = fields.brand.value;
      fields.model.innerHTML = modelOptionsHtml(brand);
      fields.model.disabled = !brand;
      setError("brand", !brand);
    });

    fields.email.addEventListener("blur", () => {
      const v = fields.email.value.trim();
      if (v.length > 0) setError("email", !EMAIL_RE.test(v));
    });
    fields.phone.addEventListener("blur", () => {
      const v = fields.phone.value.trim().replace(/\s/g, "");
      if (v.length > 0) setError("phone", !E164_RE.test(v));
    });

    intents.forEach((btn) => {
      btn.addEventListener("click", () => {
        intents.forEach((b) => { b.classList.remove("af-active"); b.setAttribute("aria-checked", "false"); });
        btn.classList.add("af-active");
        btn.setAttribute("aria-checked", "true");
        selectedIntent = btn.dataset.intent;
        const intentEl = container.querySelector('[data-error-for="intent"]');
        if (intentEl) intentEl.classList.remove("show");
      });
    });

    function validate() {
      let ok = true;

      const brand = fields.brand.value;
      setError("brand", !brand);
      if (!brand) ok = false;

      const email = fields.email.value.trim();
      const emailOk = EMAIL_RE.test(email) && email.length <= 254;
      setError("email", !emailOk);
      if (!emailOk) ok = false;

      const phone = fields.phone.value.trim().replace(/\s/g, "");
      if (phone.length > 0 && !E164_RE.test(phone)) {
        setError("phone", true);
        ok = false;
      } else {
        setError("phone", false);
      }

      const intentEl = container.querySelector('[data-error-for="intent"]');
      if (intentEl) intentEl.classList.toggle("show", !selectedIntent);
      if (!selectedIntent) ok = false;

      if (!ok) return null;
      return {
        brand,
        model: fields.model.value || "",
        year: fields.year.value ? Number(fields.year.value) : null,
        km_max: fields.km_max.value ? Number(fields.km_max.value) : null,
        color: fields.color.value || null,
        budget_max: fields.budget_max.value ? Number(fields.budget_max.value) : null,
        email,
        phone: phone || null,
      };
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBanner.hidden = true;
      const data = validate();
      if (!data) return;

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="af-spinner" aria-hidden="true"></span>Enviando...';

      const utms = getUtms();
      const payload = {
        email: data.email,
        phone: data.phone,
        intent: selectedIntent,
        lead_type: "advisory",
        request_details: {
          brand: data.brand,
          model: data.model || "Cualquier modelo",
          year: data.year,
          km_max: data.km_max,
          color: data.color,
          budget_max: data.budget_max,
        },
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
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        renderSuccess(container, payload.request_details);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        errorBanner.hidden = false;
        errorBanner.textContent = "No se ha podido enviar. Inténtalo de nuevo o escríbenos por WhatsApp.";
      }
    });
  }

  function renderSuccess(container, details) {
    const waMsg = buildWaMessage(details);
    const waLink = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(waMsg)}`;
    container.innerHTML = `
      <section class="af-section">
        <div class="af-wrap">
          <div class="af-success">
            <p class="af-success-title">Solicitud recibida</p>
            <p class="af-success-text">
              Estamos buscando unidades de <strong>${escapeHtml(details.brand)} ${escapeHtml(details.model)}</strong> que cumplan tus criterios.<br>
              Te enviaremos opciones por email en menos de 24 horas.
            </p>
            <div class="af-success-actions">
              <a class="wa" href="${waLink}" target="_blank" rel="noopener noreferrer">Continuar por WhatsApp</a>
              <a href="vehiculos.html">Ver inventario actual</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function mountAdvisoryForm(container) {
    if (!container) return;
    injectStyleOnce();
    render(container);
  }

  window.MTLUXAdvisoryForm = { mount: mountAdvisoryForm };
})();
