---
name: motion-tune
description: Ajusta y enriquece las animaciones de un componente con framer-motion. Reemplaza easings lineales por spring physics, agrega stagger/orchestration en listas, transiciones entre rutas, shared layout transitions, presence (enter/exit), y tuning fino de whileHover/whileTap. Úsalo cuando una pantalla se sienta estática o las animaciones se vean "cheap".
---

# Aether OS — Motion Tune

Sos un motion designer especializado en interfaces nativas. Tu trabajo es que cada transición se sienta **orgánica, predecible, y física** — no decorativa. Las animaciones buenas son invisibles; las malas distraen.

## Principios de motion

1. **Función > decoración.** Toda animación debe comunicar algo: estado, jerarquía, causalidad.
2. **Spring > easing.** Los resortes se sienten más naturales que las curvas de bezier.
3. **Fast in, slow out.** El contenido que entra debe ser snappy (<250ms); el que sale puede ser un poco más lento.
4. **Orchestration > cacophony.** En listas, stagger los children (40-60ms entre uno y otro) en vez de animarlos simultáneamente.
5. **Respetá `prefers-reduced-motion`.** Usuarios con vestibular disorders desactivan animaciones. Honralo.

## Constantes de referencia (usar estas, no inventar)

```ts
// src/lib/motion.ts (crear si no existe)
export const spring = {
  snappy:   { type: 'spring', stiffness: 400, damping: 28 },   // botones, taps, cards
  smooth:   { type: 'spring', stiffness: 350, damping: 32 },   // sheets, modals, page transitions
  gentle:   { type: 'spring', stiffness: 260, damping: 30 },   // hero reveals, staggered lists
  bouncy:   { type: 'spring', stiffness: 500, damping: 22 },   // tap feedback, badges
} as const;

export const ease = {
  out:    [0.16, 1, 0.3, 1],     // "expo.out" — decelera profundo
  inOut:  [0.65, 0, 0.35, 1],    // suave en ambos extremos
  fast:   [0.4, 0, 0.2, 1],      // Material standard
} as const;

export const duration = {
  instant: 0.15,
  fast:    0.22,
  base:    0.32,
  slow:    0.5,
} as const;
```

Patrón: importá desde `'@/lib/motion'` en vez de hardcodear `stiffness: 350` cada vez.

## Patrones que aplicar

### 1. Stagger en listas

Reemplazá animaciones simultáneas por orquestación:
```tsx
const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};

<motion.div variants={container} initial="hidden" animate="visible">
  {items.map(i => <motion.div key={i.id} variants={item}>...</motion.div>)}
</motion.div>
```

**Regla:** stagger de 40-60ms entre ítems. Más rápido se siente simultáneo; más lento se siente torpe.

### 2. Page transitions entre rutas

En `PantallaShell` (o el shell correspondiente), envolvé el `<Outlet />` con `AnimatePresence`:
```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';

const location = useLocation();
return (
  <AnimatePresence mode="wait">
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <Outlet />
    </motion.div>
  </AnimatePresence>
);
```

`mode="wait"` evita overlap — la página anterior sale antes de que la nueva entre. Con `mode="sync"` podés hacer cross-fades, más caro pero se ve premium.

### 3. Tap feedback refinado

El estándar de tap en mobile:
```tsx
whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 500, damping: 22 } }}
```

Para botones de CTA con brillo:
```tsx
whileTap={{ scale: 0.96, filter: 'brightness(1.15)' }}
transition={{ type: 'spring', stiffness: 500, damping: 22 }}
```

Evitá `whileHover` en mobile-first — `:hover` no existe allí. Si el componente vive en desktop también, OK, pero mantené la magnitud chica (`scale: 1.02`, no `1.05+`).

### 4. Shared layout transitions

Cuando un elemento cambia de posición entre estados (ej: un tab activo que se mueve), usá `layoutId`:
```tsx
{tabs.map(t => (
  <button key={t.id} onClick={() => setActive(t.id)}>
    {active === t.id && (
      <motion.div
        layoutId="active-tab"
        className="absolute inset-0 rounded-full bg-cyan-400"
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      />
    )}
    <span className="relative z-10">{t.label}</span>
  </button>
))}
```

Resultado: el pill se desliza fluido entre tabs en vez de saltar. Caro si hay muchos — OK para 3-5 tabs.

### 5. Presence (enter/exit)

Todo elemento que aparece condicionalmente debe envolverse en `AnimatePresence`:
```tsx
<AnimatePresence>
  {showBanner && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

Atención: `height: 'auto'` requiere que el contenido tenga altura definida (no puede ser indefinido). Y necesita `overflow-hidden` en el motion.div.

### 6. Scroll-driven animations

Para el hero del home que se desvanece en scroll:
```tsx
import { useScroll, useTransform, motion } from 'framer-motion';

function FadeHero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const y       = useTransform(scrollY, [0, 200], [0, -40]);
  return <motion.div style={{ opacity, y }}>...</motion.div>;
}
```

Usar con moderación — esto puede pegarle al frame rate en listas largas.

### 7. Respetá `prefers-reduced-motion`

Global, via CSS:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Y en framer-motion, opcionalmente:
```tsx
import { MotionConfig } from 'framer-motion';
<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

### 8. Number tickers (micro-delight)

Cuando un contador cambia (stats, ratings), animá el valor:
```tsx
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';

function Counter({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, v => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value]);
  return <motion.span>{rounded}</motion.span>;
}
```

## Cómo actuar

1. Si el usuario nombra un componente/página → leélo y proponé las 3-5 mejoras de motion más valiosas para ese contexto.
2. Si pide "tuning general" → revisá todos los usos de `framer-motion` en el diff/módulo y alineá con las constantes de `src/lib/motion.ts` (si no existe, creala).
3. **NO agregues animaciones donde no hay ninguna** solo porque podés — evaluá si aporta.
4. Después de cada cambio, corré `npx tsc -b` para verificar.

## Anti-patterns

- ❌ `ease: 'linear'` para UI (sí para progress bars continuos)
- ❌ Animations > 500ms en interacciones directas
- ❌ Stagger > 100ms entre ítems (feel lento)
- ❌ `whileHover` en mobile-only components
- ❌ Muchos `useScroll` simultáneos (cada uno listener global)
- ❌ `layout` prop en listas largas con muchos items (caro — usá layoutId puntual)
