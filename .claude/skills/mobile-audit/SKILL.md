---
name: mobile-audit
description: Audita componentes de Aether OS desde la óptica mobile-first. Detecta touch targets chicos, overflow horizontal, safe-area faltante, clases Tailwind inválidas, interacciones hover-only sin :active, tipografía microscópica, inputs sin inputMode/autoComplete, y modales sin swipe-to-dismiss. Úsalo antes de cada release y al terminar cualquier feature que se vaya a usar en móvil.
---

# Aether OS — Mobile-First Audit

Eres un auditor especializado en experiencia móvil para Aether OS. Escaneá el código modificado (o el archivo/componente indicado) y reportá cada issue con **archivo:línea**, severidad, y la corrección concreta. La app corre primordialmente en iPhone/Android, así que los issues móviles son prioritarios.

## Filosofía

En dispositivos móviles el dedo es el cursor. Un botón de 32px es inaccesible. Un input sin `inputMode` fuerza teclado genérico y UX pobre. Un modal sin handle drag no se siente nativo. La velocidad percibida importa más que la real. Este audit asume iPhone SE (375×667) como baseline y Pixel 7 / iPhone 15 como target.

## Checks ordenados por impacto

### 1. Touch targets (CRÍTICO)
La HIG de Apple pide **44×44pt mínimo** para hit areas. Material Design pide 48×48dp.
- Botones con `h-8` (32px), `h-9` (36px), `p-1` o `p-1.5` como hit area principal → flag como **❌ error**
- Botones icono con `size={14}` y padding chico → flag
- Chips/pills inline en toolbars pueden ser `h-9` (36px) porque no son acciones primarias — OK pero evitá `h-8`

```bash
grep -rnE "h-[789]|p-1(\.5)?\b" src/universes/ocio/pantalla/ --include="*.tsx" | grep -v "// ok:"
```

### 2. Overflow horizontal (CRÍTICO)
El horizontal scroll involuntario es el bug #1 de mobile. Causas:
- `100vw` sin `overflow-x: hidden` en el padre
- Elementos con `w-[400px]` o anchos fijos > 320px
- `-mx-10` en contenedores sin `overflow-hidden`
- Grids con muchas columnas en mobile

Buscá:
```bash
grep -rnE "w-\[[0-9]{3,}px\]|-m[xl]-[8-9]|-m[xl]-1[0-9]" src/universes/ --include="*.tsx"
```
Y verificá que cada `overflow-x-auto` tenga un contenedor con `overflow-hidden` arriba.

### 3. Clases Tailwind inválidas (silenciosamente rotas)
Tailwind NO advierte cuando una clase no existe — simplemente no hace nada.
- `scale-*`: sólo `0, 50, 75, 90, 95, 100, 105, 110, 125, 150`. `scale-85`, `scale-97` NO existen.
- `duration-*`: múltiplos de 75ms (`75, 100, 150, 200, 300, 500, 700, 1000`). `duration-250` NO existe.
- `aspect-[*]`: debe ser ratio válido (`aspect-[2/3]` ok, `aspect-2/3` NO).
- `opacity-[0.XX]` debe usar brackets: `opacity-50` ok, `opacity-55` NO.
- `text-[10px]` está bien porque usa arbitrary value; `text-10` NO existe.

```bash
grep -rnE "scale-(8[0-9]|9[1-49]|9[6-9]|1[0-9])\b|duration-(2[0-9]|3[1-9]|4[0-9])\b|opacity-(5[1-9]|6[1-9])\b" src/ --include="*.tsx"
```

### 4. Safe-area insets (CRÍTICO en iPhone notch/home indicator)
Toda barra fija (header sticky, bottom nav, modal) debe respetar safe-area en iPhones con notch:
- `padding-top: env(safe-area-inset-top, 0px)` en headers fixed
- `padding-bottom: env(safe-area-inset-bottom, 0px)` en bottom navs y modales anclados abajo
- Secciones con contenido scrollable que termina cerca del borde necesitan padding bottom que INCLUYA `env(safe-area-inset-bottom)`

```bash
grep -rnE "fixed.*(top-0|bottom-0)|sticky.*top-0" src/ --include="*.tsx"
```
Cada match debe tener `env(safe-area-inset-*)` cerca (inline style o class custom).

### 5. Backdrop blur sin -webkit
Safari iOS < 18 requiere prefijo. Si usás `backdropFilter: 'blur(*)'` inline, agregá `WebkitBackdropFilter` también:
```tsx
style={{
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',  // ← Safari iOS
}}
```
Si usás la clase `backdrop-blur-*` de Tailwind, ya está — Tailwind genera el prefijo.

### 6. Hover-only interactions
`:hover` no dispara confiablemente en touch. Toda interacción visual debe tener un equivalente `:active` o `whileTap`:
- `hover:bg-white/10` sin `active:bg-white/15` → flag warning
- `hover:scale-105` sin `active:scale-95` → flag warning
- `group-hover:` en elementos clickeables puros → flag warning

### 7. Tipografía ilegible
En mobile, texto `<14px` es díficil de leer salvo que sea label secundario. Regla:
- Body text: mínimo `text-[13px]` (13px)
- Labels/captions: mínimo `text-[11px]` (11px)
- Eyebrows uppercase: ok hasta `text-[10px]` por ser cortos y espaciados (`tracking-[0.2em]`)
- Texto numérico tabular: mínimo `text-[12px]`

```bash
grep -rnE "text-\[(7|8|9)px\]|text-xs\b" src/universes/ --include="*.tsx"
```
(`text-xs` es 12px — ok, pero revisá el contexto)

### 8. Inputs sin UX móvil
Inputs de texto en mobile deben declarar:
- `inputMode`: `search`, `email`, `numeric`, `decimal`, `tel`, `url` — selecciona el teclado correcto
- `autoComplete`: `off`, `username`, `email`, `current-password`, etc.
- `autoCorrect="off"` para búsquedas/códigos
- `autoCapitalize="off"` cuando corresponda (búsqueda, código)
- `enterKeyHint`: `search`, `go`, `send`, `done` — mejora el botón del teclado

```bash
grep -rn "<input" src/universes/ --include="*.tsx" -A 3 | grep -v "inputMode\|type=\"(date\|number"
```

### 9. Modales/sheets sin drag-to-dismiss
Un bottom sheet que solo se cierra con un botón "Close" se siente pesado. Debe tener:
- Drag handle visible (`<div class="w-10 h-1 rounded-full bg-white/15" />`)
- `onPanEnd` de framer-motion que cierre si `info.offset.y > 80 || info.velocity.y > 400`
- Tap en el backdrop que cierre

### 10. Imágenes sin optimización
- Falta `loading="lazy"` → flag warning (no crítico para above-the-fold)
- Falta `draggable={false}` → feel raro en iOS si el usuario intenta tocar
- Sin `decoding="async"` → bloquea render en imágenes grandes
- `<img>` de backdrop/hero sin `fetchPriority="high"` cuando es LCP → flag sugerencia

### 11. Gestos y scroll
- `overflow-x-auto` horizontal sin `scroll-smooth` → feel áspero
- `overflow-x-auto` sin `snap-x` en carousels que tienen ítems discretos → flag
- Listas largas sin `scroll-padding-top` cuando hay header sticky — el scroll-into-view queda tapado
- `touch-action: none` en elementos que no lo necesitan bloquea el pan nativo

### 12. Z-index chaos
En mobile el stacking es crítico por modales + headers + bottom nav + toasts:
- `z-50` debe reservarse para modals/sheets
- `z-40` para toast/sonner
- `z-30` para headers/nav sticky
- Cualquier `z-[999]` o `z-50` en un elemento in-flow → flag

### 13. Viewport meta + CSS globals
Verificá `index.html`:
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`
- `viewport-fit=cover` es OBLIGATORIO si usás `env(safe-area-inset-*)`

En CSS global:
- `body { overscroll-behavior: contain; }` — evita pull-to-refresh accidental
- `* { -webkit-tap-highlight-color: transparent; }` — quita el flash azul iOS

### 14. Iconografía tamaño
`lucide-react` por defecto renderiza 24px. En action buttons mobile:
- Primary actions: 16–18px ok
- Secondary: 14–16px
- Chips/inline: 12–14px
- < 11px: se ve borroso en muchos devices, flag warning

### 15. Contrast & color-only signals
En mobile/exterior con sol:
- Texto sobre imágenes SIEMPRE necesita gradient wash (ej: `bg-gradient-to-t from-black/90`)
- Estado activo que solo cambia color (sin forma, borde o peso) es frágil — flag warning

## Output esperado

```
MOBILE AUDIT — Pantalla module
==============================

❌ CRÍTICO (3)
  1. PantallaShell.tsx:78 — active tab height h-7 (28px) < 44px target. Cambiar a h-10.
  2. TitleDetailView.tsx:503 — `active:scale-85` es clase inválida (no existe scale-85 en Tailwind). Usar scale-90.
  3. index.html — meta viewport sin viewport-fit=cover → safe-area-inset no funciona en iPhone con notch.

⚠️ WARNINGS (5)
  4. HomeView.tsx:120 — SearchBar sin inputMode="search" ni enterKeyHint="search".
  5. MoviesView.tsx:189 — GenreSheet sin drag-to-dismiss ni tap-backdrop (solo cierra con X).
  6. PantallaShell.tsx:45 — backdropFilter sin WebkitBackdropFilter (roto en Safari iOS 17).
  7. TitleDetailView.tsx — hero `aspect-[3/4]` en mobile ocupa ~75% viewport (ok, but flagged).
  8. UniverseBottomNav.tsx — z-40, correcto. Shell envolvente z-30, correcto.

💡 SUGERENCIAS (2)
  9. HomeView.tsx featured hero: agregar fetchPriority="high" al <img> backdrop (mejora LCP).
  10. SeasonEpisodes: lista larga, agregar scroll-padding-top para que scroll-into-view no quede tapado.

RESUMEN: 3 bloqueantes, 5 a corregir antes de release.
```

## Cómo usar

1. Si el usuario indica un archivo/directorio, auditá SOLO eso.
2. Si no, auditá el último diff relevante (`git diff --name-only HEAD`) filtrando `.tsx`/`.ts`.
3. Reportá en el formato de arriba. No arreglés nada — solo reportá.
4. Si hay más de 10 issues, ordená por severidad y mostrá top 10 + un "… y 5 más" al final.
