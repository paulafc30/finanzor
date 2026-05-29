# Guía de estilo y documentación de código

Esta guía explica **cómo se escribe y se comenta el código en Finanzor**.
La sigo yo y, si en algún momento aparece otra persona o una IA generando
código, el resultado debería ser indistinguible. Para decisiones técnicas
con impacto en arquitectura, ver [`adr/`](adr/).

## 1. Idioma

- **Comentarios, mensajes de UI y errores: en español.**
- Identificadores en código: **inglés** (`occurredOn`, `useCategories`,
  `BudgetRow`). Es la convención de los frameworks y mezclarlos rompe la
  lectura.
- Los nombres de columnas SQL siguen `snake_case` en inglés
  (`occurred_on`, `is_archived`).

## 2. Estructura de comentarios — el "porqué", no el "qué"

> El código ya dice **qué** hace. El comentario dice **por qué** se hace
> así.

❌ Mal:

```js
// Sumamos los gastos del mes
let total = 0
for (const t of transactions) {
  if (t.type === 'expense') total += Number(t.amount)
}
```

✅ Bien:

```js
// Solo gastos (no ingresos): la barra del Dashboard mide consumo, no
// flujo neto. El neto sale en KPIs aparte.
let total = 0
for (const t of transactions) {
  if (t.type === 'expense') total += Number(t.amount)
}
```

## 3. JSDoc en cabeceras de funciones y componentes

Para hooks y componentes con varias props o lógica no obvia, **abrir con un
bloque JSDoc** que explique el contrato y las reglas no expresables en el
código:

```js
/**
 * Lista de movimientos del mes seleccionado.
 * Cada item es clickable: llama a onEdit(t) si se proporciona.
 *
 * Si se pasa `filter` (objeto con la forma definida en
 * MovementsFilters.jsx), la lista se filtra localmente — útil para añadir
 * buscador sin tocar la query.
 */
export default function TransactionList({ onEdit, filter = null }) {
  ...
}
```

Hooks con efectos secundarios documentan **qué queryKeys invalidan** en su
JSDoc, no en el cuerpo:

```js
/**
 * Mutación para borrar un movimiento.
 *
 * Invalida: transactions, monthly-summary, accumulated-balance,
 * previous-month-summary, savings-from-expenses (todo lo que dependía del
 * mes del movimiento borrado).
 */
export function useDeleteTransaction() { ... }
```

## 4. Reglas duras del proyecto (recordatorio)

Para evitar bugs repetidos, marca con comentario en línea cualquier
violación que pudiera parecer un atajo razonable:

```js
// IMPORTANTE: filtramos por occurred_on (fecha real del movimiento),
// nunca por created_at. Ver docs/adr/0003.
.gte('occurred_on', rangeStart)
.lt('occurred_on', rangeEnd)
```

## 5. Estado en componentes

- **Estado UI local** → `useState`.
- **Estado UI compartido** (mes seleccionado, onboarding…) → `Context` en
  `src/hooks/use<Cosa>.jsx`.
- **Estado servidor** (cualquier cosa de Supabase) → `React Query` a través
  de un hook de dominio en `src/hooks/`.
- **Nunca** llamar a `supabase.from(...)` desde un componente. Siempre desde
  un hook.

## 6. Formularios

- React Hook Form para mantener re-renders bajos.
- Zod para validar el shape final antes de enviar a la mutación.
- Mensajes de error en español, cortos, accionables. Ej. "Importe inválido",
  "Categoría obligatoria en gastos".

## 7. Tailwind

- Mobile-first: clases sin prefijo aplican a móvil; `sm:`, `md:`,
  `lg:` para escalar.
- Variantes de estado en línea (`hover:`, `disabled:`, `focus:`) — no se
  duplican estilos en CSS aparte.
- Tokens propios (`bg-bg-base`, `bg-bg-elevated`, `bg-bg-card`,
  `text-accent`, `bg-danger`, `bg-success`, `bg-warning`, `bg-info`) viven
  en `tailwind.config.js`.
- Si una clase Tailwind se repite mucho en un solo componente, se factoriza
  en una constante local (`const baseBtn = '...'`) antes de crear un
  componente nuevo. Crear componentes solo si hay reutilización real entre
  páginas.

## 8. Mensajes para el usuario

- En `alert()` y confirmaciones: español, sin tecnicismos, máximo dos
  frases.
- Cuando un error venga de Supabase, traducirlo en
  `src/lib/authErrors.js` (auth) o capturarlo en el `catch` del hook y
  lanzar `Error('mensaje en español')`.
- Botones primarios siempre en imperativo: "Guardar", "Archivar",
  "Restaurar", "Crear meta".

## 9. Convenciones de archivos

- Componentes y hooks: **un archivo, un export default**, salvo helpers
  pequeños relacionados que viven en el mismo archivo y se exportan
  nombrados (ej. `applyFilter` y `emptyFilter` en `MovementsFilters.jsx`).
- JSX en `.jsx`, JS puro (utilidades, hooks sin JSX) en `.js`.
- Carpetas por dominio dentro de `src/components/` (`transactions/`,
  `budget/`…), no por tipo (`forms/`, `lists/`).

## 10. Commits

Nada estricto. Lo importante: que la primera línea diga **qué cambia en
producto**, no qué archivo se tocó.

❌ "edit useCategories.js"
✅ "Categorías custom: archivar en vez de borrar"

## 11. Cuando un comentario está bien y cuando sobra

✅ Vale la pena comentar:

- Decisiones que parecerían un bug a primera vista ("aquí parece que falta
  X pero no, porque…").
- Reglas de negocio no obvias ("default categories siempre presentes —
  ver ADR-0005").
- Efectos colaterales no triviales (`onSuccess` de mutaciones, idempotencia
  de la materialización de recurrentes).
- Cualquier `// eslint-disable-next-line` o `// @ts-expect-error` futuro.

❌ Sobran:

- Comentarios de cabecera de archivo con "Author / Date" — git lo sabe.
- Comentarios que repiten la siguiente línea en español.
- `// TODO` sin contexto ni fecha. Si vale la pena, abrir issue o nota en
  `PLAN.md`.
