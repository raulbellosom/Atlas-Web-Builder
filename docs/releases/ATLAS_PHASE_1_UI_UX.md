# Atlas — Fase 1: UI/UX del editor

Fecha: 2026-11-13. Estado: **APTO PARA REVISIÓN VISUAL DE FASE 1**. Cierre de Fase 1.1: **APTO para preparar 0.5.0** (ver [Fase 1.1](#fase-11--pulido-visual-controles-y-experiencia-táctil)). Fase 1.2: **APTO PARA REVISIÓN ESTÉTICA FINAL DE ATLAS 0.5.0** (ver [Fase 1.2](#fase-12--rediseño-visual-con-lucide-y-radix)).

Implementación local sobre `main`, partiendo de `e5a2939d9a28a7693f2339641f0e9a63b8c644ef`. No se crearon ramas ni worktrees. No se hicieron push, publicación npm ni despliegues. ERP y Developer Hub no se modificaron. La versión npm estable sigue siendo 0.4.0; esta UI todavía no forma parte de ella.

## Entrega funcional

### Corte A — Apariencias y overlays

- Light, dark y system mediante tokens semánticos de fondo, texto, foco, bordes, estados, sombras y superficies. El cambio del sistema se escucha en el documento propietario del editor.
- La apariencia no modifica Page, Theme, selección ni historial; tampoco remonta el editor. El website conserva su propia paleta y una página blanca permanece blanca en dark mode.
- Variables limitadas a `.atlas-wb-editor-scope` y `.atlas-wb-overlay-scope`, sin tokens en `:root`. Menús, comboboxes, tooltips y diálogos heredan la apariencia.
- Portales dentro del editor y su documento propietario, compatibles con iframe y fullscreen. Diálogos con foco inicial, Tab contenido, Escape y restauración al invocador. Las superficies anidadas cierran sólo la superior.
- Preferencia de movimiento reducido y estados de foco visibles. Se comprobaron contrastes AA de los pares de tokens principales; esto no equivale a una certificación completa de accesibilidad.

### Corte B — Controles e inspector

Se reutilizaron React, CSS y los sensores de @dnd-kit existentes. No se añadió una biblioteca UI ni se cambiaron dependencias o lockfiles.

| Componente | Comportamiento |
| --- | --- |
| `NumberInput`, `SliderInput` | Incrementos, límites, borrador inválido sin persistir y slider acompañado de número |
| `UnitInput` | px, %, rem, em, vh, vw y auto; expresiones desconocidas preservadas hasta reemplazo explícito |
| `SegmentedControl` | Alineación y opciones excluyentes; flechas, Home/End y foco itinerante |
| `Combobox` | Búsqueda, listbox, teclado y portal; sólo confirma opciones registradas |
| `SwitchControl`, `CheckboxControl` | Controles nativos etiquetados con presentación coherente |
| `ColorInput` | Selector nativo, borrador hexadecimal y swatches |
| `Popover`, `Tooltip` | Overlays aislados, acceso con teclado y foco |
| Campos existentes | Select nativo, texto multilínea, colores por token, espaciado, fondos y medios conservados |

Los metadatos de campo pueden optar por los tipos `slider`, `unit`, `segmented`, `combobox`, `switch`, `checkbox` y `color`. No se reescribieron los bloques para introducir formatos nuevos: los colores por token siguen guardando claves, y las unidades se usan donde el contrato ya admite una cadena CSS. Fondos y medios conservan sus estructuras compuestas y metadatos.

El inspector conserva las agrupaciones declaradas y organiza campos sin grupo en Contenido, Layout, Tipografía, Apariencia, Bordes y sombras y Avanzado. Efectos mantiene sus controles anteriores; opacidad incorpora slider y número. Las categorías se contraen y distinguen valores heredados, predeterminados, modificados y de sólo lectura.

Restablecer sólo aparece para campos editables con un valor predeterminado conocido; no se ofrece para medios con metadatos acoplados. Un tipo de control desconocido es de sólo lectura, sin restablecimiento. Las propiedades desconocidas se muestran como datos de sólo lectura y permanecen intactas. Se mantienen `CapabilityBoundary` y capacidades v1, incluidas las restricciones de efectos, SEO, temas y assets. No se tocaron validadores ni se incorporó ejecución de JavaScript.

### Corte C — Responsive, touch y teclado

- Escritorio: biblioteca/capas de 272 px, canvas central e inspector de 312 px; ambos paneles colapsables.
- Ancho del editor hasta 1100 px: drawers; hasta 600 px: inspector inferior y navegación Bloques/Capas/Propiedades. Se observa el ancho del contenedor, por lo que también funciona incrustado en un host estrecho.
- Paneles cerrados con `inert`, foco restaurado al invocador y un solo panel compacto abierto. Canvas visible tras el panel, sin bloquear el scroll global del host.
- Barra superior compacta con menú de acciones, sin perder guardar, publicar, importar/exportar, dispositivos o apariencia. Altura basada en visualViewport y áreas seguras CSS.
- Canvas con anchos lógicos 1280/834/390, ajustar, zoom 25–150% y desplazamiento. El zoom no se guarda en Page ni afecta al historial.
- Herramientas de bloque fuera del canvas escalado, con objetivos de 44 px. Selección sin navegar enlaces, incluidos los de nueva pestaña; vista previa conserva su comportamiento anterior.
- Ratón con distancia de activación 6 px; touch con pulsación de 220 ms y tolerancia 8 px. `touch-action: none` sólo en tiradores. El contenido y la biblioteca permiten scroll natural; tocar una tarjeta inserta un bloque.
- Corrección de colisión al reordenar bloques de alturas diferentes bajo zoom y del índice al mover hacia abajo. Se conserva la protección de ciclos del árbol.
- Alternativas: botones para mover bloques y teclado para arrastrar, seleccionar y recorrer capas. Instrucciones y anuncios de drag en español. Atajos limitados al editor y excluidos de diálogos.

## API pública nueva

Las nuevas props son opcionales:

```jsx
const [appearance, setAppearance] = React.useState('system')

<AtlasWebBuilderEditor
  blocks={baseBlocks}
  initialPage={page}
  theme={websiteTheme}
  capabilities={hostCapabilities}
  appearance={appearance}
  onAppearanceChange={setAppearance}
/>
```

`appearance` acepta `light | dark | system` en modo controlado. En modo no controlado, `defaultAppearance` establece el valor inicial y su valor por defecto es `system`. `onAppearanceChange(mode)` notifica la elección solicitada, no cada cambio de preferencia del sistema.

`useEditorAppearance()` devuelve `null` fuera del proveedor; dentro expone `appearance`, `resolvedAppearance` y `setAppearance`. Los componentes del editor pueden consumirlo. `editorControls` es un namespace público con los diez controles de la tabla anterior. Importación:

```js
import { useEditorAppearance, editorControls } from '@raulbellosom/atlas-web-builder'
const { NumberInput, Combobox, ColorInput } = editorControls
```

El CSS sigue entrando por `@raulbellosom/atlas-web-builder/styles`. `theme` continúa siendo el tema del website. Estas APIs requieren el futuro paquete con Fase 1, no el npm 0.4.0 actual.

## Compatibilidad con 0.4.0

`scripts/verify-phase1-compatibility.mjs` compara el build local con el tarball estable verificado. Resultado guardado en [compatibility.json](evidence/phase-1/compatibility.json):

- Se conservan los 140 exports anteriores; ahora hay 142, con igualdad de nombres ESM/CJS.
- `editorCapabilitiesVersion = 1`, sin cambio del contrato.
- Metadatos de bloques base idénticos: defaults, fields y slots.
- Serialización y reapertura exactas del documento de prueba con propiedades históricas desconocidas. El reloj se fija únicamente durante la comparación porque ambos serializadores actualizan `updatedAt`.
- HTML SSR público idéntico byte a byte para el fixture de compatibilidad, incluyendo efectos. Es evidencia dirigida, no una comparación exhaustiva de todos los sitios posibles.
- No hay cambios de Fase 1 en schema, migraciones, renderer, persistencia, bloques, registro, provider o tema del website. No se modificó el catálogo de Runly ni se repitió su auditoría de 148 bloques; tampoco se afirma haber certificado otra adopción de consumidores.

El tag `v0.4.0` permanece en `62e9688eba083cb8c4f82f00ee8075cca41681f1`. El tarball estable conserva SHA-256 `988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2`. `package.json` permanece en 0.4.0; no se reconstruyó ni sustituyó el artefacto estable, sólo se generó el build local de desarrollo.

## Validación y evidencia

### Pruebas dirigidas

82 pruebas distintas aprobadas en 16 archivos afectados: editor (1), apariencia (3), inspector/controles (5), colisiones (2), paneles responsive (1), edición inline (3), anidación/enlaces (2), capacidades (5), efectos (13), assets (11), tema (6), renderer (5), SSR (3), navbar móvil (5), store (7) y persistencia (10). Se corrigió el setup DOM para no afectar las pruebas SSR en entorno Node. No se ejecutó una suite global innecesaria.

`npm run lint`, `npm run build` y el verificador de compatibilidad: aprobados. El build genera ESM, CJS y CSS sin añadir dependencias. React Doctor: 75/100, cero errores y cinco advertencias: dos sobre complejidad de componentes y tres sobre sincronización de borradores numéricos/hex con cambios externos, reset y undo. No se deshabilitaron reglas para ocultarlas.

### Navegadores

| React | Chromium | WebKit |
| --- | --- | --- |
| 18.3.1 | 320×700, 390×844, 768×1024, 1024×768, 1440×900 aprobados | Los mismos cinco tamaños aprobados |
| 19.3.0 | Flujo completo 390×844, controles y casos de integración aprobados | Flujo completo 390×844, controles y casos de integración aprobados |

En cada tamaño de React 18 se probaron tres apariencias y cambios del sistema, selección, modificación, guardado/reapertura con remount del host, undo/redo, campos y reset, overlays/foco, navegación por teclado y ausencia de overflow horizontal del host. También se comprobaron controles nuevos, capacidades restringidas, preview, ancho incrustado e iframe en ambos motores y versiones de React. No hubo excepciones de página ni errores de consola en los recorridos aprobados.

Se verificó drag con ratón en escritorio y teclado en escritorio/móvil. En 390 px se probó long press, arrastre táctil y scroll de biblioteca: Chromium con eventos confiables CDP, WebKit con TouchEvents sintéticos. Fullscreen real se verificó en Chromium; no se verificó en WebKit (el campo `fullscreen: false` del resultado indica caso omitido, no fallo probado). Movimiento reducido se comprobó en 390 px. La reducción de altura a 420 px simula el espacio disponible con teclado, sin abrir un teclado de sistema operativo.

Resultados completos: [React 18](evidence/phase-1/react18-browser-results.json) y [React 19](evidence/phase-1/react19-browser-results.json).

### Reproducción

```powershell
npm run lint
npm run build
node scripts/verify-phase1-compatibility.mjs
$env:ATLAS_BROWSER_TOOLS = 'D:/RacoonDevs/runly-developer-hub/package.json'
node scripts/test-editor-ui.mjs
# Pase dirigido adicional con peers React 19 instalados en ese entorno:
$env:ATLAS_TEST_REACT = 'D:/RacoonDevs/runly-developer-hub/package.json'
$env:ATLAS_TEST_WIDTH = '390'
node scripts/test-editor-ui.mjs
```

El runner usa Playwright y navegadores ya instalados, en este entorno mediante el Hub en modo de lectura, sin modificarlo. En otro equipo se necesita una instalación de Playwright con Chromium/WebKit; `ATLAS_BROWSER_TOOLS` acepta su package.json. `ATLAS_TEST_REACT` debe apuntar a un entorno con los peers deseados. Los resultados y capturas se escriben en `.artifacts/phase-1` o `.artifacts/phase-1-react19`; el servidor es temporal y local. No es un despliegue.

### Capturas

Capturas reales de los recorridos aprobados, revisadas visualmente. El texto de prueba muestra el ancho para identificar el guardado/reapertura. Nota de Fase 1.1: estas capturas se tomaron durante la transición de color de 100 ms posterior al cambio de apariencia; por eso las tarjetas de la biblioteca y algunos botones aparecen grises en `desktop-dark.png` y el segmentado de `mobile-inspector.png` muestra un estado intermedio. Las capturas corregidas están en [Fase 1.1](#fase-11--pulido-visual-controles-y-experiencia-táctil).

![Escritorio claro](evidence/phase-1/desktop-light.png)

![Escritorio oscuro con website blanco](evidence/phase-1/desktop-dark.png)

![Tablet con inspector lateral](evidence/phase-1/tablet-inspector.png)

![Móvil oscuro](evidence/phase-1/mobile-dark.png)

![Móvil con hoja de propiedades](evidence/phase-1/mobile-inspector.png)

## Commits locales

| Entregable | Commit |
| --- | --- |
| A: apariencias y portales | `b749a54d4d0796aab5c110813f031c6dc6d3696a` |
| B: controles e inspector | `b3b487022908e39eadff546d6de94acda01196c6` |
| C: responsive, touch y verificadores | `5c04a649dc9b45b62a27514dc91b3b9bbf4b0566` |
| Protección de campos desconocidos y grupos legacy | `d53ae6c2e71769fca21d5fa6bff9e7a2fe761b53` |

El commit de documentación que contiene este informe agrega README, changelog, capturas y resultados. Estos commits se publicaron después en `origin/main`. Las referencias anteriores se conservan.

## Archivos modificados

Listado respecto de la base al iniciar esta fase, incluyendo esta entrega documental:

```text
CHANGELOG.md
docs/releases/ATLAS_PHASE_1_UI_UX.md
docs/releases/evidence/phase-1/compatibility.json
docs/releases/evidence/phase-1/desktop-dark.png
docs/releases/evidence/phase-1/desktop-light.png
docs/releases/evidence/phase-1/mobile-dark.png
docs/releases/evidence/phase-1/mobile-inspector.png
docs/releases/evidence/phase-1/react18-browser-results.json
docs/releases/evidence/phase-1/react19-browser-results.json
docs/releases/evidence/phase-1/tablet-inspector.png
README.md
scripts/test-editor-ui.mjs
scripts/verify-phase1-compatibility.mjs
src/__tests__/editorAppearance.test.jsx
src/__tests__/editorCollision.test.js
src/__tests__/inspectorControls.test.jsx
src/editor/assets/AssetPicker.jsx
src/editor/AtlasWebBuilderEditor.jsx
src/editor/chrome/BlockToolbar.jsx
src/editor/chrome/Canvas.jsx
src/editor/chrome/CanvasViewport.jsx
src/editor/chrome/EditableBlock.jsx
src/editor/chrome/LayersPanel.jsx
src/editor/chrome/LeftPanel.jsx
src/editor/chrome/MobileTools.jsx
src/editor/chrome/PropertiesPanel.jsx
src/editor/chrome/PropertyField.jsx
src/editor/chrome/propertyGroups.js
src/editor/chrome/RightPanel.jsx
src/editor/chrome/ToolbarCommands.jsx
src/editor/chrome/TopBar.jsx
src/editor/chrome/UniversalEffects.jsx
src/editor/dnd/accessibility.js
src/editor/dnd/collision.js
src/editor/fields/BackgroundField.jsx
src/editor/fields/ColorTokenField.jsx
src/editor/fields/ControlFields.jsx
src/editor/fields/ImageField.jsx
src/editor/fields/index.js
src/editor/fields/NumberField.jsx
src/editor/fields/SelectField.jsx
src/editor/fields/SpacingField.jsx
src/editor/linkGuard.js
src/editor/seo/SeoPanel.jsx
src/editor/ui/ChoiceControls.jsx
src/editor/ui/EditorAppearance.jsx
src/editor/ui/index.js
src/editor/ui/keyboard.js
src/editor/ui/NumericControls.jsx
src/editor/ui/OverlayControls.jsx
src/editor/ui/useWorkspaceLayout.js
src/index.js
src/styles/editor.css
src/test/setup.js
tests/browser/controlChecks.mjs
tests/browser/edgeChecks.mjs
tests/browser/editor.jsx
tests/browser/gestures.mjs
tests/browser/iframe.html
tests/browser/index.html
```

## Limitaciones y siguiente versión

- No se probaron teléfonos/tabletas físicos, teclados virtuales reales ni selectores de color de cada sistema operativo. WebKit táctil usa eventos sintéticos; se recomienda una pasada manual en Safari/iOS y Android antes del release.
- Fullscreen: verificado en Chromium y, desde Fase 1.1, en el motor WebKit de escritorio de Playwright. Safari de iPhone no expone fullscreen de elementos y no se verificó (ver Fase 1.1).
- Hay zoom mediante controles y scroll; no se implementó un gesto de pinch exclusivo del editor. Se conservan los gestos nativos disponibles del navegador. Evaluación en Fase 1.1.
- Las pruebas de contrato son dirigidas. No se modificaron ni desplegaron integraciones de ERP/Hub ni se certifica producción con esta UI.
- Las cinco advertencias de React Doctor se revisaron en Fase 1.1; ninguna queda con consecuencia funcional abierta. No hay errores reportados por esa herramienta.
- No se inició Fase 2. Los controles existentes de tipografía y degradados se conservan; no se añadió su edición avanzada.

Se recomienda **0.5.0** para un futuro release, por las APIs opcionales nuevas y el alcance del cambio del editor, manteniendo compatibilidad del contenido y capacidades v1. Requiere revisión visual y autorización independiente de preparación/publicación. No debe publicarse el build de Fase 1 como otra instancia de 0.4.0.

Para volver al punto estable se puede consumir npm 0.4.0 y el tag `v0.4.0`; para deshacer esta UI en la historia compartida se usarían commits de revert en orden inverso, sin reset destructivo ni force push. Fase 1 y Fase 1.1 están en `origin/main`; no hay publicación npm ni despliegue, y producción permanece intacta.

**APTO PARA REVISIÓN VISUAL DE FASE 1**.

## Fase 1.1 — Pulido visual, controles y experiencia táctil

Fecha: 2026-11-13. Base: `fef8c178f757f0dcc45279994286064fc9bc8d87`, sobre `main`, sin ramas. Commit de código: `47557a9bf0fe27b37d115925b16178d6be99f79c`. No se modificaron ERP ni Hub (el Hub sólo se usó en modo lectura como fuente de Playwright y de los peers de React 19). Versión del paquete: 0.4.0, sin cambios. Sin publicación npm ni despliegue.

### Revisión de las cinco capturas de Fase 1

| Observación | Causa | Resolución |
| --- | --- | --- |
| Tarjetas de la biblioteca y botones grises en `desktop-dark.png` | Captura tomada durante la transición de color de 100 ms tras cambiar a oscuro. En reposo, la tarjeta es `#191f2b` sobre panel `#121824`, con texto `#e7edf7`, medido en el navegador | El runner espera a que terminen las transiciones antes de cada captura (`settle`) |
| Segmentado sin opción marcada en `mobile-inspector.png` | El mismo artefacto de transición. Además, `:hover` sustituía el fondo de la opción marcada y en touch queda fijo tras tocar | Hover sólo con `(hover: hover)` y nunca sobre la opción marcada. También en las tarjetas de la biblioteca |
| Encabezado **Efectos** desalineado, chevron recortado | Margen negativo aplicado dos veces (contenedor y sección): 335 px de ancho en un panel de 311 px | Se elimina el margen del contenedor y el borde duplicado |
| Estado («Modificado», «Heredado») encima de la etiqueta, al mismo peso que los encabezados de sección | Orden de los elementos y etiquetas en mayúsculas, con tamaño y color casi iguales a los de las secciones | Etiqueta → control → estado y restablecer. Las etiquetas pasan a frase en color principal; las secciones son el único nivel en mayúsculas. El orden del DOM y del foco coincide con el visual |
| Hover primario sin cambio en oscuro | `--awb-accent-hover` casi igual a `--awb-accent` | `#2b55b8`; el texto blanco mantiene AA |

### Controles unificados

- Los selects de apariencia y zoom usan el mismo chevron que los campos (token `--awb-chevron`) y siguen siendo `<select>` nativos, de modo que en touch abren el selector del sistema.
- El interruptor apagado usa `--awb-muted` para el riel: en claro y oscuro alcanza 3:1 frente al panel, y el pulgar se distingue en oscuro.
- Encabezados de sección de 40 px de altura mínima. Espaciado del inspector: 14 px entre propiedades y la fila de estado pegada a su control. No cambian contratos, tipos de campo ni valores guardados.

### Bottom sheet, overlays y barra contextual (320 y 390 px)

- Se mantiene la comprobación existente: con la altura reducida a 420 px, la hoja de propiedades no queda recortada. Se añade otra: la hoja no cubre la barra superior.
- **Defecto corregido**: cuando el anfitrión reducía la altura del editor sin un `resize` de ventana (layout del host, o `visualViewport` con teclado), la barra contextual del bloque conservaba su posición anterior y quedaba visible fuera del editor. Se reprodujo en WebKit a 320 px: falló en 2 de 2 ejecuciones sin la corrección y pasó en 2 de 2 con ella. Ahora el `ResizeObserver` también observa el canvas. La nueva comprobación del runner acepta la barra dentro del canvas o, si el bloque quedó fuera de la vista, oculta.

### React Doctor

Ejecutado con `npx react-doctor@latest`, sin instalarlo en el proyecto. Con alcance desde la base de Fase 1 (`e5a2939`): 75/100, las mismas cinco advertencias y ningún error. Con alcance limitado a los cambios de Fase 1.1: 90/100, sin advertencias.

| Advertencia | Consecuencia funcional | Decisión |
| --- | --- | --- |
| Complejidad de `EditableBlock` y `PropertyField` | Ninguna, es de mantenimiento | Sin cambios |
| `NumberInput`: reinicio y ajuste del borrador al cambiar la prop (×2) | **No demostrable.** React no reescribe un `input[type=number]` con un valor numéricamente igual, así que «1.0» no colapsa a «1» mientras se escribe. Undo y reset externos sí actualizan el borrador | Sin cambios. Se añadió una prueba de regresión |
| `ColorInput`: reinicio del borrador al cambiar la prop | **Demostrable en un caso relacionado:** tras un hexadecimal rechazado, volver a elegir el mismo color en una muestra o en el selector nativo dejaba el borrador inválido y su aviso, porque el valor no cambiaba | Corregido: elegir un color reemplaza también el borrador. Prueba añadida. La advertencia persiste porque el efecto sigue siendo necesario para undo y cambios externos |

### Fullscreen en WebKit

La comprobación de Fase 1 sólo se ejecutaba en Chromium. El motor WebKit de escritorio de Playwright expone la API sin prefijo y entra en fullscreen de elementos. Ahora la misma comprobación se ejecuta en ambos motores: el portal del selector de medios queda dentro del elemento fullscreen y el foco permanece contenido (`fullscreen: true` en ambos resultados).

**No verificado**: Safari en iPhone no admite fullscreen de elementos que no sean vídeo, así que ese caso no aplica en iPhone. Safari en macOS e iPadOS sólo se cubre a través del motor WebKit de Playwright en Windows, no con Safari real. Tampoco se verificó el antiguo `webkitfullscreenchange` con prefijo; el editor sólo escucha el evento estándar (Safari 16.4 o posterior).

### Pinch zoom del canvas (evaluación)

No se implementó. Un pinch propio del editor obligaría a usar `touch-action: none` o a cancelar `gesturestart` y `touchmove` en el canvas. Eso desactivaría el scroll natural con un dedo durante el gesto y el zoom de accesibilidad del navegador, y en WebKit los eventos de gesto son propietarios. Además, la calibración de umbrales exige dispositivos físicos, que no hubo. Hoy los bloques declaran `touch-action: pan-x pan-y pinch-zoom`, que mantiene el pinch nativo del navegador, y el zoom del lienzo (25–150 %) se controla con los botones y el select. Se recomienda, si se pide, añadirlo después de 0.5.0 como opción explícita del host y validarlo en iOS y Android físicos.

### Validación

- Unitarias dirigidas: 39 pruebas en 8 archivos (editor, apariencia, inspector y controles, capacidades, edición inline, paneles responsive, tema, efectos). Todas aprobadas, dos de ellas nuevas.
- `pnpm lint` y `pnpm build`: aprobados. Compatibilidad ([compatibility.json](evidence/phase-1.1/compatibility.json)): 140 exports anteriores conservados (142 en total), capacidades v1, metadatos de bloques idénticos, SSR del renderer público idéntico byte a byte, JSON idéntico y SHA-256 del tarball 0.4.0 sin cambios. El verificador necesita el `tar` de Windows (bsdtar) primero en el `PATH`; el GNU tar de Git Bash interpreta `D:` como un host remoto.
- Navegadores, React 18.3.1: Chromium y WebKit a 1440×900, 1024×768, 768×1024, 390×844 y 320×700, en claro, oscuro y sistema. Todos aprobados, más controles y casos límite en ambos motores ([resultados](evidence/phase-1.1/react18-browser-results.json)).
- React 19.3.0: Chromium y WebKit a 390×844, aprobados ([resultados](evidence/phase-1.1/react19-browser-results.json)).
- Sin acceso a dispositivos físicos. Touch se emuló (CDP en Chromium, TouchEvents sintéticos en WebKit) y el teclado virtual se simuló reduciendo la altura. Esto **no** es una certificación de compatibilidad en iOS ni Android.

### Capturas nuevas

| Escenario | Captura |
| --- | --- |
| Escritorio claro, 1440 | ![Escritorio claro, 1440](evidence/phase-1.1/desktop-light.png) |
| Escritorio oscuro, 1440: biblioteca y Efectos corregidos | ![Escritorio oscuro, 1440: biblioteca y Efectos corregidos](evidence/phase-1.1/desktop-dark.png) |
| Tablet 768, inspector claro | ![Tablet 768, inspector claro](evidence/phase-1.1/tablet-inspector-light.png) |
| Tablet 768, inspector oscuro | ![Tablet 768, inspector oscuro](evidence/phase-1.1/tablet-inspector-dark.png) |
| Móvil 390 oscuro | ![Móvil 390 oscuro](evidence/phase-1.1/mobile-390-dark.png) |
| Móvil 390, hoja de propiedades clara | ![Móvil 390, hoja de propiedades clara](evidence/phase-1.1/mobile-390-inspector-light.png) |
| Móvil 390, hoja de propiedades oscura | ![Móvil 390, hoja de propiedades oscura](evidence/phase-1.1/mobile-390-inspector-dark.png) |
| WebKit 320 oscuro | ![WebKit 320 oscuro](evidence/phase-1.1/webkit-320-dark.png) |
| WebKit 320, hoja de propiedades | ![WebKit 320, hoja de propiedades](evidence/phase-1.1/webkit-320-inspector-light.png) |

### Archivos de Fase 1.1

```text
docs/releases/ATLAS_PHASE_1_UI_UX.md
docs/releases/evidence/phase-1.1/*  (9 capturas, resultados React 18/19, compatibility.json)
CHANGELOG.md
scripts/test-editor-ui.mjs
src/__tests__/inspectorControls.test.jsx
src/editor/chrome/BlockToolbar.jsx
src/editor/chrome/PropertyField.jsx
src/editor/ui/OverlayControls.jsx
src/styles/editor.css
tests/browser/edgeChecks.mjs
```

Las capturas de Fase 1 se conservan sin cambios.

### Estado final

**APTO para preparar Atlas 0.5.0.** Condiciones que siguen pendientes: una pasada manual en Safari/iOS y en Android físicos antes de publicar, y la autorización independiente del release. La versión estable sigue siendo 0.4.0.

## Fase 1.2 — Rediseño visual con Lucide y Radix

Fecha: 2026-11-13. Base: `797dee25eda293e9acf6ca53bd36c5753c0c9c06`, sobre `main`, sin ramas ni worktrees. No se modificaron ERP ni Developer Hub; del Hub sólo se usaron, en lectura, Playwright y los peers de React 19. No hay publicación npm, tag definitivo ni despliegue. La versión sigue siendo 0.5.0 sin publicar, y npm estable sigue en 0.4.0.

### Bibliotecas

| Paquete | Rango en `package.json` | Lockfile del repositorio | Consumidores limpios |
| --- | --- | --- | --- |
| `lucide-react` | `^1.65.0` | 1.65.0 (publicado el 2026-10-30) | 1.72.0 |
| `@radix-ui/react-dialog` | `^1.3.1` | 1.3.1 | 1.3.1 |
| `@radix-ui/react-dropdown-menu` | `^2.2.1` | 2.2.1 | 2.2.1 |
| `@radix-ui/react-popover` | `^1.3.1` | 1.3.1 | 1.3.1 |
| `@radix-ui/react-tooltip` | `^1.4.1` | 1.4.1 | 1.4.1 |

Los cinco paquetes declaran compatibilidad con React 18 y 19 y se excluyen del build de la biblioteca, igual que las dependencias anteriores. No se instalaron Radix Themes, shadcn/ui ni otra biblioteca de iconos. En el lockfile se fijó una versión de Lucide con al menos dos semanas de antigüedad; los consumidores resuelven la última versión dentro del rango, y ambas versiones se probaron.

**Corrección de seguridad de dependencias existentes.** La revisión de dependencias detectó que el lockfile resolvía `dompurify@3.4.7`, con diez avisos hasta 3.4.16 (uno crítico, `SAFE_FOR_TEMPLATES`, y varios XSS en modo `IN_PLACE` y con hooks), y una versión de `nanoid` anterior a 5.1.16 (aviso alto). Atlas no usa `IN_PLACE` ni hooks, pero los rangos `^3.1.6` y `^5.1.11` permitían versiones vulnerables. Ahora exigen `^3.4.17` y `^5.1.16`. `pnpm audit --prod` no informa vulnerabilidades conocidas. Ambas dependencias son externas al build, así que JS y CSS no cambian. Las pruebas de sanitización, SSR, persistencia e identificadores pasaron: 87 en 11 archivos.

### Componentes migrados a Radix

| Antes | Ahora |
| --- | --- |
| Modal del selector de medios con `DialogSurface` | `Dialog` modal: foco atrapado, Escape, título accesible y devolución del foco al botón que lo abrió |
| Popover de «Más acciones» con selects | `DropdownMenu` no modal con grupos `menuitemradio` (dispositivo y apariencia), Importar/Exportar, Guardar y Publicar |
| Select de apariencia de la barra superior | `DropdownMenu` con Claro, Oscuro y Sistema |
| `editorControls.Popover` | `Popover` de Radix, con las mismas props públicas |
| `editorControls.Tooltip` y `title` de los botones de icono | `Tooltip` de Radix; `IconButton` interno une nombre accesible y tooltip |

`OverlayPortal` pasa a cada `Portal` de Radix el contenedor del editor en su propio documento, o el elemento fullscreen que lo contiene, y la clase de apariencia. Dentro de un proveedor nunca recurre al `body` del anfitrión. Los menús no son modales: no bloquean el scroll ni cambian `pointer-events` en el `body` del anfitrión. El diálogo de medios sí es modal: mientras está abierto, Radix bloquea el scroll del documento propietario y oculta el resto de la página a tecnologías de asistencia, y lo restaura al cerrar. Esta limitación queda documentada en la guía de migración.

Se retiraron `DialogSurface` y el posicionamiento manual de popover y tooltip, cubiertos por pruebas de navegador de foco, Escape, devolución de foco y contención. Los drawers y la hoja inferior móvil conservan su gestor de foco (`useDialogFocus`), sin cambios de scroll ni touch, y ahora ignoran los eventos que vienen de capas de overlay, para no disputarse el foco con Radix. El combobox sigue siendo propio, porque Radix no tiene un primitive de combobox. Los atajos del editor ignoran también las teclas pulsadas dentro de menús.

### Cambios visuales

- **Sistema:**
  - Tokens claro y oscuro refinados, con bordes discretos y un borde fuerte para hover.
  - Botones primario, secundario, ghost y de icono con alturas de 32 px (44 px en modo compacto), radios de 7 y 10 px y estados hover, focus, active y disabled.
  - Sombras reservadas a superficies flotantes.
  - Lucide de 16–20 px con trazo uniforme, aplicado sólo al chrome: el contenido del canvas no se toca, para que el website se vea igual que publicado.
- **Barra superior:**
  - Paneles, marca e historial a la izquierda; dispositivos centrados en un segmentado; a la derecha, apariencia, vista previa, menú de acciones, Guardar (secundario) y Publicar (primario).
  - En modo compacto quedan historial, vista previa y el menú de acciones.
- **Navegación móvil:** icono y etiqueta visibles, estado activo con fondo y un indicador, objetivos de al menos 44 × 48 px y áreas seguras, sin aumentar la altura de 56 px.
- **Canvas:**
  - Fondo punteado discreto, píldora de zoom flotante y marco del website con sombra suave.
  - Barra contextual ligera, ajustada a su contenido, con objetivos de 44 px a cualquier zoom; por debajo de 360 px oculta la etiqueta.
  - Anillo de selección que se ve igual sobre websites claros y oscuros.
- **Biblioteca:** tarjetas en dos columnas con icono, nombre y asa de arrastre. Tocar una tarjeta sigue insertando el bloque; el asa conserva el arrastre táctil.
- **Inspector:**
  - Encabezado con icono, pestañas que se ajustan a su contenido y secciones de 44 px.
  - Estado modificado con punto de acento y restablecer con icono.
  - Inputs, selects, número unido, segmentado, color, sliders, unidades, Efectos y Tema unificados, con un único anillo de foco.
  - No cambian contratos, valores ni campos persistibles.
- **Playground:**
  - Landing de una marca ficticia hecha sólo con bloques reales, imágenes SVG locales y anclas internas.
  - Apariencia controlada; el pie de pruebas lleva su propio estilo y la etiqueta «Playground», sigue el modo oscuro y ocupa una sola fila en teléfonos.
  - Se conservan guardar y reabrir.

### Defectos encontrados y corregidos durante el corte

| Defecto | Corrección | Evidencia |
| --- | --- | --- |
| Tras elegir una opción de un menú, el foco vuelve al disparador y abre su tooltip, también al tocar en un teléfono (WebKit marca ese foco como visible) | El menú marca la devolución de foco y los tooltips del chrome se abren sólo con hover o con foco de teclado | El runner comprueba que no queda ningún tooltip tras cada selección |
| Las pestañas truncadas («Propied…») en paneles estrechos | Pestañas con ancho ajustado a su contenido | Capturas |
| Doble anillo de foco en inputs | Se suprime el contorno genérico en los campos | Capturas |
| A 320 px la barra contextual tapaba el bloque vecino que la prueba tocaba | La prueba vuelve a seleccionar desde arriba; la etiqueta se oculta por debajo de 360 px | Runner a 320 px |
| En el arnés, Vite cargaba un módulo con dos URL según la mayúscula de la unidad (`d:` frente a `D:`), y la carga fallaba de forma intermitente | El root de Vite se resuelve con `realpath` | 4 de 4 cargas limpias; la matriz completa aprueba |

**Hallazgo previo, no corregido en este corte.** En el canvas de edición, `EditorSlot` envuelve los hijos de un slot en la zona de soltado, así que un `GridBlock` muestra sus elementos apilados en una sola columna, mientras que la vista previa y el website publicado los muestran en cuadrícula. Arreglarlo exige cambiar la geometría de las zonas de soltado y podría romper el arrastre, por lo que se deja para un corte propio con pruebas de DnD. La landing usa `ColumnsBlock`, que el canvas representa fielmente.

### Validación

- **Unitarias:**
  - Suite completa una vez, tras la migración, por afectar al chrome compartido: 210 de 210 en 35 archivos.
  - Después, sólo pruebas dirigidas: 17 de 17 (inspector, apariencia, editor, paneles, capacidades) y 87 de 87 (sanitización, SSR, persistencia, ids, renderer).
  - Se actualizaron dos pruebas por el cambio de mecanismo: la apariencia se elige ahora en un menú y Radix devuelve el foco de forma asíncrona.
- **Navegador, fuentes con React 18.3.1:** Chromium y WebKit a 1440×900, 1024×768, 768×1024, 390×844 y 320×700: 10 de 10. Edge checks en ambos motores: menús con teclado, Escape y devolución de foco, `body` del anfitrión intacto, capacidades, vista previa, embed estrecho, menús y diálogo dentro del iframe, y diálogo y menú dentro del elemento fullscreen ([resultados](evidence/phase-1.2/source-react18-browser-results.json)).
- **Navegador, artefacto empaquetado:** consumidores con React 18.3.1 y 19.3.0: 20 de 20 recorridos sin fallos, con controles y edge checks en ambos motores ([React 18](evidence/0.5.0/react18-browser-results.json), [React 19](evidence/0.5.0/react19-browser-results.json)).
- **Contenido de los recorridos:** apariencias y cambio del sistema, selección, edición, guardar y reabrir con remount, deshacer y rehacer, restablecer, overlays y foco, teclado, scroll de la biblioteca y arrastre táctil emulado (CDP en Chromium, TouchEvents sintéticos en WebKit), movimiento reducido, altura reducida a 420 px, reducción de altura del anfitrión y ausencia de desbordamiento horizontal.
- **Playground LAN:** edición, guardado, recarga, reapertura, datos históricos, imagen local, cero peticiones externas, rutas sensibles denegadas y pie oscuro. Sólo Chromium emulado.
- **Contratos (en ambos consumidores):** se conservan los 140 exports de 0.4.0 (142 en total), capacidades v1, metadatos de los bloques base idénticos, HTML SSR del renderer público idéntico byte a byte y JSON idéntico.
- **React Doctor** (alcance: cambios desde `797dee2`): sin avisos de código. La única incidencia fue la de `dompurify`, corregida arriba.

Fullscreen se verificó en Chromium y en el WebKit de escritorio de Playwright. En WebKit, Escape sale de fullscreen antes de llegar a la página, comportamiento normal de la plataforma, así que la prueba cierra el diálogo con su botón. Safari en iPhone no admite fullscreen de elementos.

### Tamaño del bundle ([detalle](evidence/phase-1.2/bundle-size.json))

| Medida | Antes | Después |
| --- | --- | --- |
| Biblioteca ESM | 357.62 kB (86.31 gzip) | 347.20 kB (86.07 gzip) |
| Biblioteca CJS | 252.65 kB (73.32 gzip) | 244.72 kB (72.98 gzip) |
| CSS | 51.68 kB (9.49 gzip) | 64.17 kB (11.60 gzip) |
| App del playground (JS) | 444.33 kB (137.93 gzip) | 579.68 kB (181.19 gzip) |

La biblioteca baja porque se retiraron los SVG propios y las dependencias son externas. El coste real lo paga el consumidor: Radix aporta ≈ 33.9 kB gzip (cuatro primitives con Floating UI, gestión de foco y bloqueo de scroll) y Lucide ≈ 7.3 kB gzip, con tree-shaking de unos 60 iconos. El resto del aumento corresponde a la landing.

### Capturas

| Escenario | Captura |
| --- | --- |
| Escritorio 1440 claro, bloque seleccionado | ![Escritorio claro](evidence/phase-1.2/desktop-1440-light.png) |
| Escritorio 1440 oscuro, bloque seleccionado | ![Escritorio oscuro](evidence/phase-1.2/desktop-1440-dark.png) |
| Menú de apariencia (oscuro) | ![Menú de apariencia](evidence/phase-1.2/desktop-appearance-menu-dark.png) |
| Diálogo de medios (claro) | ![Diálogo de medios](evidence/phase-1.2/desktop-media-dialog-light.png) |
| Inspector con Layout y Efectos abiertos (oscuro) | ![Inspector](evidence/phase-1.2/desktop-inspector-sections-dark.png) |
| Pestaña Tema (oscuro) | ![Tema](evidence/phase-1.2/desktop-theme-tab-dark.png) |
| Tooltip | ![Tooltip](evidence/phase-1.2/desktop-tooltip-light.png) |
| Tableta 768 claro y oscuro | ![Tableta clara](evidence/phase-1.2/tablet-768-light.png) ![Tableta oscura](evidence/phase-1.2/tablet-768-dark.png) |
| Tableta 768, inspector claro y oscuro | ![Inspector claro](evidence/phase-1.2/tablet-768-inspector-light.png) ![Inspector oscuro](evidence/phase-1.2/tablet-768-inspector-dark.png) |
| Móvil 390 claro y oscuro | ![Móvil claro](evidence/phase-1.2/mobile-390-light.png) ![Móvil oscuro](evidence/phase-1.2/mobile-390-dark.png) |
| Móvil 390, hoja de propiedades clara y oscura | ![Hoja clara](evidence/phase-1.2/mobile-390-inspector-light.png) ![Hoja oscura](evidence/phase-1.2/mobile-390-inspector-dark.png) |
| Móvil 390, menú de acciones y diálogo (oscuro) | ![Menú móvil](evidence/phase-1.2/mobile-390-menu-dark.png) ![Diálogo móvil](evidence/phase-1.2/mobile-390-media-dialog-dark.png) |
| Móvil 320 en WebKit, canvas, hoja y biblioteca | ![320](evidence/phase-1.2/webkit-320-light.png) ![320 hoja](evidence/phase-1.2/webkit-320-inspector-light.png) ![320 biblioteca](evidence/phase-1.2/mobile-320-blocks-light.png) |
| Playground, landing en escritorio | ![Landing clara](evidence/phase-1.2/playground-1440-light.png) ![Landing oscura](evidence/phase-1.2/playground-1440-dark.png) |
| Playground, servicios y planes | ![Servicios](evidence/phase-1.2/playground-1440-light-scrolled.png) ![Planes](evidence/phase-1.2/playground-1440-dark-plans.png) |
| Playground en móvil | ![Landing móvil oscura](evidence/phase-1.2/playground-390-dark.png) ![Landing móvil clara](evidence/phase-1.2/playground-390-light.png) |

Todas las capturas se tomaron después de terminar las animaciones y transiciones. Las de tamaño por apariencia y las del inspector provienen del artefacto empaquetado con React 18; las de menús, diálogos, tooltip y playground se tomaron de las fuentes del mismo commit.

### Commits

| Corte | Commit |
| --- | --- |
| Dependencias Lucide y Radix | `52ee5c6` |
| Sistema visual, overlays de Radix y arnés | `71be4dd` |
| Landing y banco de pruebas del playground | `bf97db3` |
| Documentos empaquetados de 0.5.0 | `61037cd` |
| Tooltip tras devolver el foco un menú | `a3a42fd` |
| Rangos con parche de `dompurify` y `nanoid` | `869fca3` (fuente del tarball) |

### Pendientes

- No se probaron teléfonos físicos. Siguen pendientes la [aceptación en iPhone/Safari y Android/Chrome](ATLAS_0_5_0_MOBILE_ACCEPTANCE.md), el teclado virtual real, los selectores nativos, las hojas y los menús de Radix con gestos y el botón Atrás.
- El problema del canvas con `GridBlock`, descrito arriba.
- La autorización de publicación y el tag `v0.5.0`.

**APTO PARA REVISIÓN ESTÉTICA FINAL DE ATLAS 0.5.0**
