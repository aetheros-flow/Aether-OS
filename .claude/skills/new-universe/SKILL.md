---
name: new-universe
description: Scaffoldea un nuevo universo de vida en Aether OS siguiendo exactamente el patrón de Dinero. Crea la estructura completa de carpetas, archivos base, tipos, hooks, y registra la ruta. Usar con /new-universe <nombre> <color> <título>.
---

# Aether OS — Scaffold New Universe

Creás un nuevo universo de vida completo siguiendo el patrón establecido en `universes/dinero/`. El usuario debe proveer:
- **nombre**: identificador en minúsculas sin espacios (ej: `salud`, `amor`, `ocio`)
- **color**: color hex de identidad del universo (ej: `#FE7F01`)
- **título**: nombre para mostrar (ej: `Salud & Bienestar`)

Si falta alguno de estos datos, preguntarlos antes de continuar.

## Pasos de creación

### Paso 1 — Verificar que no existe
```bash
ls src/universes/<nombre>/
```
Si ya existe, detenerse y notificar.

### Paso 2 — Crear estructura de carpetas
```
src/universes/<nombre>/
├── pages/
├── components/
│   ├── views/
│   ├── modals/
│   ├── charts/
│   └── ui/
├── hooks/
├── lib/
└── types/
```

### Paso 3 — Crear `types/index.ts`
Template base:
```typescript
import { z } from 'zod';

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface <Nombre>Entry {
  id: string;
  user_id: string;
  created_at: string;
  // Agregar campos específicos del universo
}

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

export const new<Nombre>EntrySchema = z.object({
  // Agregar campos con validación
});

export type New<Nombre>Entry = z.infer<typeof new<Nombre>EntrySchema>;
```

### Paso 4 — Crear `hooks/use<Nombre>Data.ts`
Template base siguiendo exactamente el patrón de `useDineroData`:
```typescript
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type { <Nombre>Entry } from '../types';
import { toast } from 'sonner';

export function use<Nombre>Data() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<<Nombre>Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uid = user.id;
      const [entriesRes] = await Promise.all([
        // Agregar tablas del universo — SIEMPRE con .eq('user_id', uid)
        supabase.from('<tabla_del_universo>').select('*').eq('user_id', uid),
      ]);

      if (entriesRes.error) throw entriesRes.error;
      setEntries(entriesRes.data ?? []);
    } catch (err) {
      console.error('[<Nombre>Data]', err);
      toast.error('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { entries, loading, fetchData };
}
```

### Paso 5 — Crear `hooks/use<Nombre>Actions.ts`
Template base:
```typescript
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { new<Nombre>EntrySchema } from '../types';

const sanitize = (err: unknown): string => {
  if (err instanceof ZodError) return err.issues[0]?.message ?? 'Validation error';
  console.error('[<Nombre>Action]', err);
  return 'An unexpected error occurred. Please try again.';
};

export function use<Nombre>Actions(userId: string | undefined, fetchData: () => Promise<void>) {
  async function createEntry(data: unknown) {
    try {
      const validated = new<Nombre>EntrySchema.parse(data);
      const { error } = await supabase
        .from('<tabla_del_universo>')
        .insert({ ...validated, user_id: userId });
      if (error) throw error;
      await fetchData();
      toast.success('Guardado correctamente.');
    } catch (err) {
      toast.error(sanitize(err));
    }
  }

  async function deleteEntry(id: string) {
    try {
      const { error } = await supabase
        .from('<tabla_del_universo>')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      await fetchData();
      toast.success('Eliminado.');
    } catch (err) {
      toast.error(sanitize(err));
    }
  }

  return { createEntry, deleteEntry };
}
```

### Paso 6 — Crear `pages/<Nombre>Dashboard.tsx`
```typescript
import { useState } from 'react';
import { <IconName> } from 'lucide-react';
import UniverseDashboardShell from '../../../core/components/UniverseDashboardShell';
import { use<Nombre>Data } from '../hooks/use<Nombre>Data';
import { use<Nombre>Actions } from '../hooks/use<Nombre>Actions';
import { useAuth } from '../../../core/contexts/AuthContext';

export default function <Nombre>Dashboard() {
  const { user } = useAuth();
  const { entries, loading, fetchData } = use<Nombre>Data();
  const actions = use<Nombre>Actions(user?.id, fetchData);

  return (
    <UniverseDashboardShell
      color="<color_hex>"
      title="<Título>"
      subtitle="<subtítulo eyebrow>"
      headerIcon={<IconName>}
      moduleLabel="tu Universo de <Nombre>"
    />
  );
}
```

### Paso 7 — Registrar la ruta en `src/core/router.tsx`
Agregar:
```typescript
import <Nombre>Dashboard from '../universes/<nombre>/pages/<Nombre>Dashboard';
// ...
{ path: '/<nombre>', element: protect(<<Nombre>Dashboard />) },
```

### Paso 8 — Agregar al UniverseSelector
Abrir `src/components/UniverseSelector.tsx` y agregar el nuevo universo al array de opciones.

### Paso 9 — Agregar CSS var de color en `src/index.css`
```css
:root {
  /* ... */
  --<nombre>: <color_hex>;
}
```

### Paso 10 — Verificación final
```bash
npx tsc --noEmit
```
Asegurarse de que no hay errores de TypeScript antes de reportar el scaffold como completo.

## Output esperado
Al finalizar, reportar:
```
UNIVERSO CREADO: <nombre>
========================
Archivos creados:
  ✅ src/universes/<nombre>/types/index.ts
  ✅ src/universes/<nombre>/hooks/use<Nombre>Data.ts
  ✅ src/universes/<nombre>/hooks/use<Nombre>Actions.ts
  ✅ src/universes/<nombre>/pages/<Nombre>Dashboard.tsx

Archivos modificados:
  ✅ src/core/router.tsx — ruta /<nombre> registrada
  ✅ src/components/UniverseSelector.tsx — opción agregada
  ✅ src/index.css — variable --<nombre> agregada

Próximos pasos:
  1. Crear tabla en Supabase y habilitar RLS
  2. Reemplazar '<tabla_del_universo>' en los hooks por el nombre real
  3. Agregar las interfaces de tipos reales en types/index.ts
  4. Desarrollar la primera view en components/views/
```
