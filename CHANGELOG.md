# Changelog

## 0.6.1

- Elemento básico Logo y marca: imagen sin recorte, nombre opcional, texto adicional, disposición horizontal/vertical, separación y enlace. Mantiene los controles de estilo y geometría por pantalla.
- Navbar comparte esa presentación y agrega texto adicional, descripción accesible, separación, distribución y enlace de marca. Conserva las páginas anteriores de texto o logo.
- Se exportan BrandIdentity y sus campos/defaults para que los navbar del host utilicen el mismo contrato. Los consumidores deben conservar los catálogos históricos y adoptar el catálogo nuevo junto con el paquete.

## 0.6.0

- Publicación de la composición por elementos y geometría responsive validada en dev.2, sin cambios del esquema Page v1.
- Contenedores libres/adaptables, texto, botones, enlaces e imágenes; movimiento, tamaño, anclajes, herencia por pantalla y controles de navbar.
- Mantiene todas las exportaciones públicas anteriores. Los consumidores deben adoptar el paquete y el catálogo 0.6.0 juntos; el catálogo histórico 0.3.5 se conserva.
- Alcance, límites y migración en la [guía](docs/releases/0.6.0-migration.md).

## 0.6.0-dev.2 — candidato local

- Movimiento libre y tamaño con tiradores, anclajes y geometría independiente por pantalla; ajuste a bordes/centro del contenedor, cancelación y una acción de deshacer por gesto.
- Distribución Libre y colocación desde la paleta en el punto de caída. El redimensionado adaptable conserva el flujo; las posiciones se transportan como props declarativas en Website v2.
- Verificación del destino con el puntero real y tiradores adaptados al tamaño/zoom del elemento. Se conserva el editor claro/oscuro/sistema.
- Sin publicación ni despliegue. Alcance y controles en la [guía de migración](docs/releases/0.6.0-migration.md).

## 0.6.0-dev.1 — candidato local

- Composición por elementos individuales con contenedores anidados flex/grid, texto, botón, enlace e imagen; estilos iniciales y controles de diseño compartidos.
- Navbar con apertura de submenús, alineación, colapso, presentación móvil y transiciones configurables; controles accesibles de apertura y Escape.
- Catálogo dividido en Elementos/Secciones/Todos e inserción por clic en el contenedor seleccionado. Los elementos anteriores siguen disponibles.
- Sin publicación ni adopción automática en consumidores. Ver [alcance y migración](docs/releases/0.6.0-migration.md).

## 0.5.1

- Delimitaciones de bloques por encima de sus fondos, con grosor visual estable al cambiar el zoom y prioridad correcta para selección/edición frente a hover. No ocupan espacio ni interceptan eventos. Ver [verificación](docs/audits/BLOCK_BOUNDARIES_2026-11-14.md).
- Sin cambios de esquema, capacidades, renderer público ni dependencias. Importar JavaScript y CSS de la misma versión. Sigue pendiente la validación en iPhone/Safari y Android físicos.

## 0.5.0

- Apariencias light/dark/system del editor, con tokens y portales aislados del website y de la aplicación anfitriona.
- Controles reutilizables, inspector organizado y estados heredados/modificados/de sólo lectura, conservando capacidades v1 y datos desconocidos.
- Drawers y hoja de propiedades móvil, zoom, tiradores táctiles, reordenación accesible y mejoras de teclado/foco.
- Validación dirigida en Chromium/WebKit y React 18/19. Ver [entrega de Fase 1](docs/releases/ATLAS_PHASE_1_UI_UX.md).
- Limitación conocida: no se ha certificado en dispositivos físicos iOS ni Android; la compatibilidad móvil está validada sólo con emulación automatizada en Chromium y WebKit. El riesgo se aceptó de forma explícita para esta publicación. Véase [migración desde 0.4.0](docs/releases/0.5.0-migration.md).
- Corrección: `ColumnsBlock` respeta `stackOnMobile` (activo por defecto). Por debajo de 640 px del ancho de la página representada (marco del canvas, vista previa o sitio publicado, no la ventana del navegador), las columnas se apilan en una sola; con `false` se conserva la distribución configurada. `SectionBlock` incluye su padding en el ancho (`box-sizing: border-box`), así que una sección a ancho completo ya no desborda la página. Sin cambios de esquema, campos ni valores por defecto. Cambia el HTML: un `div.atlas-cols` envolvente en las columnas y `box-sizing` en el estilo de las secciones.
- Fase 1.2: rediseño visual del editor. Lucide es el único sistema de iconos de la interfaz y Radix Primitives (Dialog, DropdownMenu, Popover, Tooltip) gestiona foco, teclado, cierre y posición de los overlays, siempre dentro del documento y contenedor del editor, también en fullscreen e iframe. Barra superior, navegación móvil, biblioteca, canvas, barra contextual e inspector rediseñados en claro y oscuro. Nuevas dependencias de ejecución: `lucide-react` y cuatro paquetes `@radix-ui/react-*`. Sin cambios de Page, renderer, capacidades ni exports. Ver [Fase 1.2](docs/releases/ATLAS_PHASE_1_UI_UX.md#fase-12--rediseño-visual-con-lucide-y-radix).
- Fase 1.1: jerarquía del inspector (etiqueta, control, estado), sección Efectos alineada, estados táctiles sin hover fijo, controles con chevron común, barra contextual que sigue al canvas cuando cambia la altura disponible, borrador hexadecimal corregido y fullscreen verificado en WebKit. Ver [cierre de Fase 1.1](docs/releases/ATLAS_PHASE_1_UI_UX.md#fase-11--pulido-visual-controles-y-experiencia-táctil).

## 0.4.0 — publicado

- Nueva API pública `editorCapabilitiesVersion = 1` y prop opcional `AtlasWebBuilderEditor.capabilities`. Perfiles versionados restringen efectos, SEO, metadatos, tema, importación y assets según el contrato de guardado del host.
- Los valores de controles de sólo lectura se conservan. Los colores inválidos no reemplazan el último token válido. El perfil no sustituye validación ni autorización del servidor.
- Los campos pueden declarar readOnly. El host puede restringir imágenes a su biblioteca sin habilitar URLs o archivos sin registrar.
- Las páginas nuevas usan visibilidad public; draft ya no se ofrece como visibilidad porque no es válida en el serializador Page 1. No se migran documentos al abrirlos.
- Conservados los 139 exports de 0.3.5 y añadido el marcador de capacidades: 140 exports ESM/CJS. CSS, Page schema 1 y formatos Website v1/v2 permanecen compatibles.
- Metadatos de repositorio y notas de migración incluidas en el paquete.

Esta versión agrupa los cambios locales de Fase 0.5. Los bridges/perfiles de Runly se entregan en sus propios repositorios; no son parte del motor. No incluye rediseño ni Fase 1.

## 0.3.5

Base publicada recuperada: `dc30666923a6b4d19919a0e154bb4eb2cdd65e2f`. Ver [procedencia](docs/releases/0.3.5-provenance.md).
