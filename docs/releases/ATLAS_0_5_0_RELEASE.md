# Atlas Web Builder 0.5.0 — preparación del release

Fecha: 2026-11-13. **PUBLICADO: `@raulbellosom/atlas-web-builder@0.5.0` es `latest` en npm.** El tag `v0.5.0` apunta a `d928669d8a6950abff6865176a2a983f6cd87ae8`.

## Publicación

| Paso | Resultado |
| --- | --- |
| Identidad npm | `raulbellosom`, único mantenedor del paquete |
| 0.5.0 antes de publicar | Ausente (`No match found for version 0.5.0`); `latest` y `next` apuntaban a 0.4.0 |
| Publicación | `npm publish <tarball> --access public --tag next` del archivo verificado, sin reempaquetar |
| Descarga desde el registro | SHA-256 idéntico al archivo local; `verify-050-package.mjs` aprobado sobre el archivo descargado con consumidores React 18.3.1 y 19.3.0 |
| Promoción | `npm dist-tag add …@0.5.0 latest`, sin republicar; ahora `latest` y `next` apuntan a 0.5.0 |
| Tag Git | `v0.5.0` anotado sobre `d928669`, la fuente exacta del tarball; `v0.4.0` sigue en `62e9688` |
| Seguridad | `pnpm audit --prod`: sin vulnerabilidades conocidas; `npm audit` de ambos consumidores con lockfile generado: 0 |

**Riesgo aceptado por el propietario.** 0.5.0 se publica **sin certificación en iPhone/Safari ni Android/Chrome físicos**. La compatibilidad móvil se validó sólo con emulación automatizada (CDP en Chromium y TouchEvents sintéticos en WebKit). Esas pruebas **no se declaran aprobadas** y siguen recomendadas antes de cualquier despliegue que dependa del uso móvil. El [checklist de aceptación](ATLAS_0_5_0_MOBILE_ACCEPTANCE.md) sigue vigente. El riesgo también figura en el CHANGELOG, el README y la guía de migración publicados.

**Artefactos anteriores.** `a23227ab…`, `09303a7c…` y `05874a77…` nunca se publicaron. El último, el aprobado tras la corrección de columnas, se reemplazó sólo porque el README, el CHANGELOG y la guía de migración empaquetados seguían diciendo «sin publicar». El README es lo que muestra npmjs.com. Antes de empaquetar se comprobó que los cinco archivos de `dist/` y `package.json` eran idénticos byte a byte a los de `05874a77`; sólo cambiaron esos tres documentos. Por eso no se repitieron los recorridos de navegador, que se hicieron con el mismo JS y CSS. Sí se repitió la verificación de paquete en consumidores limpios y sobre el archivo descargado del registro.

## Fuentes y artefacto

| Dato | Valor |
| --- | --- |
| Base de la Fase 1.2 | `797dee25eda293e9acf6ca53bd36c5753c0c9c06` |
| Commit de fuentes del artefacto | `d928669d8a6950abff6865176a2a983f6cd87ae8` (tag `v0.5.0`) |
| Rama | `main`, sin ramas ni worktrees nuevos |
| Versión preparada | `@raulbellosom/atlas-web-builder@0.5.0` |
| Tarball local | `.artifacts/releases/0.5.0/raulbellosom-atlas-web-builder-0.5.0.tgz` |
| SHA-256 | `54908f1cd631c4ca4f70d106a3558405ceb6f35764bec88eba402fb2d35d46ea` |
| npm shasum (SHA-1) | `e463c1f96c298965f3b9ecb58b504f626dafa0f6` |
| npm integrity | `sha512-/30OyRBbC/xi9POLPNa3FCygxqqryeL+82lY9s4luyp+u340iBL+SUhXIAO+3+QVY9m9b6o1jsi6ITwuE0ApOA==` |
| Tamaño | 620027 bytes comprimidos, 2366921 bytes descomprimidos |

El commit documental que contiene este informe sólo agrega informe y evidencia; no altera los archivos del paquete verificado. El tarball permanece local e ignorado por Git. Publicar ese archivo exacto después de autorizar, sin volver a empaquetar silenciosamente. Si se pierde, reproducirlo y comparar hashes antes de considerarlo aprobado.

`package.json` y `src/index.js` declaran 0.5.0; `getVersion()` devuelve 0.5.0. Dependencias de ejecución nuevas: `lucide-react` y `@radix-ui/react-dialog`, `-dropdown-menu`, `-popover` y `-tooltip`. Los mínimos de `dompurify` (`^3.4.17`) y `nanoid` (`^5.1.16`) se elevaron a versiones con parche, y `pnpm audit --prod` no informa vulnerabilidades conocidas. El lockfile se regeneró con esos cambios. Se aprobó `pnpm install --frozen-lockfile --ignore-scripts`. No existe otro lockfile de release que haya que regenerar.

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

Build: ESM 347.52 kB, CJS 244.88 kB, CSS 64.35 kB (gzip 86.17 / 73.02 / 11.62 kB); antes eran 357.62 / 252.65 / 51.68 kB. Lucide y Radix son externos; su coste en una app consumidora es de ≈ 41 kB gzip ([medición](evidence/phase-1.2/bundle-size.json)). Se comprobaron los tokens de apariencia y las safe areas en el CSS emitido. SHA-256 del CSS: `57e60339733e6bbff9ca742597d8168420f8eab028f3a4fe9420ac6e1d9e019e`.

Evidencia: [manifiesto npm pack](evidence/0.5.0/pack.json), [verificación y hashes por archivo](evidence/0.5.0/package-verification.json).

## Consumidores aislados y verificaciones dirigidas

Para el artefacto nuevo se crearon otras dos aplicaciones privadas temporales fuera del repositorio, y se instaló el tarball con npm sin scripts de instalación ni lockfiles definitivos. Una usa React/React DOM 18.3.1 y la otra 19.3.0. Ambas resolvieron `lucide-react@1.72.0`, Radix (dialog 1.3.1, dropdown-menu 2.2.1, popover 1.3.1, tooltip 1.4.1), `dompurify@3.4.17` y `nanoid@5.1.16`. Se comprobó que la resolución de Atlas permanece dentro de cada consumidor y que sus bytes coinciden con el tarball final. No se usó una dependencia `file:` en ERP/Hub.

| Comprobación | Resultado |
| --- | --- |
| Build de biblioteca y lint | Aprobados |
| Build del playground canónico | Aprobado |
| Instalación workspace con lockfile congelado | Aprobada |
| ESM/CJS, versión, capacidades v1 y 140 exports previos | Aprobados en React 18 y 19 |
| Metadatos base, Page antiguo, unknown props y SSR vs 0.4.0 | Aprobados en ambos consumidores |
| Editor empaquetado en Chromium y WebKit, React 18.3.1 | 1440, 1024, 768, 390 y 320 px aprobados (10 de 10) |
| Editor empaquetado en Chromium y WebKit, React 19.3.0 | 1440, 1024, 768, 390 y 320 px aprobados (10 de 10) |
| Menús, diálogo, popover y tooltip de Radix, capacidades restringidas, vista previa, iframe, embed y fullscreen de escritorio | Aprobados en ambos motores y versiones |
| `ColumnsBlock` de 2, 3 y 4 columnas con `stackOnMobile` activado y desactivado: renderer público, canvas (marcos móvil, tableta y escritorio con cualquier ancho de ventana) y vista previa a 320, 390, 768 y 1440 px | Aprobados en ambos motores y versiones, sin overflow horizontal |
| Playground por URL LAN | Edición, guardado, recarga, reapertura y recuperación aprobados en Chromium emulado |
| React Doctor de los cambios de la Fase 1.2 | Sin avisos de código; el aviso de cadena de suministro de `dompurify` se corrigió |

Se reutilizó `scripts/test-editor-ui.mjs` con `ATLAS_TEST_PACKAGE` apuntando al package.json de cada consumidor. El editor y su store provienen del paquete instalado, y el CSS se carga desde ese paquete; no se prueban mediante el alias de fuentes. El andamiaje de la galería de controles reutiliza el proveedor de apariencia de los fixtures del repositorio. Los resultados completos están en [React 18](evidence/0.5.0/react18-browser-results.json) y [React 19](evidence/0.5.0/react19-browser-results.json).

Los recorridos incluyeron apariencias y cambio del sistema, selección, edición, guardado/reapertura con remount, undo/redo, reset, overlays/foco, teclado, scroll y ausencia de overflow horizontal. En 390 px también drag táctil, movimiento reducido, viewport reducido a 420 px y reducción de altura del host sin resize de ventana, cubriendo el arreglo de barra contextual de Fase 1.1. Touch de Chromium usa CDP; WebKit usa TouchEvents sintéticos. Fullscreen es de motores de escritorio, no de Safari/iPhone físico.

Las pruebas de los cinco tamaños de Fase 1.1 ya aprobadas se conservan en [su informe](ATLAS_PHASE_1_UI_UX.md#fase-11--pulido-visual-controles-y-experiencia-táctil). No se repitieron suites unitarias globales ni auditorías; este corte no cambia el motor, aparte de su constante de versión. La comprobación de contratos es dirigida y no sustituye una futura prueba de adopción en ERP/Hub ni una certificación de todos los sitios posibles.

El tarball final se instaló en consumidores limpios después del último commit de fuentes, y los recorridos de navegador se repitieron contra ese mismo artefacto.

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

## Corrección final: columnas en páginas estrechas

**Defecto.** `ColumnsBlock` declaraba `stackOnMobile` (por defecto `true`) y lo mostraba en el inspector, pero no lo aplicaba. Las tarjetas de servicios del playground seguían en tres columnas en un teléfono y su contenido se recortaba (captura anterior `playground-390-light.png`).

**Solución** (`3405eb0`):
- **Contenedor:** el bloque se envuelve en `div.atlas-cols`, declarado como contenedor CSS (`container-type: inline-size`).
- **Apilado:** con `atlas-cols--stack`, una container query apila la rejilla en una columna por debajo de 640 px del ancho de la **página representada**. Así funciona igual en el marco del canvas (por ejemplo, un teléfono simulado en una ventana de escritorio), en la vista previa y en el renderer público, sin depender del viewport global.
- **Sin apilado:** con `stackOnMobile: false` se conserva la distribución configurada en cualquier ancho.
- **Compatibilidad:**
  - Los documentos históricos sin la propiedad heredan el valor declarado (`true`).
  - No cambian esquema, campos, valores por defecto ni metadatos de los bloques.
  - La plantilla de columnas sigue en el estilo inline, así que sin la hoja de estilos el bloque conserva su comportamiento anterior.

**Hallazgo relacionado, corregido.** La nueva comprobación de overflow detectó que un `SectionBlock` a ancho completo desbordaba la página por su padding horizontal (32 px en cualquier ancho) cuando el anfitrión no aplica un reset `border-box`, como ocurre en el renderer público. La sección añade `box-sizing: border-box`.

**HTML esperado.** Cada `ColumnsBlock` añade un `div` envolvente con clases, y cada `SectionBlock`, `box-sizing:border-box` en su estilo. Es un cambio deliberado y está documentado en la [guía de migración](0.5.0-migration.md). La prueba de hidratación sobre el HTML de servidor no produce discrepancias. La comparación byte a byte con 0.4.0 sigue aprobada porque su fixture no usa estos bloques; no se exige identidad para el markup que debía cambiar.

**Pruebas:**
- **Unitarias:** 2, 3 y 4 columnas con `stackOnMobile` activado, desactivado y ausente, distribución asimétrica, hidratación sin errores y ancho de sección. También se ejecutaron las pruebas dirigidas de SSR, bloques base, persistencia, editor, efectos y layouts: 51 de 51.
- **Navegador:**
  - `tests/browser/columnsChecks.mjs`, integrado en el runner, cubre la matriz completa en Chromium y WebKit, desde fuentes y desde ambos consumidores empaquetados. Verifica el número de columnas visibles, que textos, imágenes y botones de las tarjetas apiladas quepan en su columna y que no haya overflow horizontal de la página.
  - `scripts/verify-playground-columns.mjs` verifica la landing en el canvas (dispositivos elegidos desde la interfaz) y en la vista previa a 320, 390, 768 y 1440 px en ambos motores.
- **Guardado, reapertura y React 18/19:** se mantienen en el runner principal y en el verificador LAN.

**Limitación documentada.** Con `stackOnMobile: false` y cuatro columnas en 320 px, cada columna mide unos 60 px y un botón puede sobresalir de su tarjeta. Es la distribución que el autor eligió explícitamente; la página no desborda.

Capturas actualizadas: [playground a 390 px, claro](evidence/phase-1.2/playground-390-light.png), [playground a 320 px](evidence/phase-1.2/playground-320-light.png) y [vista previa a 390 px con las tarjetas apiladas](evidence/phase-1.2/playground-390-preview-columns.png).

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

## Procedimiento de publicación (ejecutado el 2026-11-13)

Primero completar aceptación física, resolver defectos bloqueantes y obtener autorización expresa. Conservar el tarball verificado. No crear todavía v0.5.0; su creación y push requieren la autorización de distribución. Mantener v0.4.0 intacto.

```powershell
$Artifact = (Resolve-Path .artifacts/releases/0.5.0/raulbellosom-atlas-web-builder-0.5.0.tgz).Path
$Expected = '54908f1cd631c4ca4f70d106a3558405ceb6f35764bec88eba402fb2d35d46ea'
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

- **Atlas/GitHub:** `main` con commits normales, sin force. La fuente del paquete es `d928669`, con el tag `v0.5.0`. Los commits documentales posteriores no alteran los archivos distribuidos.
- **Atlas/npm:** `latest = 0.5.0` y `next = 0.5.0`, con integrity `sha512-/30OyRBb…E0ApOA==`. La versión 0.4.0 sigue publicada e intacta: su tarball conserva SHA-256 `988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2` y el tag `v0.4.0` apunta a `62e9688`.
- **ERP:** sin cambios de esta tarea. Pin desktop 0.4.0; HEAD local observado `34ca30fc4390dd40f7d22338c2529571134f4bdb`. Se preservó el archivo ajeno no rastreado `packages/module-compiler/src/__tests__/entity-list-integration.test.js`. El bloqueo de privacidad documentado anteriormente sigue fuera de esta preparación; no se reejecutó ni alteró el gate.
- **Hub:** sin cambios de esta tarea. Pin 0.4.0; HEAD observado `ff6f7a5f74ef76c928e0d22f7e763fb7b8b9a051`, árbol limpio. Se usaron únicamente sus herramientas de navegador en modo lectura.
- **Producción:** intacta; sin servidores, despliegues, publicaciones de sitios o migraciones de datos.

Si se detecta una regresión después de una futura publicación, detener adopciones/despliegues y mantener los pins 0.4.0. Si `latest` ya fue promovido, con autorización de rollback:

```powershell
npm dist-tag add @raulbellosom/atlas-web-builder@0.4.0 latest --registry https://registry.npmjs.org/
```

El paquete 0.5.0 publicado y los tags de versión no se sobrescriben ni eliminan. Los consumidores ya adoptados deben revertir sus commits de pin/lockfile mediante commits nuevos y pasar sus gates antes de volver a integrar. Si se revierte código Atlas, usar `git revert` en historia compartida, sin reset destructivo ni force push. No reescribir documentos para facilitar rollback.

## Pendientes reales

1. Pruebas en iPhone/Safari y Android/Chrome físicos. No son un bloqueo de la publicación, por decisión del propietario, y no se declaran aprobadas. Se recomiendan antes de desplegar flujos móviles críticos.
2. El `GridBlock` del canvas de edición se muestra en una sola columna. Es un problema previo, documentado y no bloqueante.
3. Adopción en los consumidores bajo sus propios controles. El estado del Developer Hub y del ERP se registra en sus informes de adopción.

**ATLAS 0.5.0 PUBLICADO.**
