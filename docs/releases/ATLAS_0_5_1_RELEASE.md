# Atlas Web Builder 0.5.1 — publicado

Fecha: 14 de noviembre de 2026. Publicación solicitada por el propietario después de corregir las delimitaciones del editor.

`@raulbellosom/atlas-web-builder@0.5.1` está publicado en npm. Se confirmó que **latest y next apuntan a 0.5.1**. No se sobrescribió ninguna versión anterior.

## Procedencia

| Dato | Valor |
|---|---|
| Commit de corrección | `8f33a24` |
| Commit de fuentes del paquete | `b90ed0ce5481ed25be5e01695c4ca824f064ff2b` |
| Tag local | `v0.5.1`, sobre el commit de fuentes; sin push |
| Archivo | `raulbellosom-atlas-web-builder-0.5.1.tgz` |
| SHA-256 local y descargado de npm | `72aa0e0dc8307d1bc6231e68adb0b75ae8624619fbb7b71a9d52e821929ac098` |
| npm shasum | `e37deb2bb82014a4632fe32245dab3ad01d0b810` |
| npm integrity | `sha512-2SZS+cyrJuV+K0b6cAXO4xGKXh2qtoitd0eGWlfq7IWX4rHT7izXipHO4/BnZCTuxy55ZKzRcFD/OG9rokNYkg==` |
| CSS SHA-256 | `fe57ec473e887799e6f72eafdc06860668669b5ba39bcbfc23c8afcaaeaef9fe` |

El tarball verificado contiene 14 archivos: manifiesto, licencia, README, changelog, cinco artefactos dist, contrato de capacidades y cuatro guías históricas/migración. No contiene fixtures, credenciales, arneses ni diagnósticos. El paquete descargado del registro tiene exactamente los mismos bytes que el probado antes de publicar.

## Validación

- Build ESM/CJS, lint y 3 pruebas de versión/smoke: aprobados. Siguen vigentes las 9 pruebas dirigidas del editor/renderer y la prueba del Frame del Hub ejecutadas para la corrección.
- Tarball instalado en consumidores temporales privados con React 18.3.1 y 19.3.0, sin modificar los consumidores definitivos.
- 16 casos de delimitaciones por consumidor: **32 casos aprobados** en Chromium/WebKit, escritorio/móvil, claro/oscuro y zoom ajustado/25 %/100 %/150 %. Incluyen geometría sin desplazamiento y selección táctil anidada.
- Verificación del paquete local y del descargado: archivos instalados idénticos al tarball; ESM/CJS coincidentes; 142 exports, capacidades v1, metadatos de bloques, SSR y serialización compatibles. Comparación adicional con 0.5.0: sus 142 exports y metadatos se conservan.
- No se repitieron suites globales ajenas al patch. No se probaron dispositivos físicos ni se certificó el bloqueo táctil original del iPhone.

Evidencia: [paquete y hashes](evidence/0.5.1/package-verification.json), [React 18](evidence/0.5.1/boundaries-react18.json), [React 19](evidence/0.5.1/boundaries-react19.json).

Se publicó el tarball validado con `npm publish ... --access public --tag next --ignore-scripts`, se descargó y comparó su SHA-256, se verificaron los consumidores y después se promovió con `npm dist-tag add ...@0.5.1 latest`. El procesamiento de npm tardó en exponer inicialmente la versión; no se repitió la publicación.

## Adopción y límites

Seguir [migración a 0.5.1](0.5.1-migration.md). Fijar exactamente 0.5.1 y regenerar el lockfile del consumidor. JavaScript y CSS deben proceder de esta misma versión. No requiere migración de datos ni nuevas dependencias.

No se actualizó el paquete instalado en ERP/Hub, no hubo push Git, release de GitHub, despliegue ni cambios de VPS. Las correcciones del iframe del Hub y del viewport histórico del ERP viven en sus propios commits y no forman parte del paquete Atlas. La aceptación en iPhone/Safari físico permanece pendiente.
