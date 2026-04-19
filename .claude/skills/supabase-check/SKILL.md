---
name: supabase-check
description: Audita seguridad de todas las queries a Supabase en Aether OS. Verifica user_id filters, validación Zod pre-insert, manejo de errores, y que no haya queries fuera de hooks. Úsalo después de agregar nuevas queries o mutations, o antes de un release.
---

# Aether OS — Supabase Security Check

Eres un auditor de seguridad especializado en Supabase para Aether OS. Analizá las queries a Supabase en el código indicado o en todos los universos. Reportá cada problema con su criticidad y la solución exacta.

## Reglas de seguridad de Aether OS

1. **Toda query debe filtrar por `user_id`** — aunque Supabase RLS sea la primera línea de defensa, el código es la segunda. Nunca remover estos filtros.
2. **Toda mutación debe validar con Zod antes de enviar** — nunca insertar/actualizar datos sin parsear primero.
3. **Las queries deben vivir en hooks** — no en componentes, no en pages, no en utils.
4. **Los errores de Supabase no deben exponerse al usuario** — siempre sanitizar antes de mostrar en toast/UI.
5. **Select con `*` debe ser intencional** — columnas sensibles no deben fetcharse si no se usan.

## Pasos de auditoría

### 1. Scan completo de queries
```bash
grep -rn "supabase.from\|supabase.rpc\|supabase.storage" src/ --include="*.ts" --include="*.tsx"
```
Listar todas las ubicaciones encontradas. Para cada una, verificar los puntos siguientes.

### 2. Filtro user_id en TODAS las queries

Para cada `supabase.from('tabla')`, verificar que haya `.eq('user_id', ...)`:

**Patrón correcto:**
```ts
supabase.from('Finanzas_transactions')
  .select('*')
  .eq('user_id', uid)   // ← OBLIGATORIO
```

**Patrón incorrecto (reportar como CRÍTICO):**
```ts
supabase.from('Finanzas_transactions')
  .select('*')          // ← falta user_id filter
```

Excepción: queries a tablas de sistema o públicas que genuinamente no son por usuario (verificar con contexto).

### 3. Validación Zod antes de insert/update

Para cada `.insert(` y `.update(`, verificar que en las líneas anteriores haya un `schema.parse()` o `schema.safeParse()`:

**Patrón correcto:**
```ts
const validated = newTransactionSchema.parse(formData);  // ← valida primero
await supabase.from('Finanzas_transactions').insert(validated);
```

**Patrón incorrecto (reportar como ALTO):**
```ts
await supabase.from('Finanzas_transactions').insert(formData);  // sin validación
```

Buscar:
```bash
grep -n "\.insert\|\.update\|\.upsert" src/universes/ -r --include="*.ts" --include="*.tsx"
```

### 4. Queries en componentes (fuera de hooks)
```bash
grep -rn "supabase.from" src/universes/ --include="*.tsx"
```
Cualquier resultado en un archivo `.tsx` que NO esté en `hooks/` es un error de arquitectura y potencial riesgo de seguridad (el componente puede renderizarse múltiples veces, exponer queries en el bundle cliente de formas inesperadas, etc.).

### 5. Manejo y sanitización de errores

Para cada error de Supabase capturado, verificar que:
- ✅ NO se muestre el mensaje raw de Supabase/Postgres al usuario (puede contener nombres de tablas, estructura de DB, o info sensible)
- ✅ Haya una función `sanitize(err)` o equivalente que mapee errores a mensajes genéricos
- ✅ El error raw se loguee a `console.error` para debugging, pero no se exponga en UI

**Patrón incorrecto:**
```ts
toast.error(error.message);  // puede exponer "duplicate key value violates unique constraint..."
```

**Patrón correcto:**
```ts
console.error('[Action]', error);
toast.error('No se pudo guardar. Intentá de nuevo.');
```

### 6. Variables de entorno
```bash
grep -rn "VITE_SUPABASE" src/ --include="*.ts" --include="*.tsx"
```
Las variables de entorno Supabase solo deben aparecer en `src/lib/supabase.ts`. Si aparecen en otros archivos, es un code smell (aunque no un riesgo de seguridad per se, ya que son ANON_KEY pública).

Verificar que `.env.local` esté en `.gitignore`:
```bash
grep ".env.local" .gitignore
```

### 7. Row Level Security — verificación de configuración
Generar una lista de las tablas usadas en el código para que el desarrollador verifique que todas tienen RLS habilitado en Supabase Dashboard:
```bash
grep -rn "supabase.from(" src/ --include="*.ts" --include="*.tsx" | grep -oP "from\('\K[^']+" | sort -u
```

### 8. Datos sensibles en queries select
Para queries con `.select('*')`, verificar que no se estén fetchando columnas que no se usan. Especialmente en tablas de usuarios/auth.

## Output esperado

```
SUPABASE SECURITY CHECK
=======================

🔴 CRÍTICO
- src/universes/dinero/components/views/DineroOverview.tsx:45
  supabase.from('Finanzas_accounts').select('*') — SIN filtro user_id
  Fix: agregar .eq('user_id', userId)

🟠 ALTO
- src/universes/salud/hooks/useSaludActions.ts:23
  .insert(formData) sin validación Zod previa
  Fix: parsear con el schema correspondiente antes del insert

🟡 MEDIO
- src/universes/dinero/hooks/useDineroActions.ts:89
  toast.error(error.message) expone mensaje raw de Postgres
  Fix: usar función sanitize() o mensaje genérico

✅ OK
- Todas las queries de dinero tienen .eq('user_id', uid)
- Zod schemas en todos los inserts de dinero
- .env.local en .gitignore

TABLAS ENCONTRADAS (verificar RLS en Supabase Dashboard):
- Finanzas_accounts ✓
- Finanzas_transactions ✓
- Finanzas_categories ✓
- Finanzas_budgets ✓
- Finanzas_subscriptions ✓
```
