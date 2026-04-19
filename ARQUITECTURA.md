# Aether OS — Guía de Arquitectura
> Documento técnico para entender cómo está estructurada la app, qué hace cada capa, y cómo evolucionar hacia una modularización perfecta.

---

## 1. ¿Qué es Aether OS?

Es una SPA (Single Page Application) construida con React + TypeScript + Vite, conectada a Supabase como backend. La idea central es un "sistema operativo de vida" dividido en 8 dominios llamados **Universos**:

```
/ (Home — Rueda de la Vida)
├── /dinero          → Finanzas personales
├── /salud           → Salud
├── /amor            → Vida amorosa
├── /desarrollopersonal
├── /desarrolloprofesional
├── /social
├── /familia
└── /ocio
```

Cada universo es una mini-aplicación independiente dentro de la misma SPA.

---

## 2. Mapa general de carpetas

```
src/
├── core/           ← Infraestructura compartida (auth, routing, shell)
├── lib/            ← Singletons globales (supabase, utils, ai-service)
├── components/     ← UI global reutilizable (shadcn wrappers, UniverseSelector)
└── universes/      ← Uno por universo de vida
    ├── base/       ← Home: Rueda de la Vida
    ├── dinero/     ← El más desarrollado — es el patrón de referencia
    ├── salud/
    ├── amor/
    ├── desarrollopersonal/
    ├── desarrolloprofesional/
    ├── social/
    ├── familia/
    └── ocio/
```

---

## 3. La capa CORE — el corazón de la app

La carpeta `src/core/` contiene todo lo que existe una sola vez y es usado por todos los universos.

### `core/router.tsx`
Define todas las rutas de la app. Usa `createBrowserRouter` de React Router v6.
- Cada ruta (excepto `/login` y `/registro`) está envuelta en `<ProtectedRoute>`.
- Si el usuario no está autenticado, es redirigido al login automáticamente.
- **Regla:** cada nuevo universo agrega una sola línea acá.

```tsx
// Patrón:
{ path: '/dinero', element: protect(<DineroDashboard />) }
```

### `core/contexts/AuthContext.tsx`
Provee el contexto de autenticación a toda la app. Expone:
- `user` — el usuario autenticado (o null)
- `session` — la sesión de Supabase
- `loading` — true mientras se verifica si hay sesión activa

Muestra un spinner de pantalla completa mientras resuelve. Todos los universos consumen esto con:

```tsx
const { user } = useAuth();
```

### `core/components/UniverseDashboardShell.tsx`
Un layout reutilizable para universos que todavía no tienen contenido propio. Acepta una configuración:

```tsx
interface UniverseShellConfig {
  color: string;        // Color de identidad del universo
  title: string;        // "Vida Amorosa"
  subtitle: string;     // "Conexión & Relaciones"
  headerIcon: LucideIcon;
  moduleLabel: string;  // "tu Universo Amoroso"
  lightBg?: boolean;    // true si el fondo es claro (para contraste de texto)
}
```

Renderiza: sidebar, botón de volver, menú mobile, y un placeholder "en construcción" si no hay `children`.

### `core/components/AetherModal.tsx`
Wrapper de modal compartido para toda la app.

### `core/components/ProtectedRoute.tsx`
Componente que verifica autenticación antes de renderizar cualquier página privada.

---

## 4. La capa LIB — utilidades globales

### `lib/supabase.ts`
El cliente singleton de Supabase. Se instancia una sola vez y se importa desde todos los hooks.

### `lib/utils.ts`
Helpers genéricos (cn para clases de Tailwind, formatters, etc.)

### `lib/ai-service.ts`
Servicio de inteligencia artificial. Centralizado para no acoplar llamadas de IA a componentes individuales.

---

## 5. El patrón de Universo — Dinero como referencia

Dinero es el universo más completo y define el patrón que deben seguir todos los demás.

### Estructura interna de un universo:

```
universes/dinero/
├── pages/
│   └── DineroDashboard.tsx      ← ÚNICO punto de entrada (page component)
├── components/
│   ├── views/                   ← Una por tab (Overview, Transactions, etc.)
│   ├── modals/                  ← Todos los modales en un archivo
│   ├── charts/                  ← Componentes de visualización de datos
│   └── ui/                      ← Primitivos específicos del universo
├── hooks/
│   ├── useDineroData.ts          ← SOLO lectura de datos
│   └── useDineroActions.ts       ← SOLO mutaciones (crear, editar, borrar)
├── lib/
│   └── dinero-io.ts             ← Utilidades puras (parseo de archivos, export)
└── types/
    └── index.ts                 ← Interfaces TypeScript + schemas Zod
```

---

## 6. Qué es cada capa y por qué existe

### PAGES (`pages/`)
**El único componente "inteligente" (smart component) del universo.**

- Es la raíz del árbol de componentes del universo.
- Dueño de TODO el estado de UI: qué modal está abierto, qué tab está activa, qué elemento se está editando.
- Importa y conecta los hooks con los componentes.
- NO hace fetch directo a Supabase — eso lo delega al hook de data.
- NO tiene lógica de negocio — eso lo delega al hook de actions.

```tsx
// Ejemplo de lo que SÍ hace la page:
const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
const { transactions, fetchData } = useDineroData();
const actions = useDineroActions(user?.id, fetchData);

// Conecta todo:
<DineroTransactions onAddClick={() => setIsTransactionModalOpen(true)} />
<DineroModals isTransactionModalOpen={isTransactionModalOpen} ... />
```

### VIEWS (`components/views/`)
**Componentes de presentación "tontos" (dumb components) — uno por tab.**

- Reciben datos y callbacks por props. NO hacen fetch.
- Representan una sección completa de la UI (toda la tab de Transacciones, toda la tab de Overview, etc.)
- Pueden ser grandes — no hay problema en que tengan varios cientos de líneas si representan una sola pantalla coherente.
- Ejemplo: `DineroOverview.tsx`, `DineroTransactions.tsx`, `DineroSubscriptions.tsx`

```tsx
// Patrón:
interface DineroTransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}
```

### MODALS (`components/modals/`)
**Todos los modales del universo agrupados en un solo archivo.**

- Actualmente `DineroModals.tsx` contiene TODOS los modales (cuenta, transacción, crypto, CSV, export, categoría, budget, suscripción).
- La razón de agruparlos: la page ya tiene mucho estado de "¿qué modal está abierto?", y tener un solo punto de montaje simplifica el árbol.
- Reciben los booleans de apertura/cierre y los handlers por props desde la page.

**Problema actual:** `DineroModals.tsx` tiene una interfaz de props MUY grande (más de 30 props). Esto es una señal de que está creciendo más de lo ideal.

### CHARTS (`components/charts/`)
**Componentes de visualización de datos puros.**

- Wrappers sobre Recharts, adaptados al diseño de Aether.
- Son completamente "tontos": reciben `data` y configuración, renderizan un gráfico. Nada más.
- Ejemplos: `AreaChart.tsx`, `BarChart.tsx`, `CashFlowChart.tsx`, `ExpensePieChart.tsx`

```tsx
// Son así de simples:
<AreaChart data={monthlyData} index="month" categories={['Income', 'Expense']} />
```

### HOOKS (`hooks/`)
**Toda la lógica de negocio separada del JSX.**

#### `useDineroData.ts` — solo lectura
- Hace un `Promise.all` con los 8 fetches en paralelo al cargar.
- Expone los arrays de datos y un `fetchData()` para refrescar manualmente.
- **Regla de seguridad:** SIEMPRE incluye `.eq('user_id', uid)` en cada query. Nunca remover este filtro.

```tsx
const { accounts, transactions, categories, loading, fetchData } = useDineroData();
```

#### `useDineroActions.ts` — solo escritura
- Recibe `userId` y el callback `fetchData` para refrescar después de cada mutación.
- Maneja validación Zod antes de enviar a Supabase.
- Maneja el balance de cuentas al crear/editar/borrar transacciones.
- **Regla crítica:** al editar una transacción, siempre leer el valor ORIGINAL desde el array por ID, nunca del form draft (para que el delta del balance sea correcto).

### LIB (`lib/`)
**Utilidades puras sin efectos secundarios.**

- `dinero-io.ts`: parseo de archivos (CSV, XLSX, JSON, PDF), auto-categorización, y exportación. Funciones puras que no llaman a Supabase ni tocan estado de React.
- Valida MIME type, extensión y tamaño (máx 10MB) como medida de seguridad.

### TYPES (`types/index.ts`)
**Contratos de datos del universo.**

- Interfaces TypeScript para todas las entidades (Account, Transaction, Budget, etc.)
- Schemas Zod co-localizados para validación en runtime antes de enviar a Supabase.

```tsx
// Doble capa: TypeScript para el compilador, Zod para runtime:
export interface Transaction { id: string; amount: number; ... }
export const newTransactionSchema = z.object({ amount: z.number().positive(), ... });
```

---

## 7. El sistema de diseño

### Tokens de color en Tailwind (`tailwind.config.js`)

| Token | Color | Uso |
|---|---|---|
| `forest.DEFAULT` | `#0B2118` | Sidebar de Dinero, fondo oscuro principal |
| `forest.light` | `#163E2E` | Subheader de Dinero |
| `mint.DEFAULT` | `#A7F38F` | Acento primario / botones CTA |
| `mint.hover` | `#8EE874` | Hover del acento |
| `sage.DEFAULT` | `#F4F9F2` | Fondo general de la app |
| `charcoal` | `#2D3A35` | Texto oscuro sobre fondos claros |

### Colores de identidad por universo (CSS vars en `index.css`)

```css
--amor: #FF0040
--dinero: #05DF72
--desarrollopersonal: #113DC0
--salud: #FE7F01
--social: #1447E6
--familia: #C81CDE
```

### Clases utilitarias de Aether (definidas en `src/index.css`)

| Clase | Descripción |
|---|---|
| `.aether-card` | Card blanca con `rounded-[32px]` |
| `.aether-card-interactive` | Card con hover lift |
| `.aether-title` | Título serif 3xl-4xl |
| `.aether-eyebrow` | Label 10px uppercase tracking amplio |
| `.aether-metric-xl` | KPI principal 6xl-7xl bold |
| `.aether-btn` | Botón rounded-full con shadow |
| `.aether-modal-backdrop` | Backdrop con blur |
| `.aether-modal-panel` | Panel modal (bottom sheet en mobile) |

---

## 8. Flujo de datos completo

```
Usuario interactúa con la UI
        ↓
    VIEW (dumb)
    emite callback prop (ej: onEdit(transaction))
        ↓
    PAGE (smart)
    actualiza estado de modal + guarda el ítem a editar en estado
        ↓
    MODAL se abre (recibe el ítem por props)
        ↓
    Usuario modifica form → submit
        ↓
    PAGE llama a action del hook
    (ej: actions.updateTransaction(id, data))
        ↓
    HOOK ACTIONS
    1. Valida con Zod
    2. Envía a Supabase
    3. Ajusta balance de cuenta
    4. Llama fetchData() para refrescar
        ↓
    HOOK DATA
    Re-fetches todos los datos de Supabase
        ↓
    Estado actualizado → UI re-renderiza
```

---

## 9. Problemas actuales de la estructura

Siendo honestos, hay áreas de mejora claras:

### 9.1 `DineroModals.tsx` tiene demasiadas props
Con 30+ props, es difícil de mantener y extender. Cada nuevo modal multiplica el acoplamiento con la page.

### 9.2 Estado de modales disperso en la page
`DineroDashboard.tsx` tiene decenas de `useState` para manejar qué modal está abierto. Si hay 10 modales, son 20 variables de estado solo para eso.

### 9.3 Inconsistencia entre universos
- `desarrollopersonal` tiene componentes sueltos sin la estructura `views/modals/charts/ui`.
- Algunos universos usan `types.ts` (plano) en vez de `types/index.ts` (carpeta).
- La carpeta `components/` global (`src/components/`) solo tiene el `UniverseSelector` — en el futuro podría crecer sin control.

### 9.4 Tokens de color hardcodeados en componentes
`DineroOverview.tsx` define su propia paleta `const C = { bg: '#F4F9F2', ... }`. Esto debería venir de los tokens de Tailwind.

### 9.5 Tipado `any` en algunas props
`DineroModals.tsx` usa `any` para varios campos. Con Zod ya definido en types, esto debería estar tipado correctamente.

---

## 10. La estructura ideal — modularización perfecta

Esta es la evolución propuesta manteniendo lo que ya funciona bien y corrigiendo lo que duele:

### 10.1 Separar cada modal en su propio archivo

En lugar de un `DineroModals.tsx` monolítico:

```
components/modals/
├── TransactionModal.tsx
├── AccountModal.tsx
├── CryptoModal.tsx
├── CsvImportModal.tsx
├── ExportModal.tsx
├── CategoryModal.tsx
├── BudgetModal.tsx
└── SubscriptionModal.tsx
```

Cada modal es un componente independiente con sus propias props tipadas. Más fácil de testear, más fácil de encontrar.

### 10.2 Un hook dedicado para el estado de UI de la page

En lugar de 20 `useState` en la page, un hook que encapsula toda la lógica de "qué está abierto":

```tsx
// hooks/useDineroUIState.ts
export function useDineroUIState() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; item?: Transaction }>({ open: false });
  const [accountModal, setAccountModal] = useState<{ open: boolean }>({ open: false });
  // ... etc

  return {
    activeTab, setActiveTab,
    transactionModal, openTransactionModal, closeTransactionModal,
    accountModal, openAccountModal, closeAccountModal,
    // ...
  };
}
```

La page queda limpia:

```tsx
export default function DineroDashboard() {
  const { user } = useAuth();
  const data = useDineroData();
  const actions = useDineroActions(user?.id, data.fetchData);
  const ui = useDineroUIState();
  // Listo. La page solo conecta.
}
```

### 10.3 Estructura de tipos consistente

Todos los universos deberían usar la misma convención:

```
types/
├── index.ts        ← re-exporta todo
├── entities.ts     ← interfaces de base de datos (Account, Transaction, etc.)
├── forms.ts        ← schemas Zod para formularios
└── ui.ts           ← tipos de UI (TabType, ModalState, etc.)
```

### 10.4 Estructura ideal completa por universo

```
universes/dinero/
├── pages/
│   └── DineroDashboard.tsx        ← Orquestador limpio, ~100 líneas
│
├── components/
│   ├── views/
│   │   ├── DineroOverview.tsx
│   │   ├── DineroTransactions.tsx
│   │   ├── DineroSubscriptions.tsx
│   │   ├── DineroCategories.tsx
│   │   ├── DineroRadar.tsx
│   │   ├── DineroReports.tsx
│   │   └── DineroBudget.tsx
│   │
│   ├── modals/
│   │   ├── TransactionModal.tsx   ← Cada modal: su propio archivo
│   │   ├── AccountModal.tsx
│   │   ├── CategoryModal.tsx
│   │   ├── BudgetModal.tsx
│   │   ├── SubscriptionModal.tsx
│   │   ├── CryptoModal.tsx
│   │   ├── CsvImportModal.tsx
│   │   └── ExportModal.tsx
│   │
│   ├── charts/
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── CashFlowChart.tsx
│   │   ├── ExpensePieChart.tsx
│   │   └── WinRateWidget.tsx
│   │
│   └── ui/
│       └── [primitivos específicos de dinero]
│
├── hooks/
│   ├── useDineroData.ts           ← Solo lectura
│   ├── useDineroActions.ts        ← Solo escritura
│   └── useDineroUIState.ts        ← Solo estado de UI (NUEVO)
│
├── lib/
│   └── dinero-io.ts
│
└── types/
    ├── index.ts                   ← Re-exporta todo
    ├── entities.ts                ← Interfaces TS
    ├── forms.ts                   ← Schemas Zod
    └── ui.ts                      ← Tipos de UI
```

### 10.5 Estandarización entre universos

Cada universo debería tener exactamente esta plantilla base, incluso si todavía no tiene contenido:

```
universes/[nombre]/
├── pages/
│   └── [Nombre]Dashboard.tsx
├── components/
│   ├── views/         (vacío hasta que se desarrolle)
│   ├── modals/        (vacío hasta que se desarrolle)
│   └── charts/        (vacío hasta que se desarrolle)
├── hooks/
│   ├── use[Nombre]Data.ts
│   └── use[Nombre]Actions.ts
├── lib/
│   └── [nombre]-utils.ts
└── types/
    └── index.ts
```

### 10.6 Componentes globales organizados

```
src/components/
├── ui/                ← shadcn components (ya existe)
├── layout/            ← UniverseSelector, nav items globales
└── feedback/          ← toasts, spinners, empty states globales
```

---

## 11. Resumen: qué mantener, qué cambiar

### ✅ Mantener (está bien)
- Separación page/views/hooks — es el patrón correcto
- `useDineroData` + `useDineroActions` como dos hooks separados
- Types + Zod co-localizados en el universo
- Todos los `user_id` filters en queries (seguridad)
- `UniverseDashboardShell` para universos sin contenido
- Charts como componentes puros sin estado

### 🔧 Mejorar (cuando el universo crezca)
- Romper `DineroModals.tsx` en un modal por archivo
- Extraer estado de UI de la page a `useDineroUIState`
- Estandarizar la estructura de `types/` en todos los universos
- Reemplazar tokens de color hardcodeados por variables de Tailwind
- Eliminar los `any` en props de modales

### 🚫 Evitar
- Hacer fetch a Supabase desde componentes que no sean hooks
- Poner lógica de negocio en views o charts
- Crear helpers/utils genéricos antes de necesitarlos en 3+ lugares
- Agregar estado global (Context/Zustand) antes de que sea realmente necesario — el estado local + props funciona bien por ahora

---

*Documento generado el 18 de abril de 2026. Refleja el estado actual de la codebase de Aether OS.*
