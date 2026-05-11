(function () {
  "use strict";

  const TOKEN_KEY = "mtlux_admin_token";
  const EXP_KEY = "mtlux_admin_exp";

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
  const ENDPOINT = `${cfg.FUNCTIONS_URL}/time-entries`;

  // ───────── DOM ─────────
  const weekHoursEl = document.getElementById("weekHours");
  const monthHoursEl = document.getElementById("monthHours");
  const yearHoursEl = document.getElementById("yearHours");
  const weekSub = document.getElementById("weekSub");
  const monthSub = document.getElementById("monthSub");
  const tbody = document.getElementById("entriesBody");
  const addForm = document.getElementById("addForm");
  const qaDate = document.getElementById("qaDate");
  const qaHours = document.getElementById("qaHours");
  const qaNote = document.getElementById("qaNote");
  const qaErr = document.getElementById("qaErr");
  const logoutBtn = document.getElementById("logoutBtn");

  // Default fecha = hoy
  qaDate.value = new Date().toISOString().slice(0, 10);

  // ───────── Helpers ─────────
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatHours(n) {
    const v = Number(n);
    return Number.isInteger(v) ? `${v}h` : `${v.toFixed(2).replace(/\.?0+$/, "")}h`;
  }

  async function api(method, opts = {}) {
    const url = opts.qs ? `${ENDPOINT}?${opts.qs}` : ENDPOINT;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401) { logout(); throw new Error("unauthorized"); }
    return res;
  }

  // ───────── Fetch + render ─────────
  async function load() {
    tbody.innerHTML = `<tr><td colspan="4" class="loader"><span class="loader-dot"></span><span class="loader-dot"></span><span class="loader-dot"></span></td></tr>`;
    try {
      const res = await api("GET");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error");
      renderStats(data.stats);
      renderEntries(data.entries ?? []);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty">Error al cargar: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function renderStats(stats) {
    if (!stats) return;
    weekHoursEl.innerHTML = `${formatHoursVal(stats.week_hours)}<span class="unit">h</span>`;
    monthHoursEl.innerHTML = `${formatHoursVal(stats.month_hours)}<span class="unit">h</span>`;
    yearHoursEl.innerHTML = `${formatHoursVal(stats.year_hours)}<span class="unit">h</span>`;

    weekHoursEl.classList.remove("warn");
    weekSub.textContent = `desde ${formatDate(stats.week_start)}`;

    if (stats.month_hours > 80) {
      monthHoursEl.classList.add("warn");
      const exceso = Number((stats.month_hours - 80).toFixed(2));
      monthSub.textContent = `superas las 80h · +${formatHoursVal(exceso)}h por encima`;
    } else {
      monthHoursEl.classList.remove("warn");
      const restantes = Number((80 - stats.month_hours).toFixed(2));
      monthSub.textContent = `${formatHoursVal(restantes)}h hasta el tope de 80h`;
    }
  }

  function formatHoursVal(n) {
    const v = Number(n);
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(2).replace(/\.?0+$/, "");
  }

  function renderEntries(entries) {
    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty">Aún no has registrado horas. Añade la primera arriba.</td></tr>`;
      return;
    }
    tbody.innerHTML = entries.map((e) => `
      <tr data-id="${escapeHtml(e.id)}">
        <td>${escapeHtml(formatDate(e.worked_on))}</td>
        <td class="hours">${escapeHtml(formatHours(e.hours))}</td>
        <td>${escapeHtml(e.note ?? "")}</td>
        <td class="actions">
          <button data-action="edit">Editar</button>
          <button data-action="delete" class="danger">Borrar</button>
        </td>
      </tr>
    `).join("");
  }

  // ───────── Add ─────────
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    qaErr.classList.remove("show");

    const worked_on = qaDate.value;
    const hours = Number(qaHours.value);
    const note = qaNote.value.trim() || null;

    if (!worked_on || !hours || hours <= 0 || hours > 24) {
      qaErr.textContent = "Revisa fecha y horas (0.25 - 24)";
      qaErr.classList.add("show");
      return;
    }

    const submitBtn = addForm.querySelector("button.save");
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";

    try {
      const res = await api("POST", { body: { worked_on, hours, note } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error");
      qaHours.value = "";
      qaNote.value = "";
      submitBtn.textContent = "Guardado ✓";
      setTimeout(() => { submitBtn.textContent = "Guardar"; submitBtn.disabled = false; }, 900);
      load();
    } catch (err) {
      qaErr.textContent = err.message;
      qaErr.classList.add("show");
      submitBtn.textContent = "Guardar";
      submitBtn.disabled = false;
    }
  });

  // ───────── Edit / Delete ─────────
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = tr.dataset.id;
    const action = btn.dataset.action;

    if (action === "delete") {
      if (!confirm("¿Borrar este registro? No se puede deshacer.")) return;
      try {
        const res = await api("DELETE", { qs: `id=${encodeURIComponent(id)}` });
        if (!res.ok) throw new Error("error");
        load();
      } catch (err) {
        alert("Error al borrar");
      }
      return;
    }

    if (action === "edit") {
      const cells = tr.querySelectorAll("td");
      const isoDate = (() => {
        const [d, m, y] = cells[0].textContent.split("/");
        return `${y}-${m}-${d}`;
      })();
      const hoursVal = cells[1].textContent.replace("h", "").trim();
      const noteVal = cells[2].textContent;

      cells[0].innerHTML = `<input type="date" value="${isoDate}" />`;
      cells[1].innerHTML = `<input type="number" step="0.25" min="0.25" max="24" value="${hoursVal}" />`;
      cells[2].innerHTML = `<input type="text" maxlength="500" value="${escapeHtml(noteVal)}" />`;
      cells[3].innerHTML = `<button data-action="save">Guardar</button><button data-action="cancel">Cancelar</button>`;
      return;
    }

    if (action === "cancel") { load(); return; }

    if (action === "save") {
      const cells = tr.querySelectorAll("td");
      const payload = {
        worked_on: cells[0].querySelector("input").value,
        hours: Number(cells[1].querySelector("input").value),
        note: cells[2].querySelector("input").value.trim() || null,
      };
      try {
        const res = await api("PATCH", { qs: `id=${encodeURIComponent(id)}`, body: payload });
        if (!res.ok) throw new Error("error");
        load();
      } catch (err) {
        alert("Error al guardar");
      }
    }
  });

  logoutBtn.addEventListener("click", logout);

  load();
})();
