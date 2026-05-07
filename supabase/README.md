# MT Lux Cars — Captura de leads

Backend en Supabase (Edge Functions + tabla `leads` con RLS) para un sitio HTML estático.

---

## 1. Esquema SQL

Abrir Supabase → **SQL Editor** → ejecutar `supabase/schema.sql`.

Es idempotente: se puede ejecutar múltiples veces. Aplica:

- Defaults / NOT NULL / CHECK constraints en `leads`.
- Trigger `set_updated_at`.
- Índices para el dashboard.
- **RLS cerrada** (solo `service_role` accede; nadie con `anon` lee/escribe).

---

## 2. Variables de entorno (Edge Functions secrets)

Generar la `ADMIN_KEY`:

```bash
openssl rand -base64 32
```

En Supabase → **Settings → Edge Functions → Secrets**, configurar:

| Nombre | Valor |
|---|---|
| `SUPABASE_URL` | (ya existe, autoinyectada por Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | (ya existe, autoinyectada por Supabase) |
| `ADMIN_KEY` | salida de `openssl rand -base64 32` |

> Nota: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están disponibles automáticamente en Edge Functions sin necesidad de configurarlas como secrets.

---

## 3. Despliegue de Edge Functions

Requiere [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# Login
supabase login

# Linkear el proyecto (solo la primera vez)
supabase link --project-ref <YOUR_PROJECT_REF>

# Desplegar las 4 funciones
supabase functions deploy submit-lead
supabase functions deploy list-leads
supabase functions deploy update-lead
supabase functions deploy admin-login

# Configurar el secret ADMIN_KEY
supabase secrets set ADMIN_KEY="<paste_openssl_output>"
```

Alternativa sin CLI: copiar/pegar el código de cada `supabase/functions/<name>/index.ts` en el editor del dashboard de Supabase (`Edge Functions → New Function`). Hacer lo mismo para los archivos de `_shared/` (cors.ts, auth.ts, validation.ts) — al usar la CLI estos se comparten automáticamente; en el dashboard debes inlinear o duplicar.

---

## 4. Configurar el frontend

Editar `js/config.js` y reemplazar `YOUR_PROJECT_REF` por el ref real de tu proyecto Supabase:

```js
window.MTLUX_CONFIG = {
  FUNCTIONS_URL: "https://abcdefghij.supabase.co/functions/v1",
};
```

Lo encuentras en Supabase → **Settings → General → Reference ID**.

---

## 5. Endpoints

| Método | URL | Auth | Cuerpo |
|---|---|---|---|
| `POST` | `/functions/v1/submit-lead` | público (rate-limit 5/min/IP) | `{ email, phone?, intent, vehicle_id, vehicle_name?, vehicle_price?, source?, utm_source?, utm_medium?, utm_campaign? }` |
| `POST` | `/functions/v1/admin-login` | público | `{ password }` → `{ token, expires_at }` |
| `GET` | `/functions/v1/list-leads?status=&intent=&q=&from=&limit=&offset=` | `Authorization: Bearer <token>` | — |
| `PATCH` | `/functions/v1/update-lead?id=<uuid>` | `Authorization: Bearer <token>` | `{ status?, notes? }` |

CORS abierto a `https://www.mtluxcars.com`, `https://mtluxcars.com` y `localhost`.

---

## 6. Tests manuales

### Test 1 — email inválido
1. Abrir un coche cualquiera en `vehiculos.html`.
2. En el form del modal, escribir `noesemail` y pulsar "Recibir informe completo".
3. ✅ Debe mostrar error en cliente, sin POST a la API. En DevTools → Network no aparece request a `submit-lead`.

### Test 2 — submit válido
1. Email válido + intención seleccionada → submit.
2. ✅ Debe aparecer fila en Supabase (Table Editor → `leads`).
3. ✅ Debe aparecer en el dashboard `/admin/leads.html` tras login.

### Test 3 — acceso admin sin token
1. Abrir `/admin/leads.html` directamente sin haber pasado por el login.
2. ✅ Debe redirigir a `/admin/login.html` (porque no hay token en sessionStorage o ha expirado).

---

## 7. Decisiones técnicas (`// CHOICE:`)

- **Token Bearer en sessionStorage** sobre cookie httpOnly. Razón: dashboard (`mtluxcars.com`) y Edge Functions (`supabase.co`) en dominios distintos; cookies cross-site son frágiles. Token HMAC con expiración 7d resuelve igual de bien con un solo usuario admin.
- **`text` + CHECK constraint** sobre tipos `enum` de Postgres en `intent` y `status`. Razón: añadir un valor a un enum requiere migración; un CHECK se modifica en una línea.
- **RLS completamente cerrada** sobre INSERT público desde anon. Razón: tener un Edge Function `submit-lead` que captura `ip`/`user_agent` y aplica rate-limit es estrictamente mejor que abrir la tabla a `anon`.
- **Rate-limit in-memory** en `submit-lead`. `// TODO: migrar a Upstash Redis o KV cuando exista volumen real.` Las Edge Functions reusan instancia entre invocaciones; es best-effort, no garantía.

---

## 8. Estructura de archivos

```
mtlux-web/
├─ admin/
│  ├─ login.html              ← form de password, guarda token en sessionStorage
│  └─ leads.html              ← dashboard
├─ js/
│  ├─ config.js               ← MTLUX_CONFIG.FUNCTIONS_URL (editar tras crear proyecto)
│  ├─ lead-form.js            ← componente form, montado en cada modal de vehículo
│  └─ admin-dashboard.js      ← lógica del dashboard
├─ supabase/
│  ├─ schema.sql              ← ejecutar en SQL Editor
│  ├─ README.md               ← este archivo
│  └─ functions/
│     ├─ _shared/
│     │  ├─ cors.ts
│     │  ├─ auth.ts
│     │  └─ validation.ts
│     ├─ submit-lead/index.ts
│     ├─ list-leads/index.ts
│     ├─ update-lead/index.ts
│     └─ admin-login/index.ts
└─ vehiculos.html             ← modificado: form se inyecta en modal por car
```
