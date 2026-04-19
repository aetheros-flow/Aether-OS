---
name: aether-check
description: Audita que el código nuevo o modificado respete los patrones de arquitectura de Aether OS. Úsalo después de agregar un universo nuevo, crear hooks, o modificar componentes existentes. También se puede invocar con /aether-check.
---

# Aether OS — Architecture Check

Eres un auditor de arquitectura para el proyecto Aether OS. Tu tarea es revisar el código modificado o indicado y verificar que cumpla con los patrones establecidos. Sé directo: lista lo que está bien y lo que hay que corregir, con la referencia exacta al archivo y línea.

## Pasos de auditoría

### 1. Estructura de carpetas del universo
Para cada universo modificado, verificar que exista:
```
universes/<nombre>/
├── pages/           ← único componente inteligente
├── components/
│   ├── views/       ← uno por tab
│   ├── modals/      ← formularios/modales
│   └── charts/      ← visualizaciones
├── hooks/
│   ├── use<Nombre>Data.ts      ← solo lectura
│   └── use<Nombre>Actions.ts   ← solo escritura
├── lib/             ← utilidades puras
└── types/
    └── index.ts     ← interfaces + schemas Zod
```
Reportar cualquier carpeta faltante o archivo mal ubicado.

### 2. Separación de responsabilidades en la Page
La page (`pages/<Nombre>Dashboard.tsx`) debe:
- ✅ Importar y conectar hooks y views — NO hacer fetch directo
- ✅ Ser dueña del estado de UI (modales abiertos, tab activa, ítem siendo editado)
- ✅ No contener lógica de negocio (eso va en Actions)
- ✅ No contener queries SQL/Supabase directas

Buscar con Grep: `supabase.from` dentro de `pages/` — si existe, es un error.

### 3. Seguridad de queries Supabase
Buscar TODAS las llamadas a `supabase.from(...)` en el universo. Cada una debe:
- ✅ Tener `.eq('user_id', uid)` o `.eq('user_id', userId)`
- ✅ Estar dentro de un hook (`hooks/`), no en componentes

Comando de verificación:
```bash
grep -rn "supabase.from" src/universes/ --include="*.ts" --include="*.tsx"
```
Reportar cada llamada sin el filtro `user_id`.

### 4. Validación Zod antes de mutaciones
En `use<Nombre>Actions.ts`, cada función que hace `insert` o `update` debe:
- ✅ Llamar `schema.parse(data)` o `schema.safeParse(data)` antes de enviar
- ✅ Tener el schema definido en `types/index.ts`

Buscar con Grep: `.insert(` y `.update(` en hooks/actions — verificar que tengan parse antes.

### 5. Tipado — eliminar `any`
Buscar `any` explícito en el código modificado:
```bash
grep -rn ": any" src/universes/ --include="*.ts" --include="*.tsx"
grep -rn "as any" src/universes/ --include="*.ts" --include="*.tsx"
```
Cada `any` encontrado debería tener un tipo real. Sugerir el tipo correcto basándose en el contexto.

### 6. Re-exports desde types/index.ts
Si el universo tiene `types/index.ts`, verificar que todas las interfaces y schemas estén exportados desde ahí (no importados directamente desde archivos internos en otros módulos del universo).

### 7. Co-location de tipos y schemas
Los schemas Zod deben estar en el mismo archivo que sus interfaces TypeScript correspondientes (`types/index.ts`), no dispersos en los hooks o componentes.

## Output esperado

```
AETHER ARCHITECTURE CHECK
========================

Universo: dinero
Archivos revisados: X

✅ PASA
- Separación hooks data/actions correcta
- Queries con user_id filter presentes
- Zod schemas co-localizados en types/index.ts

⚠️ ADVERTENCIAS
- src/universes/dinero/components/modals/DineroModals.tsx:34 — prop tipada como `any`, usar `Category` interface

❌ ERRORES
- src/universes/dinero/pages/DineroDashboard.tsx:87 — supabase.from() directo en page component, mover a hook

RESUMEN: 1 error crítico, 1 advertencia
```

Si todo pasa, confirmar con "✅ Arquitectura OK" y no agregar ruido innecesario.
