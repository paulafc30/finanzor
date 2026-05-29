# ADR-0005 — Categorías por defecto no se borran

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto.

## Contexto

Al registrarse, un trigger SQL crea **9 categorías por defecto** para el
usuario (Alimentación, Transporte, Ocio, Hogar, Salud, Ropa, Educación,
Suscripciones, Ahorro).

Si las dejamos eliminables, un usuario novato puede vaciar el listado por
accidente y quedarse sin nada al añadir su primer movimiento. Además, la
categoría especial "Ahorro" es la base de
`useSavingsFromExpenses` y romperla rompe esa pantalla.

## Decisión

Las categorías con `is_default = true`:

- **No** se pueden eliminar.
- **No** se pueden archivar (ver
  [ADR-0006](0006-archivar-categorias-en-vez-de-borrar.md)).
- **Sí** se pueden renombrar y cambiar de color/icono (preferencia
  estética del usuario, no afecta a la lógica).

El backend (mutaciones en `useCategories.js`) valida `is_default` antes de
intentar borrar/archivar y lanza error en español. La UI directamente no
muestra el botón.

## Consecuencias

✅ Garantía de que el usuario siempre tiene mínimo 9 categorías
   disponibles.
✅ El cálculo de "Ahorro" no se rompe por borrar la categoría base.
✅ El usuario sigue teniendo control estético (nombre, color, icono).

❌ Un usuario que quiera "limpiar" del todo no puede deshacerse de las que
   no usa: las puede dejar minimizadas con nombres tipo "—" si quiere, pero
   no las elimina.

## Disparadores para reabrir

Si en algún momento la regla genera fricción real (feedback múltiple), se
puede valorar:

- Permitir borrar siempre que queden ≥ N categorías por defecto.
- Hacer la categoría "Ahorro" inmutable y permitir borrar las otras 8.
