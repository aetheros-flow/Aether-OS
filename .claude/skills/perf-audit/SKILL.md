---
name: perf-audit
description: Audita performance del código de Aether OS. Busca re-renders innecesarios, imports pesados, falta de memoización, y oportunidades de code splitting. Úsalo cuando una pantalla se siente lenta o antes de un release importante.
---

# Aether OS — Performance Audit

Eres un auditor de performance para Aether OS (React + TypeScript + Vite). Analizá el código indicado o los archivos modificados recientemente. Reportá problemas concretos con su impacto estimado y la solución recomendada.

## Contexto del stack
- **Framework**: React 18 con Vite
- **Backend**: Supabase (queries en `Promise.all` en hooks)
- **Charts**: Recharts (librería pesada — debe ser lazy)
- **PDF parsing**: PDF.js (muy pesado — critical path a evitar)
- **UI**: shadcn/ui + Tailwind CSS

## Pasos de auditoría

### 1. Re-renders innecesarios

#### Funciones inline en JSX
Buscar funciones arrow definidas directamente en props — se recrean en cada render:
```bash
grep -rn "onClick={() =>" src/universes/ --include="*.tsx" | head -30
```
Si la función llama a algo del estado del padre y se pasa a un componente hijo, debería ser `useCallback`.

#### Objetos inline en JSX
```bash
grep -rn "style={{" src/universes/ --include="*.tsx" | head -20
```
Objetos inline en `style` se recrean en cada render. Si son estáticos, moverlos fuera del componente.

#### Arrays/objetos derivados sin useMemo
Buscar `.filter(`, `.map(`, `.reduce(` directamente en el body del componente (fuera de `useMemo`):
- Si la data es grande (transacciones, trades) y el cálculo es costoso → `useMemo`
- Si el componente se re-renderiza frecuentemente → `useMemo`
- Para listas cortas y renders poco frecuentes → no es necesario

#### Componentes hijos que no necesitan re-renderizar
Si un componente view (DineroOverview, DineroTransactions, etc.) recibe props que no cambian frecuentemente pero su padre sí se re-renderiza, evaluar `React.memo`.

### 2. Carga de datos

#### Verificar Promise.all en hooks de data
```bash
grep -rn "Promise.all" src/universes/ --include="*.ts"
```
✅ Correcto: todas las queries en un solo `Promise.all`
❌ Incorrecto: queries encadenadas con `await` secuencial (multiplica el tiempo de carga)

#### Datos que nunca se usan
Verificar si el hook de data fetcha tablas que ninguna view consume actualmente. Ej: si `investments` y `projects` se fetchan pero no hay tab que los muestre aún, considerar fetchearlos solo cuando sean necesarios.

#### Refetch innecesario
Verificar que `fetchData()` no se llame más de lo necesario:
- ✅ Llamar después de cada mutación (create/update/delete)
- ❌ Llamar en `useEffect` sin dependency array correcto (loop infinito)
- ❌ Llamar al montar el componente Y en un efecto separado

### 3. Bundle size

#### Imports de librerías pesadas
```bash
grep -rn "from 'recharts'" src/ --include="*.tsx"
grep -rn "from 'lucide-react'" src/ --include="*.tsx" | head -10
```

Para Recharts: verificar que los componentes de charts no estén en el bundle principal. Si están en `components/charts/`, evaluar si esas vistas deberían ser lazy-loaded.

Para lucide-react: siempre importar íconos individualmente (ya se hace así), nunca `import * as Icons`.

#### Code splitting con React.lazy
Verificar si las tabs pesadas (Reports con muchos charts, Radar) tienen lazy loading:
```bash
grep -rn "React.lazy\|lazy(" src/ --include="*.tsx"
grep -rn "Suspense" src/ --include="*.tsx"
```
Si no hay ningún `React.lazy`, considerar al menos lazy-loading las vistas de tabs que no son la inicial.

#### Analizar bundle actual
```bash
npx vite-bundle-visualizer 2>/dev/null || echo "Instalar: npm install -D vite-bundle-visualizer"
```

### 4. Hooks y efectos

#### useEffect con dependencias incorrectas
```bash
grep -rn "useEffect" src/universes/ --include="*.ts" --include="*.tsx"
```
Para cada useEffect encontrado, verificar:
- ✅ Dependency array presente
- ✅ Todas las dependencias referenciadas dentro están en el array
- ❌ `[]` pero usa variables del scope que cambian (stale closure)
- ❌ Objeto o array en el dependency array (se recrea en cada render → loop)

#### useCallback en funciones de actions
Las funciones del hook de actions que se pasan como props a componentes hijos deberían estar envueltas en `useCallback` para evitar re-renders en cadena.

### 5. Imágenes y assets
```bash
find src/ -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs ls -lh 2>/dev/null
```
Imágenes > 200KB en `src/assets/` deberían estar optimizadas o servidas desde Supabase Storage.

### 6. PWA y Service Worker
```bash
cat vite.config.ts | grep -A 20 "VitePWA\|workbox"
```
Verificar que assets estáticos estén en el precache del service worker para funcionamiento offline.

## Output esperado

```
PERFORMANCE AUDIT
=================

🔴 CRÍTICO (impacto alto)
- useDineroData.ts: queries secuenciales con await en cadena — reescribir con Promise.all
  Impacto: +800ms en carga inicial

🟡 MEDIO (impacto moderado)  
- DineroDashboard.tsx:145: función inline en onClick pasada a DineroTransactions
  Solución: useCallback o extraer a variable
- DineroOverview.tsx:89: .filter().reduce() sin useMemo sobre array de 500+ items
  Solución: useMemo con dependencia en transactions

🟢 BAJO (mejora menor)
- Recharts no tiene lazy loading — considerar para la tab Reports
- hero.png en assets: 1.2MB, optimizar a WebP

✅ OK
- Promise.all en useDineroData: correcto
- Íconos de lucide-react importados individualmente
```
