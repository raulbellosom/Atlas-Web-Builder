# Changelog

## 0.5.0 — preparado, sin publicar

- Apariencias light/dark/system del editor, con tokens y portales aislados del website y de la aplicación anfitriona.
- Controles reutilizables, inspector organizado y estados heredados/modificados/de sólo lectura, conservando capacidades v1 y datos desconocidos.
- Drawers y hoja de propiedades móvil, zoom, tiradores táctiles, reordenación accesible y mejoras de teclado/foco.
- Validación dirigida en Chromium/WebKit y React 18/19. Ver [entrega de Fase 1](docs/releases/ATLAS_PHASE_1_UI_UX.md).
- Metadatos preparados para 0.5.0. Publicación pendiente de aceptación móvil física y autorización. Véase [migración desde 0.4.0](docs/releases/0.5.0-migration.md).
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
