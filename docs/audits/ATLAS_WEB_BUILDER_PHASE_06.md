# Atlas Web Builder — Fase 0.6

Preparación del release y adopción en Runly. Corte: 13 de noviembre de 2026, America/Mexico_City. Continúa las Fases [0](ATLAS_WEB_BUILDER_PHASE_0.md) y [0.5](ATLAS_WEB_BUILDER_PHASE_05.md), sin repetir sus auditorías ni reconstruir el motor.

## Estado

**APTO PARA AUTORIZAR RELEASE de Atlas 0.4.0.** El tarball local funciona con los consumidores en el alcance dirigido descrito aquí. No está publicado, no se integraron los pins en los manifests/locks definitivos y no se autoriza despliegue por este resultado.

Quedan pendientes autorización de push/consolidación en GitHub, publicación npm y adopción de las dependencias publicadas. Después se deben verificar los bytes descargados del registro y repetir las pruebas contra ellos antes de autorizar integración/despliegue. Además, el chequeo global de privacidad del ERP tiene 72 hallazgos ajenos a esta tarea: bloquea su certificación global y debe revisarse antes de integrar/desplegar el ERP. Los tres archivos propios de preparación ERP sí pasan esa misma política con cero hallazgos. No se presenta el chequeo global como aprobado ni se relaja la política.

## 1. Versión, API y compatibilidad

Se prepara **0.4.0**, una minor de la serie 0.x: incorpora la API opcional de capacidades y una corrección observable de visibilidad, sin republicar los bytes de 0.3.5 bajo el mismo número.

- Se preservan los 16 commits recuperados hasta `dc30666923a6b4d19919a0e154bb4eb2cdd65e2f`, ancestro de la rama de release, y los 139 exports de 0.3.5.
- Hay 140 exports ESM/CJS. La API añadida es `editorCapabilitiesVersion = 1` y la prop opcional `AtlasWebBuilderEditor.capabilities`. version/getVersion() reflejan 0.4.0.
- Sin perfil se conserva el editor genérico; con perfil se mantienen las defensas de Fase 0.5. No se incorporó @runly/ui ni otra dependencia runtime.
- Las páginas nuevas usan public y no se ofrece draft como visibilidad del documento; no se transforman documentos existentes al abrirlos.
- Page schema 1, Website Template v1/v2, IDs y digest del catálogo no cambian. La versión del renderer 0.4.0 **no implica** cambiar builder.min de las plantillas a 0.4.0: el contrato validado sigue identificado por el catálogo 0.3.5.
- El CSS del paquete es idéntico byte a byte al de 0.3.5.

Se actualizaron package.json y src/index.js, metadatos repository/homepage/bugs/publishConfig, changelog y notas de migración. Las notas y el contrato de capacidades se incluyen en el paquete. La versión 0.4.0 no aparecía publicada en la consulta de preparación (npm devolvió E404); debe volver a comprobarse antes de publicar.

Documentación: [CHANGELOG](../../CHANGELOG.md), [migración 0.4.0](../releases/0.4.0-migration.md), [contrato API 1](../contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md).

## 2. Fuentes y artefacto local

| Identidad | Evidencia |
|---|---|
| Commit de preparación del paquete | `fa44fcc4f6ce0d97d863797141a19afba186f1c8` |
| SHA de fuentes verificado en la ejecución final | `07f0964bafeacabef88f2d85dcc9cca1f4738ce3` |
| Tarball | `.artifacts/releases/0.4.0/raulbellosom-atlas-web-builder-0.4.0.tgz` |
| Tamaño | 546,976 bytes |
| Archivos | 12 |
| SHA-256 | `988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2` |
| SHA-1 npm | `eb2e96dad9d3a823ab1c3cb04e847000e65c456a` |
| Integridad npm | `sha512-aSJP/7vcFnsCFqG+GbVyrNN+kF67e7TguqYTymqstjznhQKZY8VqvS3lsgN9glGfB03olA9zXBosKvGU02dTMw==` |
| CSS SHA-256 | `08a7193400cf63eba77c3bffbeb44e339d74ce0cd999d876da2357d875b55108` |

El verificador comparó las **112 fuentes** de sourcesContent del tarball contra ese SHA de Git, normalizando finales de línea. También comparó package.json y los seis archivos de documentación/licencia incluidos contra el mismo commit. No se atribuye el artefacto a un commit por la mera coincidencia del número de versión. El informe documental posterior no forma parte del paquete ni modifica sus fuentes.

Inventario del tarball:

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
```

Se verificaron los hashes SHA-1/SHA-512 de npm pack y SHA-256 de los bytes finales. El paquete no contiene node_modules, .env, pruebas ni artefactos privados. ESM, CJS, styles y package.json resuelven por sus exports. El tarball y la evidencia JSON están ignorados por Git; no se añadieron binarios al historial.

## 3. Adopción aislada del tarball

Comando reproducible, desde Atlas, con los checkouts hermanos de ERP y Hub preparados:

```powershell
pnpm build
npm pack --ignore-scripts --pack-destination .artifacts/releases/0.4.0 --json
node scripts/verify-packed-release.mjs .artifacts/releases/0.4.0/raulbellosom-atlas-web-builder-0.4.0.tgz
```

No se usaron aliases a src para el candidato. Se extrajo **el tarball real** en tres node_modules temporales, fuera de los proyectos originales, y se enlazaron las dependencias que ya fijan los consumidores. No hubo una resolución nueva de dependencias del registro para 0.4.0 ni se alteraron los node_modules/locks originales. La validación de resolución del registro queda para después de publicar.

| Entorno | React / ReactDOM | Pruebas con paquete extraído |
|---|---|---|
| Atlas/React 18 | 18.3.1 / 18.3.1 | CJS/ESM, 140 exports, igualdad de peers, CSS, serialización, SEO, efectos, SSR y Frame Chromium |
| Hub | 19.3.0 / 19.3.0 | Lo anterior y los siete casos de capacidades/integración, incluyendo writer/reader y catálogo |
| ERP | 19.3.1 / 19.3.1 | Lo anterior, Frame Chromium, runtime público cliente/SSR real, efectos backend e hidratación pública |

Los imports del Frame y de los bloques se resuelven al dist/CSS extraído. Se comprobó una sola identidad de React por entorno. Las pruebas no reemplazan una certificación para toda versión futura que satisfaga el peer >=18; Node usado: 22.23.3. No se certificó Node 20 en esta fase.

### Resultados por capacidad

| Escenario | Resultado |
|---|---|
| Editor con API compatible | Frame monta y permite editar; ya no aparece el bloqueo de versión |
| Motor 0.3.5 | Continúa mostrando bloqueo explícito de edición; no se retira el guard |
| Baseline después de adoptar 0.4.0 | Probado con el helper instalado en un entorno que contiene 0.4.0: recupera 0.3.5 aparte y verifica su SHA-512, sin degradar el proyecto |
| Plantilla existente | Se carga valid.zip del corpus existente; writer/reader reales, sin inventar un formato nuevo |
| Guardar/reabrir | Texto con ñ y color se comparan exactamente después de ZIP y recarga del iframe |
| Temas | Colores soportados editables; font/radius originales conservados; sin añadir colores default al guardar sin cambios |
| Efectos y SEO Website v2 | Controles incompatibles protegidos y rechazos existentes intactos; documento original no se muta |
| Atlas/ERP efectos y SEO | roundtrip conserva props y seo; renderer aplica opacidad/hover; renderSeoHead conserva título/canonical; backend real valida valores admitidos y rechaza valores hostiles/fuera de rango |
| Propiedades históricas | customHistorical, efectos y seo sobreviven la serialización Atlas/normalización ERP; exportación v2 incompatible falla sin podar datos |
| Catálogo | 148 tipos únicos y fields coincidentes; defaults de los 144 tipos portables validados por el escritor real |
| Renderer público ERP | Se compila el entry real y su SSR en copia aislada del ERP con el paquete extraído |
| Hidratación | Chromium carga el SSR y el runtime cliente real; el menú móvil cambia aria-expanded al interactuar, sin errores de página/consola |
| Guard de runtime ERP | Acepta exactamente 0.3.5 y 0.4.0; prueba negativa de 0.4.99 rechazada |

El digest canónico de los dos catálogos sigue siendo:

```text
0e6f77787d7351448f05dc87af8b1f2bb701170a1077eacc76633d548216d248
```

Runtime ERP generado en aislamiento (sin desplegar):

```text
rendererVersion: 0.4.0
entry.js:  a062570ae8afd649bdab103eb8199e57ab0a3ba2db355eba657d1615edf16d12
style.css: 0b03ec3960b35e412ed70607f940a39fb28a1653f4d014f9f22c61f143da9e43
ssr.mjs:   a3caef8ee6bb53cf98f208ed9f97f319568f6754fb3297b04d4d2d654e4d4532
```

La prueba de API 0.3.5 ya no depende de que ésa siga siendo la versión instalada: el helper permite conservar una fixture explícita o recuperar los bytes públicos inmutables con su integridad conocida. Así las pruebas contra el paquete publicado nuevo también mantienen la defensa legacy.

## 4. Dependencias y cambios preparados por repositorio

| Consumidor directo | Pin actual | Preparación para adoptar |
|---|---|---|
| ERP apps/api | 0.3.5 | Parche pendiente a 0.4.0; afecta helpers de SEO/efectos y servicios/templates |
| ERP apps/desktop | 0.3.5 | Parche pendiente a 0.4.0; editores de página/blog/sitio, wizard, previews y render público |
| ERP packages/website-blocks | 0.3.5 | Parche pendiente a 0.4.0 para las definiciones confiables compartidas |
| Hub raíz | 0.3.5 | Parche pendiente a 0.4.0 directo + override exacto pnpm |
| Hub paquete compartido website-blocks | Transitivo Atlas 0.3.5 | Resolución única del candidato ensayada en aislamiento; override pnpm preparado, pendiente de resolver contra el registro |

El playground de desarrollo de Atlas conserva su alias histórico @racoondevs/workspace a la fuente local. Se identificó como consumidor de desarrollo, no como instalación npm de producción; no se cambia su lock ni se usa ese alias para la prueba del tarball.

Los dos parches `docs/releases/atlas-0.4.0-dependencies.patch` están preparados y pasan git apply --check, pero **no están aplicados**. No hay cambios de esta tarea en package.json/lock definitivos de ERP/Hub ni en shared-packages.lock.json.

El override del Hub evita dos copias del motor al mantener el paquete compartido que declara Atlas 0.3.5. No se relaja validación de contenido ni se altera su artefacto firmado/hash. Después de publicar debe verificarse con pnpm why que la resolución efectiva es única. Una republicación de website-blocks es alternativa futura, no una operación necesaria que se haya ejecutado aquí.

### Commits locales

| Repositorio | Rama | Commits de preparación |
|---|---|---|
| Atlas | release/atlas-0.4.0-phase-06 | `fa44fcc4f6ce0d97d863797141a19afba186f1c8`, `07f0964bafeacabef88f2d85dcc9cca1f4738ce3`; informe en commit documental posterior |
| ERP | release/adopt-atlas-0.4.0-phase-06 | `cf13d8aa80827317d152db96e33618fbcd00aa8a` |
| Hub | release/adopt-atlas-0.4.0-phase-06 | `cff14ad` conserva 033d137 por cherry-pick; `e53a60f9b99abc635a1789e60842357e5c297d13` y `99d644e0755922a6aa5b5074516864b6a6ed8a3f` preparan pruebas/pins/baseline |

Bases conservadas: Atlas 4000493, ERP 645769f37 y Hub 6d29627. Los nuevos commits de main ajenos a Fase 0.5 se conservaron al crear las ramas. Se excluyó un test concurrente ajeno no versionado del compilador ERP; no se añadió, borró ni modificó.

Archivos propios:

- Atlas: .gitignore, package.json, src/index.js, README.md, CHANGELOG.md, docs/contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md, docs/releases/0.4.0-migration.md, scripts/verify-packed-release.mjs y este informe.
- ERP: scripts/build-website-public-runtime.mjs y los dos archivos docs/releases/ATLAS_0_4_0_ADOPTION.md / atlas-0.4.0-dependencies.patch.
- Hub: se conservan los siete archivos de 033d137; esta fase añade/modifica tests/website-capabilities.test.js, tests/website-capabilities-browser.test.js, tests/support/atlas-legacy-fixture.js y los dos archivos docs/releases de adopción.

## 5. Verificaciones y límites

- Atlas: nueve casos dirigidos de version.test.js, capabilities.test.jsx y ssr.test.jsx aprobados. No se repitió la auditoría ni toda la suite anterior de 51 casos.
- Artefacto: CJS/ESM/exports/peers/CSS/metadata y 112 fuentes verificadas contra Git; hashes del tarball comprobados.
- Hub con tarball: siete casos aprobados; Frame repetido en las otras dos versiones React por tratarse de compatibilidad de peers afectada por la adopción.
- ERP: efectos backend, build cliente/SSR, guard de versión e hidratación Chromium aprobados en aislamiento.
- Lint dirigido y git diff --check aprobados. Verificador del inventario compartido del Hub aprobado con su distribución GitHub Packages y digest actuales. Los parches pendientes pasan comprobación sin aplicarse.
- Política de privacidad ERP: global falló con 72 hallazgos fuera de los archivos propios; revisión dirigida de nuestros tres archivos, usando inspectFile de la misma política, pasó con cero. No se imprimieron valores privados ni se los copió al informe.

No se ejecutaron suites globales, integración autenticada contra DB, importación/publicación de sitios, pruebas de carga, Firefox/WebKit ni despliegue. Tampoco se prueba aún la resolución de 0.4.0 desde npm porque no está publicado. Las fixtures guardan ZIPs en memoria; no se presentan como transacciones de producción. Los resultados completos quedan en `.artifacts/releases/0.4.0/adoption.json` y pack.json.

## 6. Secuencia de distribución — comandos NO ejecutados

Ejecutar sólo con autorización expresa y después de revisar las ramas/commits. Mantener separadas la publicación del paquete, la adopción y la autorización de despliegue.

### 6.1 Consolidar Atlas en GitHub conservando historia

Desde Atlas, después de autorizar push:

```powershell
git fetch origin main
git merge-base --is-ancestor origin/main release/atlas-0.4.0-phase-06
if ($LASTEXITCODE -ne 0) { throw 'Revisar divergencia remota; no forzar push' }
git push --set-upstream origin release/atlas-0.4.0-phase-06
gh pr create --base main --head release/atlas-0.4.0-phase-06 --title "Release Atlas 0.4.0: source consolidation and persistence capabilities" --body-file docs/releases/0.4.0-migration.md
```

Revisar el PR y los checks. Para conservar los commits recuperados, usar merge commit, sin squash/rebase de esa historia. Con aprobación de integración:

```powershell
$PullRequest = gh pr view release/atlas-0.4.0-phase-06 --json number --jq .number
gh pr merge $PullRequest --merge
git fetch origin main
git merge-base --is-ancestor 07f0964bafeacabef88f2d85dcc9cca1f4738ce3 origin/main
if ($LASTEXITCODE -ne 0) { throw 'La fuente verificada todavía no está consolidada' }
```

No crear tags remotos para suplir esa comprobación.

### 6.2 Publicar exactamente el tarball probado

Desde Atlas, sólo después de autorizar publicación:

```powershell
$Artifact = (Resolve-Path '.artifacts/releases/0.4.0/raulbellosom-atlas-web-builder-0.4.0.tgz').Path
$ExpectedSha256 = '988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2'
if ((Get-FileHash -LiteralPath $Artifact -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedSha256) { throw 'Artefacto distinto del probado' }
npm whoami --registry https://registry.npmjs.org/
npm view @raulbellosom/atlas-web-builder@0.4.0 version --registry https://registry.npmjs.org/
# Sólo si la versión continúa sin publicar. Si ya existe, inspeccionar su integridad; nunca intentar reemplazarla.
npm publish $Artifact --access public --tag next --registry https://registry.npmjs.org/
```

El tag npm next permite verificar y adoptar el pin explícito sin promover latest antes de la verificación. No es un tag Git. Publicar es una acción nueva que esta fase no ejecuta.

### 6.3 Verificar bytes del registro antes de tocar consumidores

```powershell
$Registry = npm view @raulbellosom/atlas-web-builder@0.4.0 dist --json --registry https://registry.npmjs.org/ | ConvertFrom-Json
$ExpectedIntegrity = 'sha512-aSJP/7vcFnsCFqG+GbVyrNN+kF67e7TguqYTymqstjznhQKZY8VqvS3lsgN9glGfB03olA9zXBosKvGU02dTMw=='
if ($Registry.integrity -ne $ExpectedIntegrity) { throw 'Integridad del registro distinta' }
New-Item -ItemType Directory -Force -Path '.artifacts/releases/0.4.0/registry' | Out-Null
npm pack @raulbellosom/atlas-web-builder@0.4.0 --ignore-scripts --pack-destination .artifacts/releases/0.4.0/registry --registry https://registry.npmjs.org/
$Downloaded = '.artifacts/releases/0.4.0/registry/raulbellosom-atlas-web-builder-0.4.0.tgz'
if ((Get-FileHash -LiteralPath $Downloaded -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedSha256) { throw 'Bytes descargados distintos' }
node scripts/verify-packed-release.mjs $Downloaded
if ($LASTEXITCODE -ne 0) { throw 'Detener distribución' }
```

El verificador exige versión/API esperadas, compara archivos con Git y prueba los consumidores contra el paquete extraído. Si se trabaja desde otro checkout, situarse en el SHA verificado o en uno cuyos inputs empaquetados sean idénticos; no atribuir diferencias a timestamps sin comprobarlas.

### 6.4 Adoptar pins publicados en ERP y Hub

Con autorización de adopción, desde la rama preparada de **cada** consumidor:

```powershell
git apply --check docs/releases/atlas-0.4.0-dependencies.patch
git apply docs/releases/atlas-0.4.0-dependencies.patch
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile
pnpm why -r @raulbellosom/atlas-web-builder
```

Usar pnpm según packageManager del consumidor. Revisar el diff: sólo los pins/override y las resoluciones necesarias de Atlas/peers. Detenerse si aparecen actualizaciones no relacionadas o referencias file: a un tarball temporal. No aplicar el mismo parche una segunda vez si ya se adoptó.

En Hub:

```powershell
node --input-type=module -e "import {verifyWebsiteSource} from './scripts/verify-website-source.mjs'; console.log(verifyWebsiteSource(undefined,{production:true}));"
```

Desde Atlas repetir `node scripts/verify-packed-release.mjs $Downloaded` con los pins ya instalados. El helper legacy recupera 0.3.5 aparte cuando el instalado ya es 0.4.0; no eliminar ese caso ni el guard para hacer pasar la prueba.

En ERP, para generar el par cliente/SSR sin desplegar:

```powershell
node scripts/build-website-public-runtime.mjs .artifacts/atlas-0.4.0-runtime
```

Registrar nuevos commits de manifests/locks por consumidor, completar sus gates pendientes y revisar el diff antes de autorizar integración. No se ha aplicado ninguno de esos cambios definitivos ahora.

### 6.5 Promoción y despliegue separados

Sólo después de pasar la verificación publicada y con autorización de promoción:

```powershell
npm dist-tag add @raulbellosom/atlas-web-builder@0.4.0 latest --registry https://registry.npmjs.org/
```

La integración/despliegue del Hub/ERP requiere autorización posterior, sus checks y resolución del gate global ERP pendiente. No se incluyen comandos automáticos de deploy en esta entrega.

## 7. Rollback y riesgos pendientes

Detener distribución si cambia un hash, falta la API, se resuelven dos versiones del motor, cambia el digest de catálogo, falla el roundtrip o hay error de SSR/hidratación. No promover latest ni desplegar ante esos resultados.

- Guardar el SHA/lock y los hashes cliente/SSR vigentes antes de adoptar. Restaurar código, manifest, lock y el par runtime/SSR como una unidad desde el último commit verificado; instalar con frozen-lockfile. No mezclar un cliente nuevo con SSR anterior.
- Conservar las releases selladas y URLs inmutables de assets del ERP. Un cambio de release pública es otra operación autorizada; no sobrescribir hashes de runtime ni reescribir documentos para facilitar rollback.
- Si se vuelve a Atlas 0.3.5 con el código protegido del Hub, la edición queda inhabilitada explícitamente y los documentos se conservan. Ese fallback es seguro; no retirar las defensas para recuperar edición.
- No despublicar/reemplazar el tarball npm 0.4.0 para corregirlo. Preparar otra versión y autorización si se encuentra un defecto. Los pins de consumidores y next/latest son controles separados.
- Mantener las restricciones de Website v2: efectos/SEO/temas no representables continúan bloqueados. No hay migraciones de datos en este release.

Riesgos aún no certificados: resolución real del paquete nuevo en npm, CI global de consumidores, persistencia autenticada en DB, publicación/importación de sitios y entornos de producción. Son gates de las etapas posteriores, no verificaciones que se hayan simulado como aprobadas.

**La preparación local está completa para solicitar autorización de release. No hubo push, publicación, tag remoto, despliegue ni comienzo de Fase 1.**
