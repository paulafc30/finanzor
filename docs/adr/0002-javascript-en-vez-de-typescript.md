# ADR-0002 — JavaScript en vez de TypeScript

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto.

## Contexto

Proyecto personal hecho fuera de horas. Una sola desarrolladora. Volumen
relativamente pequeño (≈40 componentes, ≈15 hooks).

El coste de tipar todo con TypeScript en estos primeros meses (tipos de
Supabase autogenerados, generics de React Query, props de componentes…)
ralentiza la iteración cuando el valor añadido es bajo a esta escala.

## Decisión

**JavaScript puro** (`.js` / `.jsx`), con validación de datos en frontera:

- **Zod** para validar lo que entra/sale de los formularios
  (`TransactionForm`, `CategoryForm`, `GoalForm`).
- **React Hook Form** con `register()` + `Controller` para mantener la
  reactividad sin reinventar nada.
- Comentarios JSDoc cuando aportan claridad (objetos complejos como `filter`
  en `MovementsFilters`).

## Consecuencias

✅ Velocidad de iteración alta.
✅ No tengo que mantener los tipos de la BBDD sincronizados con TS cada vez
   que toco el esquema.
✅ Los hooks de dominio actúan como contrato implícito: cualquier consumidor
   recibe los mismos objetos.

❌ No hay seguridad estática en refactors grandes. Compensar con: hooks de
   dominio pequeños, nombres claros, validación Zod en formularios.
❌ Si en el futuro el proyecto crece (familia ampliada, beta de Play Store
   con usuarios reales), conviene reevaluar.

## Disparadores para reabrir esta decisión

- > 80 componentes.
- Aparece un colaborador externo.
- Refactor de modelo de datos con > 3 tablas implicadas en cadena.
