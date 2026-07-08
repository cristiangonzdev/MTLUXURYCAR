# Brief de rediseño — MT Lux Cars

**Documento de dirección creativa y UX para el rediseño de mtluxcars (Arrecife, Lanzarote)**
Versión 1.0 · Julio 2026 · Alcance: estética, estructura y presentación. **Prohibido tocar datos de vehículos, precios, contacto, lógica de negocio y textos legales.**

---

## 1. Diagnóstico: por qué hoy se lee como "marketplace"

El sitio actual tiene una base técnica sólida (estático, rápido, SEO bien resuelto, paleta con nombre propio) pero su **gramática visual es la de un portal de anuncios**, no la de una casa de coches de lujo. Los síntomas concretos:

- **La tarjeta de vehículo vende, no presenta.** Imagen 16:10 + badge de categoría + contador de fotos + precio + dos botones ("Ver ficha" / WhatsApp) es exactamente la anatomía de una tarjeta de coches.net. Cuanta más información y más botones por tarjeta, más "stock" y menos "pieza".
- **Estética de oferta.** El PVP tachado del BMW XM (135.520 € → 118.900 €) es lenguaje de outlet. Girardo, Kidston o RM Sotheby's jamás tachan un precio: el descuento agresivo comunica rotación, no deseo.
- **El contador "11 piezas en exposición"** en cabecera suena a inventario. Once coches es poco para un marketplace pero es perfecto para una *colección curada* — hoy el copy juega en la liga equivocada.
- **Home desincronizada.** Las 3 tarjetas hardcodeadas (G63, S63, Panamera) no reflejan el catálogo real ni su pieza más potente (el XM 50e, el único con reportaje fotográfico profesional). Una web de lujo no puede tener su escaparate desactualizado: erosiona exactamente la confianza que se quiere transmitir.
- **El rojo lava trabaja demasiado.** El propio CSS dice "usar con cuentagotas", pero `.btn-lava` lo convierte en el color de acción principal. Un acento saturado en cada CTA es lenguaje de conversión, no de elegancia.
- **El verde WhatsApp rompe la paleta** en cada tarjeta. Es el elemento más "milanuncios" de todo el sitio.
- **La ficha es una tabla, no una historia.** El modal actual (spec-grid + listas + highlight de precio) informa pero no seduce. Falta el bloque narrativo que en los referentes de ocasión de lujo va *antes* de la ficha técnica.
- **Fotografía sin dirección de arte.** 10 de 11 coches con fotos verticales de móvil conviviendo con un reportaje 16:9 profesional. La inconsistencia se nota más que la calidad individual.

**Lo que ya está bien y se conserva:** la paleta basalto/cal/ceniza (identidad volcánica canaria, muy pocas webs de motor la tienen), IBM Plex Mono como voz "ficha técnica editorial", el nav con blur al scroll, y toda la capa SEO/schema.org.

---

## 2. Posicionamiento y tono de voz

**Concepto de marca:** *La colección privada de Lanzarote.* No un concesionario con stock: un curador con once piezas escogidas. Todo el copy se deriva de esa idea.

**Reglas de tono:**

- **Sobrio, casi periodístico.** Cero superlativos de venta ("¡increíble!", "oportunidad única"). La autoridad se demuestra con precisión: kilómetros exactos, nombre real de la pintura, historial documentado.
- **Vocabulario de colección:** "pieza", "en exposición", "incorporación reciente", "visita privada", "consulta". Nunca "stock", "ofertas", "chollos", "unidades".
- **Nombrar los colores reales de pintura como hace Bentley.** "Black Sapphire Metalizado. Interior en cuero Merino Sakhir Orange." es copy de lujo gratuito: ya está en los datos.
- **El precio se enuncia, no se grita.** Y "Precio a consultar" se convierte en un activo: *"Precio bajo consulta privada"* — en el mundo del private treaty, no mostrar precio es señal de exclusividad, no de carencia.

**Ejemplos concretos:**

| Contexto | Hoy (o típico) | Propuesto |
|---|---|---|
| Hero H1 | Genérico de concesionario | **"Piezas escogidas. Historial verificado. Lanzarote."** |
| CTA principal | "Ver vehículos" | **"Ver la colección"** |
| CTA ficha | "Contactar" / botón WhatsApp verde | **"Solicitar visita privada"** + "WhatsApp directo" como secundario |
| Contador | "11 piezas en exposición" | **"Once piezas. Ninguna al azar."** |
| Asesoramiento | "Búsqueda por encargo" | **"Su próximo coche, buscado a medida"** |
| PVP tachado XM | ~~135.520 €~~ 118.900 € | **"118.900 € · PVP de nuevo: 135.520 €"** (dato de contexto en mono pequeño, sin tachado) |

---

## 3. Sistema visual

### 3.1 Tipografía — evolucionar, no reemplazar

Mantener **Archivo + IBM Plex Mono**: la pareja ya tiene carácter y evita añadir peso de descarga. Lo que falla no son las fuentes sino su **jerarquía y escala**. Cambios:

- **Archivo en modo display real para titulares:** `font-weight: 500–600`, `font-stretch: 110–125%`, `letter-spacing: -0.02em`, y tamaños valientes: `clamp(2.5rem, 7vw, 5.5rem)` en hero, `clamp(2rem, 4vw, 3.25rem)` en H2. El lujo se reconoce en titulares grandes con mucho aire alrededor.
- **IBM Plex Mono solo para metadatos:** labels, nav, precios, specs, contadores de galería — siempre en mayúsculas, `letter-spacing: 0.12em`, tamaño 0.75–0.8125rem, color `--piedra`. Nunca para párrafos.
- **Cuerpo de texto:** Archivo regular 400, `line-height: 1.7`, ancho máximo de lectura `65ch`.
- **No añadir una serif.** Tentador (Fraunces, Cormorant), pero una tercera familia sin build step es peso extra y riesgo de "disfraz". Archivo bien estirado en cuerpos grandes ya da la personalidad que piden los referentes OEM.

### 3.2 Paleta — misma familia, nuevo reparto de papeles

Conservar los tokens y **añadir un acento cálido metálico** que sustituya al rojo lava en el 90% de sus usos actuales:

```css
--basalto: #131512;      /* se mantiene — pasa a ser fondo PROTAGONISTA (hero, ficha, footer) */
--basalto-2: #1C1E1B;    /* se mantiene — superficies elevadas sobre basalto */
--cal: #F7F6F1;          /* se mantiene — secciones de respiro y texto sobre oscuro */
--ceniza: #E4E2D9;       /* se mantiene — bordes, divisores hairline */
--piedra: #75746B;       /* se mantiene — metadatos */
--arena-dorada: #B9A27B; /* NUEVO — acento cálido: hovers, subrayados, detalles, precio destacado */
--lava: #D93B1F;         /* se DEGRADA a detalle quirúrgico: un filete, un estado activo. Nunca en botones grandes */
```

La `--arena-dorada` (un bronce apagado, ni oro brillante ni beige) conecta con las arenas de Famara y con el cuero Sakhir Orange del XM. Regla: **el color de la web es la ausencia de color** — basalto, cal y ceniza estructuran; arena acentúa; lava puntúa. El color de verdad lo ponen los coches.

**Inversión clave:** hoy la web es clara con toques oscuros. Debe pasar a **oscuro-dominante en las zonas de producto** (hero, colección, ficha, footer sobre `--basalto`) con secciones claras (`--cal`) para narrativa y confianza. El fondo oscuro perdona mejor las fotos de móvil y da instantáneamente el registro de las webs OEM.

### 3.3 Fotografía — la decisión más importante del rediseño

**Problema:** 10 coches con fotos verticales 3:4 de móvil, 1 con reportaje horizontal profesional.

**Solución de maquetación inmediata (con las fotos que hay):**

- **Normalizar todas las tarjetas a un contenedor 4:5 vertical** (no 16:10). Las fotos verticales llenan el marco de forma natural con `object-fit: cover`; las horizontales del XM se recortan bien a 4:5 centrando el coche. Un grid de retratos verticales uniformes se lee como galería de arte; un grid donde unas fotos "caben" y otras no, se lee como anuncios de particulares.
- **Fundido de suelo:** overlay `linear-gradient(180deg, transparent 60%, rgba(19,21,18,0.55))` en la base de cada imagen sobre fondo `--basalto`, para que las fotos con fondos dispares (calle, parking) se integren y el pie de tarjeta asiente sobre zona oscura.
- **En la galería del modal, respetar la orientación nativa** de cada foto (contenedor flexible con `max-height: 80vh`), nunca forzar recortes ahí: la galería es documento, la tarjeta es escaparate.
- **Reservar los formatos panorámicos (hero, destacados) exclusivamente para el XM 50e**, el único con material 16:9 digno.

**Dirección de arte para fotografía futura (entregar al propietario como guía):**

- Por cada coche: 1 plano 3/4 frontal horizontal 16:9 (hero), 1 vertical 3:4 (tarjeta), perfil, trasera 3/4, 3–4 detalles (llanta, faro, costura, cuadro), 3–4 de interior.
- Fondo neutro y constante: pared de hormigón, nave diáfana, o —diferencial de Lanzarote— **paisaje volcánico al atardecer** (malpaís, Timanfaya como telón): coherencia total con la paleta basalto/lava/arena y algo que ningún concesionario peninsular puede replicar.
- Hora dorada o luz difusa; nunca flash directo ni mediodía. Coche limpio, matrícula real (transmite legalidad, no ocultarla).
- Prioridad: reportaje del siguiente coche que entre en stock + re-shoot de los 3 Porsche.

### 3.4 Iconografía y motion

- **Iconos:** línea fina 1.5px, monocromos (`currentColor`), set único (Lucide vía SVG inline copiado, sin CDN). Prohibidos emojis y el icono verde oficial de WhatsApp fuera del color de la paleta.
- **Motion:** reveal al scroll (fade + translateY 16px, 500ms, `IntersectionObserver`), zoom sutil de imagen en hover de tarjeta (`scale(1.03)`, 600ms ease), subrayado animado en enlaces de nav, contador de galería con transición. Todo envuelto en `@media (prefers-reduced-motion: reduce)`. Nada de parallax agresivo ni autoplay.

---

## 4. Arquitectura de información — página por página

### 4.1 Home (`index.html`)

1. **Hero a pantalla completa sobre `--basalto`** con la mejor foto 16:9 del BMW XM 50e. Composición: metadato en mono arriba ("MT LUX CARS · ARRECIFE, LANZAROTE"), H1 grande, un solo CTA ghost ("Ver la colección") + enlace secundario textual ("Búsqueda a medida →"). Una pieza, una escena — sin carrusel.
2. **Resolver la sección "En exposición" desincronizada — cambio estructural obligatorio:** extraer el array `cars` de `vehiculos.html` (línea ~1006) a un archivo compartido **`js/cars.js`** (copiar-pegar literal, **sin alterar un solo dato**), cargado por ambas páginas. La home renderiza dinámicamente 3–4 destacados desde ese array (por flag `featured` añadido como *campo nuevo*, o por posición). Así el escaparate nunca vuelve a mentir. Presentación: no grid — **piezas alternadas a ancho completo o 2/3**, una por "escena", con nombre + nombre de pintura + enlace.
3. **Sección de confianza narrativa** (fondo `--cal`): sustituir la stat card por **el proceso en 3 pasos** — "01 Selección e historial verificado / 02 Visita privada en Arrecife / 03 Entrega y matriculación en Canarias" — numerados en mono, texto breve. El proceso explicado vende más confianza que un sello.
4. **"Búsqueda a medida"** se mantiene como cierre, elevando el copy (ver §2), y footer nuevo (§5).

### 4.2 Colección (`vehiculos.html`)

- **Renombrar la página a "La Colección"** (título visible; mantener URL y `<title>` SEO con "vehículos" dentro).
- **Grid de 2 columnas en desktop, 1 en móvil** (hoy probablemente 3): once piezas en dos columnas espaciadas (gap 3–4rem) respiran como colección; en tres, parecen resultados de búsqueda.
- **Filtros como índice editorial, no toolbar:** enlaces de texto en mono con subrayado activo en `--arena-dorada` ("Todas / Sedán / SUV / Gran Turismo" + opcionalmente "BMW / Mercedes-Benz / Porsche"), sin cajas ni pills grises.
- **Precio en el listado: mantenerlo pero silenciarlo.** No podemos ocultar datos, pero sí jerarquizarlos: precio en mono 0.8125rem color `--piedra`, sin negrita, bajo el nombre. "Precio a consultar" → "Bajo consulta privada". **Eliminar del listado:** contador de fotos, doble botón (la tarjeta entera es clicable), badges llamativos.
- **Orden curado, no cronológico:** XM primero, luego alternando marcas para que ninguna sección parezca "el rincón Mercedes".

### 4.3 Ficha de vehículo (rediseño del modal)

Mantener el modal en Fase 1 (sin multiplicar páginas estáticas), pero reordenarlo como **relato, no tabla**:

1. **Cabecera:** categoría en mono → nombre grande → una línea de carácter (el nombre de la pintura o el dato más notable: *"600 km. Prácticamente estrenado."*).
2. **Galería inmersiva primero:** imagen principal a máxima altura, flechas hairline, contador "03 / 10" en mono, tira de miniaturas, swipe táctil.
3. **Bloque narrativo "La pieza"** (2–4 frases redactadas desde los datos existentes: qué es, en qué estado está, por qué está en la colección). Adaptación honesta del "provenance" de subasta al coche de ocasión real: aquí la procedencia es **kilometraje certificado, historial verificado, procedencia nacional/importación, mantenimiento** — datos que ya existen en las descripciones, reordenados en prosa.
4. **Ficha técnica** después: la `spec-grid` actual en dos columnas, labels en mono versalitas, valores en Archivo, divisores hairline `--ceniza`.
5. **Precio sobrio + CTAs:** precio en Archivo medium (sin caja destacada ni tachados), debajo **"Solicitar visita privada"** (botón outline arena que rellena en hover) y **"WhatsApp directo"** (texto + icono monocromo). El bloque de contacto también fijo/visible junto al título en desktop, como hacen Girardo o Tomini.

### 4.4 Asesoramiento, Blog, Contacto, Legales

- **Asesoramiento:** reposicionar como servicio insignia "Búsqueda a medida": qué se busca, cómo (red de proveedores, verificación), 3 pasos, formulario breve. Es el equivalente al "consignment" visible de los referentes: demuestra que MT Lux no vende lo que le llega, sino lo que elige.
- **Blog:** rebautizar visualmente como **"Cuaderno"**: listado editorial (fecha en mono + titular grande + entradilla, sin thumbnails de stock), plantilla de post a `65ch` con la nueva tipografía. Es el vehículo natural para storytelling de piezas ("Por qué el XM 50e") sin tocar las fichas.
- **Contacto:** enfocado a **cita privada**: horario, mapa, formulario mínimo (nombre, teléfono, mensaje, preferencia de contacto), datos actuales intactos.
- **Legales:** solo coherencia pasiva: nuevo nav/footer, tipografía y tokens, ancho de lectura. **Ni una palabra del texto legal se toca.**

---

## 5. Componentes clave

- **Nav:** mantener el patrón transparente→blur. Wordmark "MT LUX CARS" en Archivo expandido tracking amplio; enlaces en mono versalitas 0.75rem; CTA de nav como texto con subrayado arena, no botón sólido. Menú móvil fullscreen sobre basalto con enlaces grandes.
- **Footer:** elevarlo a footer denso de marca sobre `--basalto`: 4 columnas (Colección con enlaces por categoría · Servicios · Contacto con dirección/teléfono/WhatsApp/horario · Legal), wordmark grande arriba, "Arrecife, Lanzarote — Islas Canarias" como firma en mono.
- **Tarjeta de vehículo (`v-card`):** imagen 4:5 con gradiente de base → nombre (Archivo medium) → una línea de pintura/carácter en `--piedra` → precio en mono discreto. Sin botones internos, sin badges, hover con zoom sutil y subrayado arena en el nombre.
- **Botones:** retirar `.btn-lava` del uso general. Sistema nuevo: `.btn-primario` (outline 1px `--arena-dorada`, texto mono versalitas, hover rellena arena con texto basalto) y `.btn-texto` (enlace con flecha →). Lava queda para máximo un elemento por página.
- **WhatsApp:** conservar funcionalidad y números intactos; cambiar piel: icono SVG monocromo + "WhatsApp directo" en mono, dentro del sistema de botones. Nunca verde #25D366 flotante.
- **Señales de confianza:** franja fina en mono bajo el hero o la colección: "HISTORIAL VERIFICADO · GARANTÍA · ENTREGA EN CANARIAS · MATRICULACIÓN Y GESTIÓN INCLUIDAS" — hairlines, sin iconos de escudo ni estrellas.
- **Formularios:** labels en mono versalitas, inputs solo con borde inferior 1px `--ceniza` (focus: arena), botón del sistema. `focus-visible` y `aria-label` en todo.

---

## 6. Estrategia de contenido para el catálogo multimarca

- **La marca paraguas es MT Lux Cars, no BMW/Mercedes/Porsche.** Prohibido usar logotipos de fabricante como elemento decorativo grande: los tres nombres aparecen siempre en texto, con la misma tipografía. La cohesión la da el marco (fondo, tipografía, tratamiento), no la marca del coche.
- **Curación por carácter, no solo por carrocería.** Los filtros funcionales se mantienen, pero el copy puede agrupar editorialmente: el XM y el G63 son "presencia"; los GLC/CLA/X5 híbridos son "uso diario extraordinario"; Cayenne/Panamera/S63 son "gran turismo". Esto permite que un CLA de 31.900 € conviva dignamente con un G63: no compiten en precio, ocupan papeles distintos de la colección.
- **El XM 50e como pieza insignia, sin canibalizar:** protagoniza el hero de la home y abre la colección con la única tarjeta "ancha" (ocupando 2 columnas, aprovechando su 16:9), con etiqueta en mono "PIEZA DESTACADA". Todo lo demás recibe exactamente el mismo tratamiento de tarjeta: la jerarquía es de posición y tamaño, nunca de calidad de presentación. Cuando el XM se venda, el destacado rota por flag en `js/cars.js`.
- **Cada descripción existente se conserva íntegra**; el rediseño solo la re-maqueta (narrativa arriba, specs abajo). Para futuras incorporaciones, plantilla de redacción: 1ª frase = qué es y su estado; 2ª = el detalle memorable (pintura, tapicería, km); 3ª = situación práctica (garantía, entrega, matriculación).

---

## 7. Restricciones técnicas (innegociables)

- **Sin framework ni build step.** Todo HTML/CSS/JS plano editable a mano. Fuentes vía Google Fonts como hasta ahora.
- **Datos intocables:** el contenido del array `cars` (`vehiculos.html:1006`) — nombres, precios, specs, descripciones, rutas de imagen — no se modifica. Única operación permitida: **moverlo literal a `js/cars.js`** y, como campos *añadidos* (nunca editados), `featured` y opcionalmente `tagline`. Teléfonos, WhatsApp, emails, dirección y textos legales: intactos.
- **SEO se preserva:** meta OG/Twitter, JSON-LD (AutoDealer, CollectionPage, BreadcrumbList), `sitemap.xml`, `robots.txt`, URLs actuales sin cambios. Si cambia algún H1 visible, actualizar el JSON-LD en consecuencia, no eliminarlo.
- **Rendimiento:** mantener `loading="lazy"` en todas las imágenes fuera del hero, `fetchpriority="high"` solo en la imagen de hero, sin librerías JS nuevas (el motion se resuelve con CSS + `IntersectionObserver` vanilla).
- **Mobile-first:** el 80%+ del tráfico de un concesionario local es móvil. Hero, tarjetas y modal se diseñan primero a 390px. El modal-galería debe soportar swipe.
- **Accesibilidad:** conservar y extender `:focus-visible`, `aria-label` en botones de icono, `aria-modal` y trap de foco en el modal, contraste AA (verificar arena `#B9A27B` sobre basalto para texto pequeño; si falla, aclarar a `#C6B08A`).
- **No tocar:** `cookies.js`, `track-credit.js`, script de Vercel Analytics.

---

## 8. Plan de ejecución por fases

### Fase 1 — El salto de percepción (1–2 días de trabajo, ~80% del impacto)
- [ ] Añadir token `--arena-dorada`; degradar `--lava` a detalle; crear `.btn-primario` outline y retirar `.btn-lava` del uso general
- [ ] Nuevo hero de home: XM 50e a pantalla completa sobre basalto, H1 nuevo, un CTA
- [ ] Rediseñar `v-card`: contenedor 4:5, gradiente de base, sin badges ni doble botón, precio silenciado en mono
- [ ] Colección a 2 columnas, filtros como índice de texto, eliminar tachado visual del PVP (→ "PVP de nuevo: …")
- [ ] Re-skin de botones WhatsApp (monocromo, dentro del sistema)
- [ ] Nueva escala tipográfica (clamps de titulares, mono solo en metadatos)

### Fase 2 — Estructura y narrativa (2–4 días)
- [ ] Extraer `cars` a `js/cars.js` + flag `featured`; home dinámica con destacados reales (verificar que `vehiculos.html` sigue renderizando idéntico)
- [ ] Reordenar el modal-ficha: galería → narrativa "La pieza" → specs → precio sobrio + "Solicitar visita privada"
- [ ] Sección "proceso en 3 pasos" en home; franja de confianza en mono
- [ ] Footer denso de 4 columnas en todas las páginas; nav refinado
- [ ] Re-skin de asesoramiento, contacto y formularios; coherencia pasiva en legales

### Fase 3 — Acabado y contenido (continuo)
- [ ] Entregar la guía de dirección de arte fotográfica al propietario; re-shoot de los Porsche
- [ ] Plantilla editorial de blog/"Cuaderno" + primer post de pieza destacada
- [ ] Microinteracciones: reveals, hover de galería, transiciones de filtro (con `prefers-reduced-motion`)
- [ ] Evaluar páginas estáticas por vehículo (SEO long-tail) solo si el flujo de stock lo justifica
- [ ] Auditoría final: Lighthouse ≥ 90 en móvil, contraste AA, trap de foco del modal, JSON-LD validado

**Criterio de éxito:** que un visitante que no conozca MT Lux Cars, al ver la home 5 segundos en el móvil, la describa con las palabras del propietario — *lujo, confianza, profesionalidad* — y que al ponerla junto a gtcarscanarias.com la diferencia no sea de grado, sino de categoría.
