# Changelog

## 0.4.0 — preparado, sin publicar

- Nueva API pública `editorCapabilitiesVersion = 1` y prop opcional `AtlasWebBuilderEditor.capabilities`. Perfiles versionados restringen efectos, SEO, metadatos, tema, importación y assets según el contrato de guardado del host.
- Los valores de controles de sólo lectura se conservan. Los colores inválidos no reemplazan el último token válido. El perfil no sustituye validación ni autorización del servidor.
- Los campos pueden declarar readOnly. El host puede restringir imágenes a su biblioteca sin habilitar URLs o archivos sin registrar.
- Las páginas nuevas usan visibilidad public; draft ya no se ofrece como visibilidad porque no es válida en el serializador Page 1. No se migran documentos al abrirlos.
- Conservados los 139 exports de 0.3.5 y añadido el marcador de capacidades: 140 exports ESM/CJS. CSS, Page schema 1 y formatos Website v1/v2 permanecen compatibles.
- Metadatos de repositorio y notas de migración incluidas en el paquete.

Esta versión agrupa los cambios locales de Fase 0.5. Los bridges/perfiles de Runly se entregan en sus propios repositorios; no son parte del motor. No incluye rediseño ni Fase 1.

## 0.3.5

Base publicada recuperada: `dc30666923a6b4d19919a0e154bb4eb2cdd65e2f`. Ver [procedencia](docs/releases/0.3.5-provenance.md).
