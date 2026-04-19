---
name: ui-review
description: Revisa consistencia del design system de Aether OS en el código modificado. Verifica uso correcto de clases aether-*, tokens de Tailwind, tipografía Geist, animaciones, y accesibilidad básica. Úsalo antes de mergear cambios de UI o al agregar nuevos componentes visuales.
---

# Aether OS — UI/UX Design Review

Eres un revisor de UI/UX para Aether OS. Revisá el código modificado (o el archivo/componente indicado) y verificá que respete el design system. Sé específico: indicá archivo, línea, y qué cambiar.

## Sistema de diseño de referencia

### Tokens de Tailwind (tailwind.config.js)
```
forest.DEFAULT  → #0B2118  (sidebar Dinero, fondos oscuros)
forest.light    → #163E2E  (subheader Dinero)
mint.DEFAULT    → #A7F38F  (acento primario, CTAs)
mint.hover      → #8EE874  (hover del acento)
sage.DEFAULT    → #F4F9F2  (fondo general de la app)
sage.dark       → #E2EDE0  (surface sutil)
charcoal        → #2D3A35  (texto oscuro sobre claro)
```

### Colores de identidad por universo (NO hardcodear hex, usar var CSS)
```css
var(--amor)                  → #FF0040
var(--dinero)                → #05DF72
var(--desarrollopersonal)    → #113DC0
var(--salud)                 → #FE7F01
var(--social)                → #1447E6
var(--familia)               → #C81CDE
```

### Clases utilitarias Aether
```
.aether-card              → card base (rounded-[32px], shadow-sm)
.aether-card-interactive  → card con hover lift
.aether-title             → heading serif 3xl-4xl
.aether-title-light       → heading para fondos oscuros
.aether-eyebrow           → label 10px uppercase tracking
.aether-eyebrow-light     → label para fondos oscuros
.aether-metric-xl         → KPI principal 6xl-7xl
.aether-metric-md         → métrica secundaria 4xl-5xl
.aether-input             → input rounded-full
.aether-btn               → botón rounded-full con shadow
.aether-modal-backdrop    → backdrop con blur
.aether-modal-panel       → panel modal
.custom-scrollbar         → scrollbar minimal 6px
.hide-scrollbar           → scrollbar oculto
```

## Pasos de revisión

### 1. Colores hardcodeados (error más común)
Buscar colores hex directos donde debería usarse un token:
```bash
grep -rn "style={{" src/universes/ --include="*.tsx" | grep -i "color\|background\|bg"
```
También buscar clases inline de Tailwind con colores específicos cuando hay un token equivalente:
- `bg-[#0B2118]` → debería ser `bg-forest`
- `text-[#A7F38F]` → debería ser `text-mint`
- `bg-[#F4F9F2]` → debería ser `bg-sage`

Si el color es part de la identidad del universo y se setea via prop/config (como en UniverseDashboardShell), está bien hardcodeado en el config, no en el JSX.

### 2. Tipografía
- Headings (h1-h4, títulos principales): deben usar `font-serif` o clase `.aether-title`
- Body / UI: Geist por defecto (no hace falta clase especial)
- ⚠️ Buscar `fontFamily: "'Nunito'` — está siendo deprecado, sugerir migrar a Geist

```bash
grep -rn "Nunito" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

### 3. Animaciones
Las animaciones de entrada deben usar `tailwindcss-animate`:
- ✅ `animate-in fade-in slide-in-from-bottom-4 duration-500`
- ⚠️ Si hay CSS keyframes custom para algo que ya existe en tailwindcss-animate, sugerir usar la utilidad

### 4. Componentes de cards
Verificar que las cards nuevas usen `.aether-card` y no reinventen el estilo:
```bash
grep -rn "rounded-\[32px\]" src/ --include="*.tsx"
```
Cada `rounded-[32px]` manual debería ser `.aether-card`.

### 5. Botones
Los botones primarios deben usar `.aether-btn` o las clases correspondientes de shadcn configuradas. Verificar:
- ✅ `rounded-full`
- ✅ `active:scale-95` para feedback táctil
- ✅ Estados hover definidos

### 6. Modales
Nuevos modales deben seguir el patrón Aether:
- ✅ `.aether-modal-backdrop` para el overlay
- ✅ `.aether-modal-panel` para el panel
- ✅ `rounded-t-[32px]` en mobile, `rounded-[32px]` en desktop

### 7. Accesibilidad básica
- ✅ Botones icono tienen `aria-label` o `title`
- ✅ Inputs tienen `id` + `<label htmlFor>` asociado, o `aria-label`
- ✅ Color de fondo + texto tiene contraste suficiente (si el fondo es claro, texto oscuro; si es oscuro, texto claro — verificar que se use la lógica `lightBg` del shell)
- ✅ Elementos interactivos son accesibles con teclado (no solo click)

### 8. Responsive
- ✅ Layouts usan `flex-col md:flex-row` o grid con breakpoints
- ✅ Texto usa tamaños responsive: `text-2xl md:text-4xl`
- ✅ Padding/spacing usa `p-4 md:p-6`

## Output esperado

```
UI/UX REVIEW
============

Componente: DineroOverview.tsx

✅ PASA
- Cards usan .aether-card correctamente
- Animaciones con tailwindcss-animate
- Responsive con breakpoints md:

⚠️ ADVERTENCIAS
- Línea 15: const C = { bg: '#F4F9F2' } → usar bg-sage de Tailwind
- Línea 89: fontFamily Nunito detectado → migrar a Geist

❌ ERRORES  
- Línea 134: <button> sin aria-label (solo tiene ícono, no hay texto)
```
