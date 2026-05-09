(function () {
  "use strict";

  const TOKEN_KEY = "mtlux_admin_token";
  const EXP_KEY = "mtlux_admin_exp";
  const PAGE_SIZE = 50;
  const WA_PREFIX = "https://wa.me/";

  function getToken() {
    const tok = localStorage.getItem(TOKEN_KEY);
    const exp = parseInt(localStorage.getItem(EXP_KEY) ?? "0", 10);
    if (!tok || !exp) return null;
    if (Math.floor(Date.now() / 1000) >= exp) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXP_KEY);
      return null;
    }
    return tok;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
    window.location.replace("login.html");
  }

  const token = getToken();
  if (!token) { logout(); return; }

  const cfg = window.MTLUX_CONFIG;
  const endpoints = {
    list: `${cfg.FUNCTIONS_URL}/list-leads`,
    update: `${cfg.FUNCTIONS_URL}/update-lead`,
  };

  // ───────── State ─────────
  const state = {
    status: "all",
    intent: "all",
    leadType: "all",
    q: "",
    range: "all",
    offset: 0,
    leads: [],
    total: 0,
    stats: null,
    lastFetchAt: 0,
  };

  // ───────── DOM ─────────
  const tbody = document.getElementById("leadsBody");
  const statusTabs = document.getElementById("statusTabs");
  const intentChips = document.getElementById("intentChips");
  const typeChips = document.getElementById("typeChips");
  const searchInput = document.getElementById("searchInput");
  const rangeSelect = document.getElementById("rangeSelect");
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pagerInfo = document.getElementById("pagerInfo");
  const drawer = document.getElementById("drawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const drawerClose = document.getElementById("drawerClose");
  const drawerContent = document.getElementById("drawerContent");

  // ───────── Helpers ─────────
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function relativeTime(iso) {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (diff < 60_000) return "ahora";
    if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
    if (diff < 86_400_000 * 2) return "ayer";
    if (diff < 86_400_000 * 7) return `hace ${Math.floor(diff / 86_400_000)} días`;
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });
  }

  function formatPrice(n) {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  }

  function advisoryShort(d) {
    if (!d) return "—";
    const parts = [];
    if (d.year) parts.push(`${d.year}`);
    if (d.km_max) parts.push(`máx ${Number(d.km_max).toLocaleString("es-ES")} km`);
    if (d.budget_max) parts.push(`hasta ${formatPrice(d.budget_max)}`);
    return parts.join(" · ") || "Solicitud abierta";
  }

  function waLink(phone, lead) {
    const clean = String(phone ?? "").replace(/[^\d]/g, "");
    if (!clean) return null;
    let msg;
    if (lead && typeof lead === "object") {
      if (lead.lead_type === "advisory" && lead.request_details) {
        const d = lead.request_details;
        const parts = [`Hola, te contactamos desde MT Lux Cars sobre tu solicitud de ${d.brand} ${d.model}`];
        if (d.year) parts.push(`del ${d.year}`);
        if (d.km_max) parts.push(`con máx ${Number(d.km_max).toLocaleString("es-ES")} km`);
        msg = parts.join(", ") + ". Tenemos opciones para enseñarte.";
      } else {
        msg = lead.vehicle_name
          ? `Hola, te contactamos desde MT Lux Cars sobre el ${lead.vehicle_name}.`
          : "Hola, te contactamos desde MT Lux Cars.";
      }
    } else {
      msg = lead
        ? `Hola, te contactamos desde MT Lux Cars sobre el ${lead}.`
        : "Hola, te contactamos desde MT Lux Cars.";
    }
    return `${WA_PREFIX}${clean}?text=${encodeURIComponent(msg)}`;
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) { logout(); throw new Error("unauthorized"); }
    return res;
  }

  // ───────── Fetch ─────────
  async function fetchLeads() {
    tbody.innerHTML = `<tr><td colspan="7" class="loader"><span class="loader-dot"></span><span class="loader-dot"></span><span class="loader-dot"></span></td></tr>`;
    const params = new URLSearchParams();
    if (state.status !== "all") params.set("status", state.status);
    if (state.intent !== "all") params.set("intent", state.intent);
    if (state.leadType !== "all") params.set("lead_type", state.leadType);
    if (state.q.trim()) params.set("q", state.q.trim());
    if (state.range !== "all") {
      const days = parseInt(state.range, 10);
      const from = new Date(Date.now() - days * 86400_000).toISOString();
      params.set("from", from);
    }
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(state.offset));

    try {
      const res = await api(`${endpoints.list}?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error");
      state.leads = data.leads ?? [];
      state.total = data.total ?? 0;
      state.stats = data.stats ?? null;
      state.lastFetchAt = Date.now();
      renderTable();
      renderStats();
      renderPager();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty">Error al cargar: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // ───────── Render ─────────
  function renderStats() {
    const s = state.stats;
    if (!s) return;
    document.querySelector('[data-stat="total_30d"]').textContent = s.total_30d ?? 0;
    document.querySelector('[data-stat="immediate_uncontacted"]').textContent = s.immediate_uncontacted ?? 0;
    const conv = (s.conversion_rate ?? 0) * 100;
    document.querySelector('[data-stat="conversion_rate"]').textContent = `${conv.toFixed(1)}%`;
    const tv = s.top_vehicle;
    document.querySelector('[data-stat="top_vehicle"]').textContent = tv ? (tv.name ?? tv.id) : "—";
    document.querySelector('[data-stat="top_vehicle_count"]').textContent = tv ? `${tv.count} leads` : "";
  }

  function renderTable() {
    if (state.leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty">No hay leads que coincidan con los filtros.</td></tr>`;
      return;
    }
    const rows = state.leads.map((lead) => {
      const wa = waLink(lead.phone, lead);
      const isNewsletter = lead.lead_type === "newsletter";
      const intentBadge = isNewsletter
        ? ""
        : `<span class="badge badge-${lead.intent}">${intentLabel(lead.intent)}</span>`;
      const typeBadge = lead.lead_type === "advisory"
        ? '<span class="badge badge-type-advisory">Asesoramiento</span>'
        : isNewsletter
          ? '<span class="badge badge-type-newsletter">Newsletter</span>'
          : "";
      const vehicleLabel = lead.lead_type === "advisory" && lead.request_details
        ? `${lead.request_details.brand} ${lead.request_details.model}`
        : isNewsletter
          ? "Suscripción"
          : (lead.vehicle_name ?? lead.vehicle_id);
      const priceCell = lead.lead_type === "advisory"
        ? advisoryShort(lead.request_details)
        : isNewsletter
          ? "—"
          : formatPrice(lead.vehicle_price);
      const statusOptions = ["new", "contacted", "qualified", "closed", "lost"]
        .map((s) => `<option value="${s}"${s === lead.status ? " selected" : ""}>${statusLabel(s)}</option>`).join("");
      return `
        <tr data-id="${escapeHtml(lead.id)}">
          <td class="col-date">${escapeHtml(relativeTime(lead.created_at))}</td>
          <td class="col-vehicle">
            <span class="vehicle-name">${escapeHtml(vehicleLabel)}${typeBadge}</span>
            <span class="vehicle-price">${escapeHtml(priceCell)}</span>
          </td>
          <td class="col-contact">
            <a class="email" href="mailto:${escapeHtml(lead.email)}" data-stop>${escapeHtml(lead.email)}</a>
            ${lead.phone ? `<a class="phone" href="${wa ?? `tel:${escapeHtml(lead.phone)}`}" target="${wa ? "_blank" : ""}" rel="noopener noreferrer" data-stop>${escapeHtml(lead.phone)}</a>` : ""}
          </td>
          <td>${intentBadge}</td>
          <td><select class="status-select" data-id="${escapeHtml(lead.id)}" data-stop>${statusOptions}</select></td>
          <td><span style="font-size:.75rem;color:var(--gray);">${escapeHtml(lead.utm_source ?? "—")}</span></td>
          <td><button class="btn-link open-drawer" data-id="${escapeHtml(lead.id)}" data-stop>Detalles</button></td>
        </tr>
      `;
    }).join("");
    tbody.innerHTML = rows;
  }

  function renderPager() {
    const start = state.total === 0 ? 0 : state.offset + 1;
    const end = Math.min(state.offset + PAGE_SIZE, state.total);
    pagerInfo.textContent = `${start}–${end} de ${state.total}`;
    prevPageBtn.disabled = state.offset === 0;
    nextPageBtn.disabled = state.offset + PAGE_SIZE >= state.total;
  }

  function intentLabel(i) {
    return { immediate: "Comprar ahora", short_term: "1-3 meses", exploring: "Explorando" }[i] ?? i;
  }
  function statusLabel(s) {
    return { new: "Nuevo", contacted: "Contactado", qualified: "Cualificado", closed: "Cerrado", lost: "Perdido" }[s] ?? s;
  }

  // ───────── Drawer ─────────
  function openDrawer(id) {
    const lead = state.leads.find((l) => l.id === id);
    if (!lead) return;
    const wa = waLink(lead.phone, lead);
    const isAdvisory = lead.lead_type === "advisory";
    const isNewsletter = lead.lead_type === "newsletter";
    const headerTitle = isAdvisory && lead.request_details
      ? `${lead.request_details.brand} ${lead.request_details.model}`
      : isNewsletter
        ? "Suscripción · Garaje Privado"
        : (lead.vehicle_name ?? lead.vehicle_id);
    const headerMeta = isAdvisory
      ? `<span class="badge badge-type-advisory">Asesoramiento</span> · <span class="badge badge-${lead.intent}">${intentLabel(lead.intent)}</span>`
      : isNewsletter
        ? `<span class="badge badge-type-newsletter">Newsletter</span>`
        : `${escapeHtml(formatPrice(lead.vehicle_price))} · <span class="badge badge-${lead.intent}">${intentLabel(lead.intent)}</span>`;

    const requestSection = isAdvisory && lead.request_details ? `
      <div class="drawer-section">
        <h3>Solicitud del cliente</h3>
        <div class="req-grid">
          <div><span>Marca</span>${escapeHtml(lead.request_details.brand ?? "—")}</div>
          <div><span>Modelo</span>${escapeHtml(lead.request_details.model ?? "—")}</div>
          <div><span>Año</span>${escapeHtml(lead.request_details.year ?? "Cualquiera")}</div>
          <div><span>Km máximo</span>${lead.request_details.km_max ? Number(lead.request_details.km_max).toLocaleString("es-ES") + " km" : "Sin límite"}</div>
          <div><span>Color</span>${escapeHtml(lead.request_details.color ?? "Cualquiera")}</div>
          <div><span>Presupuesto máx.</span>${lead.request_details.budget_max ? formatPrice(lead.request_details.budget_max) : "Sin límite"}</div>
        </div>
      </div>
    ` : "";

    drawerContent.innerHTML = `
      <div class="drawer-section">
        <h3>${escapeHtml(headerTitle)}</h3>
        <p>${headerMeta}</p>
      </div>
      ${requestSection}
      <div class="drawer-section">
        <h3>Contacto</h3>
        <p><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>${lead.newsletter_opt_in ? ' <span class="badge badge-newsletter">📧 Newsletter</span>' : ""}</p>
        ${lead.phone ? `<p class="muted">${escapeHtml(lead.phone)}</p>` : ""}
      </div>
      <div class="drawer-actions">
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
        ${lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}">Llamar</a>` : ""}
        <button data-mark-contacted>Marcar contactado</button>
      </div>
      <div class="drawer-section">
        <h3>Notas</h3>
        <textarea class="notes" id="notesInput" placeholder="Añade contexto del lead, conversación, próximos pasos...">${escapeHtml(lead.notes ?? "")}</textarea>
        <button class="save-notes" id="saveNotesBtn">Guardar notas</button>
      </div>
      <div class="drawer-section">
        <h3>Origen</h3>
        <p class="muted">Página: ${escapeHtml(lead.source ?? "—")}</p>
        <p class="muted">UTM source: ${escapeHtml(lead.utm_source ?? "—")}</p>
        <p class="muted">UTM medium: ${escapeHtml(lead.utm_medium ?? "—")}</p>
        <p class="muted">UTM campaign: ${escapeHtml(lead.utm_campaign ?? "—")}</p>
      </div>
      <div class="drawer-section">
        <h3>Auditoría</h3>
        <p class="muted">Creado: ${escapeHtml(new Date(lead.created_at).toLocaleString("es-ES"))}</p>
        <p class="muted">IP: ${escapeHtml(lead.ip ?? "—")}</p>
        <p class="muted">User agent: ${escapeHtml(lead.user_agent ?? "—")}</p>
      </div>
    `;
    drawer.classList.add("open");
    drawerOverlay.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");

    drawerContent.querySelector("#saveNotesBtn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const notes = drawerContent.querySelector("#notesInput").value;
      btn.disabled = true; btn.textContent = "Guardando...";
      const ok = await updateLead(lead.id, { notes });
      if (ok) {
        btn.classList.add("saved");
        btn.textContent = "Guardado ✓";
        lead.notes = notes;
        setTimeout(() => { btn.classList.remove("saved"); btn.textContent = "Guardar notas"; btn.disabled = false; }, 1500);
      } else {
        btn.textContent = "Error";
        btn.disabled = false;
      }
    });

    const markBtn = drawerContent.querySelector("[data-mark-contacted]");
    if (markBtn) {
      markBtn.addEventListener("click", async () => {
        markBtn.disabled = true; markBtn.textContent = "...";
        const ok = await updateLead(lead.id, { status: "contacted" });
        if (ok) {
          lead.status = "contacted";
          renderTable();
          closeDrawer();
        } else {
          markBtn.textContent = "Error";
          markBtn.disabled = false;
        }
      });
    }
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    drawerOverlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawerContent.innerHTML = "";
  }

  async function updateLead(id, patch) {
    try {
      const res = await api(`${endpoints.update}?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return false;
      // sync local state
      const idx = state.leads.findIndex((l) => l.id === id);
      if (idx >= 0 && data.lead) state.leads[idx] = data.lead;
      return true;
    } catch {
      return false;
    }
  }

  // ───────── Events ─────────
  statusTabs.addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    statusTabs.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    t.classList.add("active");
    state.status = t.dataset.status;
    state.offset = 0;
    fetchLeads();
  });

  intentChips.addEventListener("click", (e) => {
    const t = e.target.closest(".chip");
    if (!t) return;
    intentChips.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    t.classList.add("active");
    state.intent = t.dataset.intent;
    state.offset = 0;
    fetchLeads();
  });

  typeChips.addEventListener("click", (e) => {
    const t = e.target.closest(".chip");
    if (!t) return;
    typeChips.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    t.classList.add("active");
    state.leadType = t.dataset.type;
    state.offset = 0;
    fetchLeads();
  });

  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = searchInput.value;
      state.offset = 0;
      fetchLeads();
    }, 350);
  });

  rangeSelect.addEventListener("change", () => {
    state.range = rangeSelect.value;
    state.offset = 0;
    fetchLeads();
  });

  refreshBtn.addEventListener("click", fetchLeads);
  logoutBtn.addEventListener("click", logout);

  prevPageBtn.addEventListener("click", () => {
    state.offset = Math.max(0, state.offset - PAGE_SIZE);
    fetchLeads();
  });
  nextPageBtn.addEventListener("click", () => {
    state.offset += PAGE_SIZE;
    fetchLeads();
  });

  tbody.addEventListener("change", (e) => {
    const sel = e.target.closest(".status-select");
    if (!sel) return;
    const id = sel.dataset.id;
    updateLead(id, { status: sel.value });
  });

  tbody.addEventListener("click", (e) => {
    if (e.target.closest("[data-stop]")) return;
    const tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    openDrawer(tr.dataset.id);
  });

  drawerClose.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });

  // Auto-refresh cada 60s si la pestaña está activa
  setInterval(() => {
    if (document.visibilityState === "visible" && Date.now() - state.lastFetchAt > 55_000) {
      fetchLeads();
    }
  }, 60_000);

  fetchLeads();
})();
