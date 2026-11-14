# Atlas Web Builder 0.5.0 — preparación del release

Fecha: 2026-11-13. **APTO PARA PRUEBAS FÍSICAS Y AUTORIZACIÓN DE ATLAS 0.5.0**.

No implica autorización de publicación. Las pruebas físicas de Safari/iPhone y Chrome/Android siguen pendientes. No se ejecutaron `npm publish`, cambios de dist-tags, creación del tag v0.5.0 ni despliegues.

## Fuentes y artefacto

| Dato | Valor |
| --- | --- |
| Base sincronizada al iniciar | `9e39605c4e6a85ec7f596dbd12beb861242016d1` |
| Commit de preparación de fuentes | `b71383e2131aa47f42ac0596ac1a0bfee2577bbd` |
| Rama | `main`, sin ramas ni worktrees nuevos |
| Versión preparada | `@raulbellosom/atlas-web-builder@0.5.0` |
| Tarball local | `.artifacts/releases/0.5.0/raulbellosom-atlas-web-builder-0.5.0.tgz` |
| SHA-256 | `a23227ab2fdf270ea51181bfd04b7e73a75b970423cf89e6649c763c01662201` |
| npm shasum (SHA-1) | `a9f54db8494418d2300d302a93c956448c4b51fd` |
| npm integrity | `sha512-JYVbRBqqx2qMP3cvnOyWwiIlK6UdyUkeeCVQfV8gsxolLr4ilA0ZtLLybWgV28U81mHvwX3vK5Z66i9CAMyAvA==` |
| Tamaño | 612620 bytes comprimidos, 2385322 bytes descomprimidos |

El commit documental que contiene este informe sólo agrega informe y evidencia; no altera los archivos del paquete verificado. El tarball permanece local e ignorado por Git. Publicar ese archivo exacto después de autorizar, sin volver a empaquetar silenciosamente. Si se pierde, reproducirlo y comparar hashes antes de considerarlo aprobado.

`package.json` y `src/index.js` declaran 0.5.0; `getVersion()` devuelve 0.5.0. El lockfile pnpm sólo cambia el nombre de la dependencia workspace del playground, sin actualizaciones de versiones. Se aprobó `pnpm install --frozen-lockfile --ignore-scripts`. No existe otro lockfile de release que haya que regenerar.

## Empaquetado y compatibilidad

Se siguió el procedimiento existente: build de biblioteca y `npm pack` sin publicar. Se añadió [migración de 0.4.0 a 0.5.0](0.5.0-migration.md) al paquete y se completó el changelog.

Verificación reproducible: `scripts/verify-050-package.mjs TARBALL CONSUMER18 CONSUMER19`. Extrae el archivo, valida el manifiesto y la lista permitida, compara los bytes con `dist` y con **todos** los archivos instalados en dos consumidores independientes. Después reutiliza la comparación dirigida con 0.4.0. En Windows usa el tar nativo para evitar que GNU tar interprete `D:` como host remoto.

Contenido: 13 archivos, sin node_modules, credenciales, logs, playground, pruebas ni `.artifacts`:

```text
CHANGELOG.md
LICENSE
README.md
package.json
dist/atlas-web-builder.js
dist/atlas-web-builder.js.map
dist/atlas-web-builder.cjs
dist/atlas-web-builder.cjs.map
dist/style.css
docs/contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md
docs/releases/0.3.5-provenance.md
docs/releases/0.4.0-migration.md
docs/releases/0.5.0-migration.md
```

Exports del manifiesto: import ESM, require CJS, `/styles` y `/package.json`. Se comprobaron carga ESM/CJS e igualdad de sus 142 nombres públicos; se conservan los **140 exports de 0.4.0**, capacidades v1, metadatos de bloques base y documentos antiguos del fixture. Las APIs nuevas opcionales siguen siendo `useEditorAppearance` y `editorControls`.

El renderer SSR produjo HTML idéntico byte a byte al de 0.4.0 para el fixture de compatibilidad. La reapertura conservó JSON, SEO, efectos y propiedades históricas desconocidas. Se fija el reloj únicamente en esa comparación porque ambos serializadores estampan `updatedAt`. No hay migración nueva de schema, catálogo o contrato de guardado.

Build: ESM 357.62 kB, CJS 252.65 kB, CSS 51.68 kB (gzip 86.31 / 73.32 / 9.49 kB). Se comprobaron tokens de apariencia y safe areas en el CSS emitido. SHA-256 del CSS: `80b03a3b8064857023dda7ef74758540ef4b5ef9f83353935229415946449da7`.

Evidencia: [manifiesto npm pack](evidence/0.5.0/pack.json), [verificación y hashes por archivo](evidence/0.5.0/package-verification.json).

## Consumidores aislados y verificaciones dirigidas

Se crearon dos aplicaciones privadas temporales fuera del repositorio y se instaló el tarball con npm, sin scripts de instalación y sin lockfiles definitivos. Una usa React/React DOM 18.3.1 y otra 19.3.0, con sus propias dependencias instaladas. Se comprobó que la resolución de Atlas permanece dentro de cada consumidor y que sus bytes coinciden con el tarball final. No se usó una dependencia `file:` en ERP/Hub.

| Comprobación | Resultado |
| --- | --- |
| Build de biblioteca y lint | Aprobados |
| Build del playground canónico | Aprobado |
| Instalación workspace con lockfile congelado | Aprobada |
| ESM/CJS, versión, capacidades v1 y 140 exports previos | Aprobados en React 18 y 19 |
| Metadatos base, Page antiguo, unknown props y SSR vs 0.4.0 | Aprobados en ambos consumidores |
| Editor empaquetado en Chromium y WebKit, React 18.3.1 | 320×700 y 390×844 aprobados |
| Editor empaquetado en Chromium y WebKit, React 19.3.0 | 320×700 y 390×844 aprobados |
| Controles, capacidades restringidas, preview, iframe, embed y fullscreen de escritorio | Aprobados en ambos motores/versiones |
| Playground por URL LAN | Edición, guardado, recarga, reapertura y recuperación aprobados en Chromium emulado |
| React Doctor del playground modificado | 100/100, sin incidencias |

Se reutilizó `scripts/test-editor-ui.mjs` con `ATLAS_TEST_PACKAGE` apuntando al package.json de cada consumidor. El editor y su store provienen del paquete instalado, y el CSS se carga desde ese paquete; no se prueban mediante el alias de fuentes. El andamiaje de la galería de controles reutiliza el proveedor de apariencia de los fixtures del repositorio. Los resultados completos están en [React 18](evidence/0.5.0/react18-browser-results.json) y [React 19](evidence/0.5.0/react19-browser-results.json).

Los recorridos incluyeron apariencias y cambio del sistema, selección, edición, guardado/reapertura con remount, undo/redo, reset, overlays/foco, teclado, scroll y ausencia de overflow horizontal. En 390 px también drag táctil, movimiento reducido, viewport reducido a 420 px y reducción de altura del host sin resize de ventana, cubriendo el arreglo de barra contextual de Fase 1.1. Touch de Chromium usa CDP; WebKit usa TouchEvents sintéticos. Fullscreen es de motores de escritorio, no de Safari/iPhone físico.

Las pruebas de los cinco tamaños de Fase 1.1 ya aprobadas se conservan en [su informe](ATLAS_PHASE_1_UI_UX.md#fase-11--pulido-visual-controles-y-experiencia-táctil). No se repitieron suites unitarias globales ni auditorías; este corte no cambia el motor, aparte de su constante de versión. La comprobación de contratos es dirigida y no sustituye una futura prueba de adopción en ERP/Hub ni una certificación de todos los sitios posibles.

El empaquetado final actualizó documentación respecto de la primera prueba de navegador. Sus JS/CSS permanecen idénticos a los probados; se reinstaló el tarball final y se verificaron todos sus bytes y compatibilidad en ambos consumidores, sin repetir recorridos sin cambio funcional.

### Comandos de reproducción

Desde PowerShell en la raíz; los directorios `$Consumer18` y `$Consumer19` deben ser aplicaciones temporales privadas con package.json propio, fuera de los consumidores definitivos:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm lint
pnpm build
pnpm --dir examples/playground build
New-Item -ItemType Directory -Force .artifacts/releases/0.5.0 | Out-Null
npm pack --ignore-scripts --json --pack-destination .artifacts/releases/0.5.0
$Artifact = (Resolve-Path .artifacts/releases/0.5.0/raulbellosom-atlas-web-builder-0.5.0.tgz).Path
npm install --prefix $Consumer18 --ignore-scripts --package-lock=false --no-audit --fund=false $Artifact react@18.3.1 react-dom@18.3.1
npm install --prefix $Consumer19 --ignore-scripts --package-lock=false --no-audit --fund=false $Artifact react@19.3.0 react-dom@19.3.0
node scripts/verify-050-package.mjs $Artifact $Consumer18 $Consumer19
$env:ATLAS_BROWSER_TOOLS = 'D:/RacoonDevs/runly-developer-hub/package.json'
$env:ATLAS_TEST_PACKAGE = "$Consumer18/package.json"
$env:ATLAS_TEST_WIDTH = '320,390'
$env:ATLAS_TEST_OUTPUT = '.artifacts/releases/0.5.0/browser-react18'
node scripts/test-editor-ui.mjs
$env:ATLAS_TEST_PACKAGE = "$Consumer19/package.json"
$env:ATLAS_TEST_OUTPUT = '.artifacts/releases/0.5.0/browser-react19'
node scripts/test-editor-ui.mjs
```

Playwright se reutilizó de una instalación existente en modo lectura, sin modificar el Hub. En otro equipo, `ATLAS_BROWSER_TOOLS` debe señalar un entorno con Playwright y Chromium/WebKit instalados. El primer bloque es para reproducir y validar una preparación; **no reconstruir** el artefacto ya aprobado al publicarlo.

## Playground en la red local

```powershell
# Computadora, raíz de Atlas:
pnpm playground:lan
```

URL observada: **http://192.168.100.154:5173/**. El comando imprime la dirección vigente, no una URL pública. Abre esa dirección en Safari/iPhone o Chrome/Android en la misma red privada. El teléfono no instala npm. Con varias interfaces se puede configurar `$env:ATLAS_LAN_HOST = 'IP_PRIVADA_ASIGNADA'`; se rechazan direcciones públicas o no asignadas a la computadora.

El servidor se enlaza sólo a esa IP privada, con puerto fijo y sin proxy ERP, secretos o endpoints de publicación. El acceso de archivos se limita al playground, fuentes y dependencias; se deniegan rutas `.env*`, `.git`, `.artifacts` y claves/certificados. La verificación LAN comprobó 403 en rutas sensibles existentes y ausentes, y cero peticiones HTTP externas durante el recorrido. Esto no es un servicio autenticado: usar únicamente una red privada de confianza y datos ficticios. No se modificó el firewall ni se abrió un túnel o puerto del router. Si Windows requiere acceso de red privada, el propietario debe permitirlo para que el teléfono llegue al servidor.

El nombre histórico estaba desalineado: el package.json del playground todavía declaraba `@racoondevs/atlas-web-builder`, aunque el paquete workspace usa el scope canónico. La ruta de fuentes del alias antiguo era correcta y se conserva. Ahora la dependencia es canónica `workspace:*` y ambos nombres de alias resuelven las mismas fuentes. Se mantiene el alias antiguo sin instalar otro paquete para no romper ejemplos. El modo `pnpm --dir examples/playground dev` sigue siendo local por defecto; `playground:lan` es el comando explícito para red privada.

La página conserva sus plantillas y añade encabezado e imagen anidados, opacidad y una propiedad histórica desconocida. Usa SVG local, inspector de controles y UI completa para apariencia, inserción, selección, drag, zoom, undo/redo y preview. Guardar borrador escribe Page mediante el serializador público en localStorage; Reabrir guardado usa el parser público y una sesión nueva. No conserva el historial entre sesiones ni sincroniza dispositivos. Un borrador ausente o corrupto informa el error sin reemplazar el documento abierto ni eliminar el dato almacenado. La prueba automatizada cubre ambos casos. Los cambios del tema del website son estado de sesión del editor, no un documento Theme guardado por esta demo; la aceptación persistente se centra en Page y sus propiedades.

Autocomprobación con el servidor encendido:

```powershell
$env:ATLAS_BROWSER_TOOLS = 'D:/RacoonDevs/runly-developer-hub/package.json'
node scripts/verify-playground.mjs http://192.168.100.154:5173/
```

Después de verificar se detuvo el servidor temporal; está preparado para iniciarlo con el comando anterior. Ctrl+C lo detiene. La conectividad desde otro dispositivo depende del firewall y aislamiento Wi-Fi y **no se ha comprobado con hardware físico**.

Checklist obligatorio: [ATLAS_0_5_0_MOBILE_ACCEPTANCE.md](ATLAS_0_5_0_MOBILE_ACCEPTANCE.md). Cubre ambos teléfonos, orientaciones, teclado real, barras del navegador, scroll, drag, hojas, menús nativos, zoom, guardado y recuperación. Los casos no soportados deben registrarse como tales; no se promete fullscreen de elementos en iPhone ni un pinch propio del canvas.

## Publicación futura — sólo tras autorización

Primero completar aceptación física, resolver defectos bloqueantes y obtener autorización expresa. Conservar el tarball verificado. No crear todavía v0.5.0; su creación y push requieren la autorización de distribución. Mantener v0.4.0 intacto.

```powershell
$Artifact = (Resolve-Path .artifacts/releases/0.5.0/raulbellosom-atlas-web-builder-0.5.0.tgz).Path
$Expected = 'a23227ab2fdf270ea51181bfd04b7e73a75b970423cf89e6649c763c01662201'
if ((Get-FileHash $Artifact -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Expected) { throw 'Artefacto distinto: detener' }
npm whoami --registry https://registry.npmjs.org/
npm access list packages raulbellosom --json --registry https://registry.npmjs.org/
npm view @raulbellosom/atlas-web-builder versions --json --registry https://registry.npmjs.org/
```

Confirmar identidad y permisos de escritura, y que 0.5.0 siga ausente. Un fallo de autenticación o red no prueba ausencia. Si ya existe, detenerse y verificarlo; no publicar otra versión automáticamente ni intentar sobrescribirla. Si se requiere OTP/aprobación externa, el propietario debe completarla; no compartir credenciales en informes o chat.

Sólo después de esas comprobaciones y autorización:

```powershell
npm publish $Artifact --access public --tag next --registry https://registry.npmjs.org/
if ($LASTEXITCODE -ne 0) { throw 'Publicación no confirmada: detener y consultar registro' }
New-Item -ItemType Directory -Force .artifacts/releases/0.5.0/registry | Out-Null
npm pack @raulbellosom/atlas-web-builder@0.5.0 --ignore-scripts --pack-destination .artifacts/releases/0.5.0/registry --registry https://registry.npmjs.org/
if ($LASTEXITCODE -ne 0) { throw 'Descarga no confirmada: detener' }
$Downloaded = '.artifacts/releases/0.5.0/registry/raulbellosom-atlas-web-builder-0.5.0.tgz'
if ((Get-FileHash $Downloaded -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Expected) { throw 'Integridad del registro distinta: detener' }
npm view @raulbellosom/atlas-web-builder@0.5.0 dist --json --registry https://registry.npmjs.org/
```

Instalar el archivo **descargado del registro** en consumidores aislados y repetir `verify-050-package.mjs` con ese archivo y esos consumidores. Confirmar exports/API/CSS y recorrer la prueba dirigida contra el paquete publicado. Sólo con esa comprobación y autorización para hacerlo estable:

```powershell
npm dist-tag add @raulbellosom/atlas-web-builder@0.5.0 latest --registry https://registry.npmjs.org/
npm view @raulbellosom/atlas-web-builder dist-tags --json --registry https://registry.npmjs.org/
npm view @raulbellosom/atlas-web-builder version --registry https://registry.npmjs.org/
```

La adopción exacta 0.5.0 y lockfiles de ERP/Hub constituye otro corte autorizado, con pruebas del paquete publicado y sus gates vigentes. Este informe no habilita despliegue ni elimina protecciones del Hub o el gate de privacidad del ERP.

## Rollback y estados independientes

- **Atlas/GitHub:** preparación y documentación en `main`, push normal de los cortes validados, sin force. Este commit documental registra la entrega; el SHA de fuentes/paquete es `b71383e…`. La respuesta de cierre confirma el SHA remoto final después del push.
- **Atlas/npm:** consulta del registro: `latest = 0.4.0`, `next = 0.4.0`, 0.5.0 ausente. No hubo operaciones de distribución. El paquete/tag estable 0.4.0 permanece intacto; su tarball conserva SHA-256 `988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2` y el tag apunta a `62e9688eba083cb8c4f82f00ee8075cca41681f1`.
- **ERP:** sin cambios de esta tarea. Pin desktop 0.4.0; HEAD local observado `34ca30fc4390dd40f7d22338c2529571134f4bdb`. Se preservó el archivo ajeno no rastreado `packages/module-compiler/src/__tests__/entity-list-integration.test.js`. El bloqueo de privacidad documentado anteriormente sigue fuera de esta preparación; no se reejecutó ni alteró el gate.
- **Hub:** sin cambios de esta tarea. Pin 0.4.0; HEAD observado `ff6f7a5f74ef76c928e0d22f7e763fb7b8b9a051`, árbol limpio. Se usaron únicamente sus herramientas de navegador en modo lectura.
- **Producción:** intacta; sin servidores, despliegues, publicaciones de sitios o migraciones de datos.

Si se detecta una regresión después de una futura publicación, detener adopciones/despliegues y mantener los pins 0.4.0. Si `latest` ya fue promovido, con autorización de rollback:

```powershell
npm dist-tag add @raulbellosom/atlas-web-builder@0.4.0 latest --registry https://registry.npmjs.org/
```

El paquete 0.5.0 publicado y los tags de versión no se sobrescriben ni eliminan. Los consumidores ya adoptados deben revertir sus commits de pin/lockfile mediante commits nuevos y pasar sus gates antes de volver a integrar. Si se revierte código Atlas, usar `git revert` en historia compartida, sin reset destructivo ni force push. No reescribir documentos para facilitar rollback.

## Pendientes reales

1. Pruebas físicas de iPhone/Safari y Android/Chrome, incluido teclado virtual real y conectividad desde el teléfono. Los recorridos emulados no las completan.
2. Revisión de esos resultados y autorización independiente para publicar npm y crear el tag definitivo.
3. Verificación posterior del paquete del registro y futura adopción de consumidores bajo sus controles, antes de considerar despliegues.

No hay un bloqueo técnico encontrado que impida comenzar las pruebas físicas. No se iniciaron Fase 2 ni cambios visuales nuevos basados en las imágenes de referencia.

**APTO PARA PRUEBAS FÍSICAS Y AUTORIZACIÓN DE ATLAS 0.5.0**.
