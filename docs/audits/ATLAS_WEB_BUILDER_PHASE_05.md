# Atlas Web Builder — Fase 0.5

Consolidación de fuente y compatibilidad Website. Corte: 13 de noviembre de 2026, America/Mexico_City. Continúa [la auditoría de Fase 0](ATLAS_WEB_BUILDER_PHASE_0.md); no la reemplaza ni repite su investigación.

## Estado final

**NO APTO PARA FASE 1.** La base local y las correcciones están preparadas y verificadas. Falta distribuir y adoptar un Atlas que implemente la API de capacidades: el npm 0.3.5 fijado en ambos consumidores no la contiene. El Hub modificado detecta esa situación e inhabilita explícitamente la edición; no finge que pasar una prop desconocida restringe el motor antiguo.

No se publicó npm, no hubo push ni despliegue. No se cambiaron versiones, dependencias, locks, catálogos ni validadores **en los commits de esta tarea**. El Hub recibió cambios concurrentes ajenos, detallados más adelante y excluidos de nuestros commits.

## A. Fuente consolidada y procedencia

Se creó `consolidation/atlas-0.3.5-phase-05` sobre `dc30666923a6b4d19919a0e154bb4eb2cdd65e2f`. `origin/main` observado localmente sigue en `b2210e7d594f730a5f8f7eec31b44238f867e6e4`. Se conservaron los 16 commits originales y sus 83 archivos; no se copiaron versiones antiguas sobre las recuperadas ni se reescribió su historia.

Antes de corregir fuentes, la compilación de esa base y el empaquetado dry-run reprodujeron **la integridad completa de npm 0.3.5**. Esto añade evidencia de compilación/empaquetado a las 111 fuentes y cinco archivos dist ya comprobados en la auditoría:

```text
pnpm build
npm pack --dry-run --ignore-scripts --json

sha1: 877f213ba27f4bb2f8ab4c52f7e14b3d7bf13fbd
sha512-r/py2SOesIJLNzVCMoA/4Y4E4y6kFL9N2EUlF4SNFFPDCM5wrYGBbctPdRMuFbFH/XHh5lsvhSucXd3625wBJg==
```

package.json y `src/index.js` ya declaraban 0.3.5 correctamente. No se necesitó incrementar ni corregir esa versión. Se corrigieron referencias históricas al nombre npm y la documentación de fieldTypes que el editor integrado no implementa. Se añadió documentación explícita de procedencia y capacidades.

Las correcciones nuevas son **fuente local posterior a la versión publicada**, no los bytes originales de npm 0.3.5. El número se conservó por instrucción del propietario. No debe republicarse ese número ni reemplazarse su tarball. Una entrega consumible futura requiere otra versión aprobada y la adopción explícita de sus consumidores.

## B. Contrato de capacidades

El contrato completo está en [WEBSITE_EDITOR_CAPABILITIES_V1.md](../contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md). Incluye la matriz de representación, edición, renderer, validación, persistencia, publicación y migración para efectos, animación, SEO, temas, fuentes, degradados, responsive, assets y propiedades personalizadas.

Hay cuatro identidades separadas: versión npm 0.3.5, API de capacidades del editor 1, Page schema 1 y Website Template v2. No se modificó la interpretación de los documentos ni del catálogo de 148 tipos/digest existente.

El motor acepta un perfil opcional y rechaza una schemaVersion desconocida. Sin perfil mantiene el comportamiento genérico. El perfil del Hub concentra las restricciones en un archivo declarativo, sin obligar a Atlas a importar @runly/ui.

| Capacidad del Hub | Resultado de esta fase |
|---|---|
| Campos del catálogo | Continúan editables; servidor conserva validación de tipos, límites y contenido |
| Efectos universales | Inspector de sólo lectura; valores originales preservados, sin admitirlos en v2 |
| SEO y metadatos nativos | Sólo lectura; el host conserva gestión de páginas y rutas |
| Colores de tema | Editables con hex de 6/8 dígitos; entrada inválida no sustituye el último token válido y bloquea snapshot mientras esté presente |
| Font, radius, spacing, shadow y otros grupos | Valores visibles de sólo lectura; no se inventan conversiones ni selectores nuevos |
| Tema de marca y reset masivo | Deshabilitados para evitar cambios a grupos no representables |
| Imágenes | Selección de biblioteca; sin URL externa manual ni fallback FileReader que produzca assets no registrados |
| Formulario/calendario | Marcadores de formulario permitidos; calendario sólo lectura, con enlace delegado a importación |
| JSON import, creación de página y templates nativos | Deshabilitados en perfil portable; el host usa sus flujos y ZIPs validados |
| Paquete antiguo sin API 1 | Edición bloqueada con diagnóstico; no se envía loaded ni se habilita guardado |

No se añadió un gestor de fuentes, editor de gradientes avanzado, modo oscuro ni rediseño de componentes. El CSS compilado es idéntico al del paquete original.

## C. Correcciones mínimas y conservación

1. Contexto opcional de capacidades y límites de edición por sección. Los controles nativos deshabilitados conservan el valor; las plantillas nativas no se ofrecen como elementos arrastrables cuando el perfil las prohíbe.
2. Se eliminó la opción de **crear** visibilidad draft, incompatible con el propio serializador Atlas. Las páginas nuevas del editor genérico usan public; ningún documento existente se transforma al abrirlo.
3. El bridge de tema conserva el objeto original y aplica sólo diferencias de color. Guardar sin cambios ya no añade los colores por defecto que no pertenecían al tema original.
4. Los nuevos defaults de instancias en Hub se limitan a propiedades catalogadas; no se añaden metadatos de imagen no portables. Esto no filtra props de documentos históricos. Los 144 tipos no excluidos validan sus defaults con el escritor real.
5. La comprobación del marcador impide ignorar silenciosamente restricciones con una versión antigua de Atlas. El host conserva el error recibido sin sustituirlo posteriormente por un timeout genérico.
6. El lector/escritor sigue rechazando efectos/SEO/tokens no portables. La prueba negativa verifica que el documento original y sus valores no cambian. Un documento ya incompatible **no queda exportable** por esta fase; requiere migración explícita de contrato.

No se tocaron la allowlist de seguridad, rich text, esquemas de ZIP, restricciones de sandbox, permisos, publicación, conformTemplateDocument ni IDs de bloques. La API de UI no sustituye la validación de bytes del servidor.

## D. Pruebas dirigidas

### Resultado verificable por escenario

| Escenario solicitado | Resultado y límite |
|---|---|
| Cargar plantilla existente | Fixture real `tests/fixtures/marketplace-validation/website/valid.zip`; lector compartido instalado, sin plantilla inventada para saltarse validación |
| Editar propiedad soportada | Chromium sobre Frame real: título de Hero y color primary |
| Guardar | Snapshot por MessageChannel; escritor Website real genera ZIP en memoria y valida v2 |
| Reabrir | Lector real reconstruye documento y se vuelve a cargar el iframe |
| Comparar valor exacto | Texto con tildes/ñ y color comparados exactamente; fonts/radius y páginas originales conservados |
| Modificar propiedad no soportada | Efectos, SEO, metadatos, fonts/shadow y otras secciones aparecen deshabilitados; pruebas DOM y Chromium |
| Evitar pérdida silenciosa | Conservación de efectos, SEO y customHistorical en Atlas; rechazo del ZIP incompatible sin mutación; tema sin cambios idéntico al original |
| Color inválido | Chromium comprueba error de snapshot; al corregirlo puede guardar y reabrir |
| Motor publicado antiguo | Fixture carga el npm instalado y comprueba alerta sin controles editables; archivo ZIP guardado permanece idéntico |
| Catálogo 148 | Tipos únicos y claves fields coinciden; defaults de los 144 tipos portables se pasan por el escritor real con su siteKind |
| ERP estructural | normalizeWebsiteDocument real + serialize/parse Atlas conservan efectos, SEO y custom props; no se afirma transacción DB ni publicación |

La prueba browser usa React 19 del Hub y el componente Frame real, sin modificar su lógica para aceptar inputs. Sólo su bundler de prueba resuelve la fuente local de Atlas. También compila y ejecuta el paquete instalado antiguo para comprobar el bloqueo. El producto conserva sus aliases/locks originales.

### Comandos y resultados

En Atlas:

```text
pnpm exec vitest run src/__tests__/capabilities.test.jsx src/__tests__/assets.test.jsx src/__tests__/themeEditor.test.jsx src/__tests__/theme.test.js src/__tests__/layouts.test.js src/__tests__/templates.test.js src/__tests__/seoContext.test.jsx src/__tests__/persistence.test.js
```

**51 pruebas aprobadas en ocho archivos.** Tras añadir comprobaciones de creación de página/restricción, se repitió únicamente capabilities.test.jsx: cinco casos aprobados. version.test.js y nestingAndLinks.test.jsx también pasaron en la ejecución inicial dirigida: tres casos adicionales, sin repetición innecesaria.

En Hub:

```text
node --test tests/website-capabilities.test.js tests/website-capabilities-browser.test.js
```

**Siete casos aprobados**, incluyendo Chromium, normalizador ERP, roundtrip y el recorrido de defaults del catálogo. La prueba de navegador usa puerto efímero local y ZIP en memoria: no usa credenciales, DB, almacenamiento externo ni cuenta de producción.

Lint dirigido de los archivos JS/JSX modificados: aprobado en Atlas y Hub. `git diff --check`: aprobado. Build Atlas: aprobado. ESM y CJS: mismos 140 exports; se conservan los 139 exports recuperados y se añade editorCapabilitiesVersion. styles y package.json continúan resolviendo por los exports existentes. No se modificó package.json del motor.

Los primeros intentos detectaron problemas de fixture: selector exacto del botón Efectos (su nombre incluye chevron), CORS necesario para ESM en el iframe opaco y globals del test de navegador. Se informaron y corrigieron; no se ampliaron suites para compensarlos ni se alteró la seguridad del producto para que pasaran.

React Doctor se ejecutó como pide la guía, sin instalarlo en los proyectos. La primera comparación contra origin/main incluyó el código recuperado anterior y reportó deuda heredada. La comparación acotada a c600e46/HEAD, incluyendo archivos nuevos y excluyendo supply-chain sin cambios de dependencias, finalizó sin errores: Atlas mantiene dos avisos de convención de exports no componentes en el archivo de contexto; Hub no tuvo avisos en su superficie de código revisada. Se aceptan esos dos avisos de mantenimiento para evitar dividir una API pequeña sólo por convención de hot reload; no se suprimieron reglas.

### Empaquetado final local

Build y dry-run final correctos, ocho archivos, 140 exports; CSS idéntico byte a byte al npm original. La integridad local **difiere de npm de forma esperada**, porque contiene correcciones nuevas sin publicar:

```text
sha1: 630a83a0a7b4e2f082826d3b0678181efd758976
sha512-7p5tgm2Ad8FIH8uF3CQAnbIxee4tnINjOw1NBP/7MFL8yeaXguTLXC4gvxQ6EygKEZa2sDFrETY9s1aeiBl2mQ==
```

No se ejecutaron suites globales, E2E con DB, publicación/importación remota, Firefox/WebKit ni build completo del Hub. Esos recorridos no se declaran aprobados; el cambio no modifica CSS ni el contrato de aislamiento del navegador. Los dos bundles de Frame (fuente local y npm original) sí se compilaron y ejecutaron en Chromium.

## Ramas, commits y cambios ajenos

| Repositorio | Rama de esta tarea | Commits |
|---|---|---|
| Atlas | `consolidation/atlas-0.3.5-phase-05` | `c600e46` procedencia/auditoría; `bc08f6e6c4342b768fcdbe0803de9e402d30d94f` motor, contrato y pruebas; este informe se añade en un commit documental posterior |
| Developer Hub | `compatibility/website-capabilities-phase-05` | `033d137b6dbd0ae143c86d54e719245365aa07ca` perfil, integración y pruebas |
| ERP | Sin rama/commit de esta tarea | Sin cambios propios; se usa el contrato/normalizador existente |

Durante la tarea otra sesión cambió la rama activa del Hub a main. Se identificó que el commit 033d137 contenía exclusivamente los siete archivos propios y tenía como padre el HEAD inicial 754c7d7. Se fijó la rama de tarea a ese commit y se restituyó main a su valor inicial mediante actualización de referencia condicionada al SHA esperado. No se usó reset del árbol, stash, rebase ni limpieza de archivos.

Se preservaron y excluyeron de esta entrega los cambios concurrentes ajenos observados en `package.json`, `pnpm-lock.yaml`, `tests/fixtures/playground-overlays.html`, `tests/fixtures/playground-overlays.jsx` y `tests/playground-overlays-browser.test.js`. Su presencia en el árbol compartido no significa que esta tarea actualizara dependencias. Los commits propios son la unidad exacta de entrega; no incluyen esos cambios.

Al cierre también aparecieron cambios ajenos en ERP: `packages/module-compiler/src/browser.js`, `definition.js`, `templates/service.js`, `templates/views.js`, `__tests__/entity-list.test.js` y `list-config.js`. Se dejaron intactos y sin staging/commit de esta tarea. El estado del árbol compartido puede seguir cambiando por esas sesiones; no se declara limpio globalmente.

## Bloqueos concretos y cierre

1. **Adopción del motor:** los locks consumidores siguen fijando el npm 0.3.5 original, sin API 1. Se necesita una nueva distribución autorizada y su adopción para que el Hub real pueda editar con el perfil. El código modificado falla de forma explícita mientras eso no ocurra. No se publica ni se cambian dependencias para simular cierre.
2. **Documentos no portables existentes:** Website v2 continúa rechazando efectos, SEO y tokens avanzados. Se conservan sus valores y se restringe edición; no se afirma que puedan exportarse sin ampliar/versionar contrato. No es necesario ampliar v2 para el subconjunto editado y probado en esta fase.
3. **Verificación operacional pendiente:** no se ejecutó el guardado nativo del ERP/Hub contra DB ni importación/publicación autenticada. Las pruebas locales de writer/reader/Frame y normalización prueban conservación de datos en ese alcance, no los servicios desplegados.

Se puede revisar la consolidación y los cambios locales de compatibilidad. **No se declara cerrada Fase 0.5 ni se inicia Fase 1.** No hubo push, npm publish, despliegue, modificación de producción, rediseño ni relajación de seguridad.

## Archivos propios por repositorio

El inventario siguiente incluye los archivos de procedencia incorporados y los cambios nuevos sobre dc306669. El diff de 83 archivos ya contenido en los 16 commits recuperados se enumera aparte; no se lo atribuye al commit de compatibilidad.

### Atlas ? cambios propios sobre la fuente recuperada

```text
M	CLAUDE.md
M	README.md
M	docs/architecture.md
A	docs/audits/ATLAS_WEB_BUILDER_PHASE_0.md
A	docs/contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md
A	docs/releases/0.3.5-provenance.md
A	src/__tests__/capabilities.test.jsx
M	src/editor/AtlasWebBuilderEditor.jsx
M	src/editor/assets/AssetPicker.jsx
A	src/editor/capabilities.jsx
M	src/editor/chrome/LeftPanel.jsx
M	src/editor/chrome/PropertiesPanel.jsx
M	src/editor/chrome/RightPanel.jsx
M	src/editor/chrome/ThemeTab.jsx
M	src/editor/chrome/TopBar.jsx
M	src/editor/fields/BackgroundField.jsx
M	src/editor/fields/ImageField.jsx
M	src/index.js
A	docs/audits/ATLAS_WEB_BUILDER_PHASE_05.md
```

### Developer Hub ? commit de compatibilidad

```text
M	apps/web/src/marketplace-console/WebsiteEditor.jsx
M	apps/web/src/website/Frame.jsx
A	apps/web/src/website/capabilities.js
M	apps/web/src/website/portable.js
A	apps/web/src/website/theme-portability.js
A	tests/website-capabilities-browser.test.js
A	tests/website-capabilities.test.js
```

### ERP

Ningún archivo modificado por esta tarea.

### Archivos recuperados ya versionados (83)

```text
M	README.md
A	docs/superpowers/specs/2026-11-03-data-blocks-design.md
A	docs/superpowers/specs/2026-11-03-media-performance-design.md
A	docs/superpowers/specs/2026-11-03-motion-effects-design.md
A	docs/superpowers/specs/2026-11-03-seo-design.md
M	package.json
M	src/__tests__/baseBlocks.test.jsx
A	src/__tests__/commerceBlocks.test.jsx
A	src/__tests__/effects.test.jsx
A	src/__tests__/emptyImage.test.jsx
A	src/__tests__/formBlock.test.jsx
A	src/__tests__/media.test.jsx
A	src/__tests__/navbarMobile.test.jsx
A	src/__tests__/nestingAndLinks.test.jsx
A	src/__tests__/resourcesContract.test.jsx
A	src/__tests__/seo.test.js
A	src/__tests__/seoContext.test.jsx
A	src/__tests__/ssr.test.jsx
M	src/assets/createAssetSource.js
A	src/blocks/AddToCartButtonBlock.jsx
M	src/blocks/CardBlock.jsx
A	src/blocks/CartBlock.jsx
A	src/blocks/CategoryListBlock.jsx
A	src/blocks/CheckoutSummaryBlock.jsx
A	src/blocks/CounterBlock.jsx
M	src/blocks/FooterBlock.jsx
A	src/blocks/FormBlock.jsx
M	src/blocks/HeroBlock.jsx
M	src/blocks/ImageBlock.jsx
M	src/blocks/NavbarBlock.jsx
A	src/blocks/ProductDetailBlock.jsx
A	src/blocks/ProductGridBlock.jsx
A	src/blocks/TypewriterBlock.jsx
M	src/blocks/index.js
A	src/commerce/cartStore.js
A	src/commerce/format.js
A	src/commerce/index.js
A	src/commerce/ui.jsx
A	src/commerce/useCart.js
M	src/editor/AtlasWebBuilderEditor.jsx
M	src/editor/assets/AssetPicker.jsx
M	src/editor/chrome/Canvas.jsx
M	src/editor/chrome/LeftPanel.jsx
M	src/editor/chrome/PropertiesPanel.jsx
M	src/editor/chrome/RightPanel.jsx
M	src/editor/chrome/ThemeTab.jsx
M	src/editor/fields/AnimationField.jsx
M	src/editor/fields/ColorTokenField.jsx
M	src/editor/fields/ImageField.jsx
A	src/editor/i18n/brand.es.js
A	src/editor/linkGuard.js
A	src/editor/seo/SeoContext.js
A	src/editor/seo/SeoPanel.jsx
M	src/editor/store/EditorStoreProvider.jsx
A	src/forms/fields.js
A	src/forms/index.js
M	src/index.js
A	src/media/AtlasImage.jsx
A	src/media/index.js
A	src/media/optimizeImage.js
M	src/provider/AtlasWebBuilderProvider.jsx
M	src/registry/createBlockRegistry.js
M	src/renderer/AtlasWebRenderer.jsx
M	src/renderer/BlockRenderer.jsx
M	src/renderer/EffectsWrapper.jsx
A	src/renderer/LazyMount.jsx
A	src/renderer/ParentBlockContext.js
A	src/renderer/effects.js
A	src/resources/contract.js
A	src/resources/index.js
A	src/resources/navigate.js
A	src/resources/sample.js
A	src/resources/useResources.jsx
M	src/schema/asset.js
M	src/schema/page.js
A	src/seo/analyzeSeo.js
A	src/seo/buildSeoMeta.js
A	src/seo/content.js
A	src/seo/index.js
A	src/seo/jsonld.js
A	src/seo/renderSeoHead.js
M	src/styles/editor.css
A	src/theme/brand.js
```
