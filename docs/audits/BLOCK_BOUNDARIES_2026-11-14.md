# Delimitaciones de bloques — 14 de noviembre de 2026

Publicado en Atlas 0.5.1; pendiente de adoptar en los consumidores. Véase el [registro de publicación](../releases/ATLAS_0_5_1_RELEASE.md).

Las líneas anteriores usaban un `outline` interior en el wrapper del bloque. Los fondos de sus hijos podían pintarse encima. Además, `.atlas-wb-block:hover` tenía más prioridad que `.atlas-wb-block--selected`, por lo que el hover atenuaba la selección. El escalado del lienzo reducía también el grosor visible.

La delimitación ahora es una sombra interior en un pseudoelemento absoluto, pintado sobre el contenido y con `pointer-events:none`. No añade borde, padding, margen ni elementos al flujo. Su grosor se compensa con la escala del canvas. Selección y edición inline tienen prioridad sobre hover; los colores siguen siendo los del tema del editor. Se conserva el comportamiento de mostrar las delimitaciones al pasar el puntero, seleccionar o editar.

## Cambios y comprobaciones

- `src/styles/editor.css`: capa de delimitación y prioridad de estados; elimina una regla de edición duplicada.
- `src/editor/chrome/CanvasViewport.jsx`: expone la escala existente mediante una variable CSS local; no cambia documentos ni geometría.
- `tests/browser/editor.jsx`: permite limpiar la selección desde la fixture de pruebas.
- `scripts/test-block-boundaries.mjs`: 16 casos en Chromium/WebKit, anchos 1440/390, temas claro/oscuro y zoom ajustado/25 %/100 %/150 %. Comprueba grosor, color, selección táctil anidada y que las posiciones/dimensiones del contenido relativas al lienzo sean idénticas antes y después de seleccionar.

Comando dirigido, usando una instalación disponible de Playwright:

```powershell
$env:ATLAS_BROWSER_TOOLS=(Resolve-Path '../runly-developer-hub/package.json').Path
node scripts/test-block-boundaries.mjs
```

También pasaron 9 unitarios de editor/apariencia/renderer, ESLint del componente modificado, build ESM/CJS y la prueba del Frame real del Hub con fuente local de Atlas, guardado ZIP y recuperación. React Doctor: 100/100, sin hallazgos en los archivos escaneados. No se repitieron suites globales.

## Evidencia

[Selección de sección en escritorio](evidence/block-boundaries-2026-11-14/desktop-section.png), [selección anidada en WebKit móvil oscuro](evidence/block-boundaries-2026-11-14/mobile-nested.png) y [resultados de los 16 casos](evidence/block-boundaries-2026-11-14/results.json).

La prueba limpia la barra contextual entre casos a zoom muy reducido, porque puede cubrir un bloque pequeño; no cambia su comportamiento. Las mediciones de posición se hacen relativas al canvas para distinguir desplazamiento de layout del scroll automático del navegador.

No se modificaron el renderer público, permisos, sandbox, contratos ni dependencias. La corrección inicial no publicó un paquete. Posteriormente se publicó 0.5.1 por solicitud del propietario; el Atlas 0.5.0 instalado en Hub/ERP no se actualizó. Esos consumidores necesitan adoptar la nueva distribución; JavaScript y CSS deben proceder de la misma versión. No hubo push ni despliegue. Pendiente la comprobación en iPhone físico.
