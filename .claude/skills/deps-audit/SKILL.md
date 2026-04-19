---
name: deps-audit
description: Audita las dependencias de Aether OS. Detecta paquetes desactualizados, vulnerabilidades conocidas, dependencias pesadas con alternativas más livianas, y sugiere actualizaciones para mantenerse en la vanguardia tecnológica. Úsalo mensualmente o antes de un release importante.
---

# Aether OS — Dependencies Audit

Auditás el estado de las dependencias del proyecto. El objetivo es: seguridad, performance de bundle, y actualización tecnológica. Reportás lo accionable, no todo lo que esté desactualizado (minor/patch updates de bajo riesgo no justifican interrupción).

## Stack de referencia de Aether OS
- React 18 + TypeScript + Vite
- Supabase JS client
- React Router v6
- Recharts (visualizaciones)
- Shadcn/ui + Radix UI + Tailwind CSS
- Zod (validación)
- PDF.js (import de archivos)
- XLSX (import de spreadsheets)

## Pasos de auditoría

### 1. Leer el estado actual
```bash
cat package.json
```

### 2. Vulnerabilidades conocidas
```bash
npm audit --audit-level=moderate 2>&1 | head -50
```
Reportar solo vulnerabilidades de nivel `moderate` o superior. Para cada una:
- Qué paquete tiene la vulnerabilidad
- Qué tipo de vulnerabilidad es
- Si hay fix disponible (`npm audit fix`) o requiere breaking change

### 3. Dependencias desactualizadas (major versions)
```bash
npx npm-check-updates --target minor 2>&1 | head -40
```
Filtrar solo actualizaciones de **major version** — estas son las que requieren atención. Ignorar patch/minor para no generar ruido.

### 4. Dependencias más pesadas del bundle
Analizar qué paquetes contribuyen más al bundle final:
```bash
cat node_modules/recharts/package.json | grep '"main"\|"module"\|"version"' 2>/dev/null
du -sh node_modules/recharts node_modules/xlsx node_modules/pdfjs-dist node_modules/lucide-react node_modules/@supabase 2>/dev/null
```

Para cada dependencia pesada, evaluar si hay una alternativa más liviana que cumpla la misma función. Ser conservador con las recomendaciones — solo sugerir migración si la ganancia es sustancial (>30% reducción) y el esfuerzo es razonable.

### 5. Verificar compatibilidad con React 19
React 19 es la versión actual. Verificar si el proyecto está en v18 y qué dependencias bloquean la actualización:
```bash
cat node_modules/react/package.json | grep '"version"'
npx npm-check-updates react react-dom @types/react @types/react-dom 2>&1
```
Listar las dependencias de terceros que tienen peer deps incompatibles con React 19.

### 6. Estado de Vite
Vite evoluciona rápido. Verificar versión actual vs. latest:
```bash
cat node_modules/vite/package.json | grep '"version"'
npx npm-check-updates vite 2>&1
```

### 7. Supabase JS client
El cliente de Supabase tiene updates frecuentes con mejoras de performance y nuevas features:
```bash
cat node_modules/@supabase/supabase-js/package.json | grep '"version"'
```
Si hay major version disponible, listar breaking changes relevantes.

### 8. TypeScript version
```bash
cat node_modules/typescript/package.json | grep '"version"'
```
TypeScript 5.x tiene mejoras de performance significativas en proyectos grandes.

### 9. Dependencias duplicadas
```bash
npm list --depth=0 2>&1 | grep "deduped\|WARN"
```

### 10. Dependencias sin usar
Evaluar si hay dependencias en `package.json` que no se importan en ningún archivo:
```bash
cat package.json | grep -A 50 '"dependencies"'
```
Para cada dependencia listada, verificar si hay algún import en el código:
```bash
grep -rn "from 'lucide-react'\|from 'recharts'\|from 'zod'\|from 'sonner'" src/ --include="*.ts" --include="*.tsx" | wc -l
```

## Criterios para recomendar una actualización

Solo recomendar actualizar si:
1. **Seguridad**: hay una vulnerabilidad confirmada
2. **Feature importante**: la nueva versión tiene algo que Aether OS necesita
3. **Breaking bug**: hay un bug conocido en la versión actual que afecta el proyecto
4. **Major performance gain**: bundle size reducción >20% o runtime speed significativo

NO recomendar actualizar solo porque "es la última versión". La estabilidad vale más que estar en bleeding edge para dependencias que funcionan bien.

## Output esperado

```
DEPS AUDIT — Aether OS
======================

🔴 SEGURIDAD (acción inmediata)
- xlsx@0.18.5: vulnerabilidad de prototype pollution (CVE-XXXX)
  Fix: npm install xlsx@latest

🟡 ACTUALIZACIONES RECOMENDADAS
- @supabase/supabase-js: v2.x → v2.y
  Motivo: mejora de performance en realtime + fix de memory leak
  Riesgo: bajo (minor version)

🔵 OPORTUNIDADES TECNOLÓGICAS
- React 18.2 → React 19 disponible
  Bloqueadores: react-router-dom@6 (peer dep incompatible)
  Acción: esperar React Router v7 antes de migrar

📦 BUNDLE SIZE
- recharts: 892KB (la más pesada después de Supabase)
  Alternativa: no hay alternativa liviana equivalente — mantener
- pdfjs-dist: 2.1MB (solo para import de PDFs)
  Oportunidad: lazy-load solo cuando el usuario abre el import modal

✅ OK — no requieren acción
- vite: última versión
- zod: última versión
- typescript: 5.x ✓
- lucide-react: tree-shakeable, OK
```
