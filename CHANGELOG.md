# Changelog

## Sin publicar — Fase 1

- Apariencias light/dark/system del editor, con tokens y portales aislados del website y de la aplicación anfitriona.
- Controles reutilizables, inspector organizado y estados heredados/modificados/de sólo lectura, conservando capacidades v1 y datos desconocidos.
- Drawers y hoja de propiedades móvil, zoom, tiradores táctiles, reordenación accesible y mejoras de teclado/foco.
- Validación dirigida en Chromium/WebKit y React 18/19. Ver [entrega de Fase 1](docs/releases/ATLAS_PHASE_1_UI_UX.md).
- Recomendación de próxima versión: 0.5.0, después de revisión visual y autorización. No se ha cambiado la versión del paquete.

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
