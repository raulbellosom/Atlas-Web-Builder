# Atlas Web Builder 0.4.0 — resultado de distribución autorizada

Fecha: 2026-11-13, America/Mexico_City. Continúa las evidencias aprobadas de [Fase 0.6](ATLAS_WEB_BUILDER_PHASE_06.md); no repite la auditoría ni inicia Fase 1.

**NO APTO PARA INICIAR FASE 1.** Atlas y Hub están publicados en GitHub y npm 0.4.0 está verificado. La adopción ERP está validada y confirmada localmente, pero su integración/push permanece detenida por el gate obligatorio de privacidad: 72 hallazgos preexistentes, cero hallazgos nuevos en los archivos de esta tarea.

## 1. Estado final de repositorios

| Repositorio | Commit de release/adopción | main remoto comprobado | Resultado |
| --- | --- | --- | --- |
| Atlas | `62e9688eba083cb8c4f82f00ee8075cca41681f1` | mismo SHA | Push normal completado; tag remoto `v0.4.0` en ese commit exacto |
| Developer Hub | `6db2e8a03365b5975d778f63aec9321e02f65868` | mismo SHA | Adopción integrada mediante push fast-forward normal |
| ERP | `34ca30fc4390dd40f7d22338c2529571134f4bdb` | `d816415422232b5dd3223ac2934b11ff0a0cba3d` | Commit local preparado; ningún push ni integración ERP |

Atlas conserva la historia de fuentes recuperadas y los commits aprobados de Fases 0.5/0.6. Antes del push se verificaron el árbol limpio de release, la ascendencia y el remoto, sin force push, squash de la recuperación ni rebase destructivo. El único cambio Atlas posterior al release es este informe documental, conservado localmente en una rama separada; no cambia el SHA de fuentes publicado ni el tag.

Hub se distribuyó desde `distribution/adopt-atlas-0.4.0`, partiendo de main remoto `754c7d7e122e16386dfcf139def577ee2e48d2f0`. Se incorporaron únicamente los commits Atlas preparados:

| Commit original local | Commit incorporado sobre main remoto |
| --- | --- |
| `cff14ad85b025a779bbf80fce74b481099cc2890` | `48e8402a1c5add8cbda259a56d74e39c36ab019e` |
| `e53a60f9b99abc635a1789e60842357e5c297d13` | `bb9556f8e7d74484d19b1bf12c3b6025cfa8857e` |
| `99d644e0755922a6aa5b5074516864b6a6ed8a3f` | `46805903bd05ef9a018d6a0635caec1ae103f0cb` |

El commit final `6db2e8a` añade el pin, override, lock y evidencia de adopción. Las fuentes de capacidades, Frame, portable, tema, host y pruebas son idénticas a las aprobadas. Se ajustó solamente el contexto del parche de dependencias para aplicarlo sobre esa base. Se comprobó que los commits locales ajenos `450d70f` y `6d29627` no pertenecen a la historia publicada. El main local del usuario se conservó en `6d2962714dd31cf5b3a83c4c63be96721c84d4ef`; no se movió ni sobrescribió para acomodar la integración.

ERP conserva `release/adopt-atlas-0.4.0-phase-06`, el commit preparado `cf13d8aa80827317d152db96e33618fbcd00aa8a` y la adopción `34ca30fc4`. No se publicaron sus commits ni los cambios locales anteriores ajenos de module-compiler. El archivo no rastreado `packages/module-compiler/src/__tests__/entity-list-integration.test.js` se preservó sin tocar.

## 2. npm: publicación e integridad verificadas

- Paquete público: `@raulbellosom/atlas-web-builder@0.4.0`.
- Identidad comprobada: `raulbellosom`, permiso del paquete `read-write`.
- Versión ausente antes de publicar. El primer intento autenticado anterior exigió 2FA (E403); después de que el usuario configurara su token renovado, se publicó exactamente el tarball aprobado, con tag npm `next`.
- Comando ejecutado desde Atlas:

```powershell
npm publish .artifacts/releases/0.4.0/raulbellosom-atlas-web-builder-0.4.0.tgz --access public --tag next --registry https://registry.npmjs.org/
```

npm aceptó el envío con HTTP 202 y código de salida 0. Mientras se procesaba, el registro devolvió temporalmente E404 y hubo desfase entre el endpoint de versión y el índice del paquete. No se repitió la publicación desde el agente.

El usuario ejecutó aparte npm publish desde el checkout, generando otro tarball (SHA-1 `aa8ef5d016fc927a7b0048fa7eaebe3d46b0a89e`), y npm lo rechazó con E409 por existir la versión en staging. Ese envío no sustituyó el artefacto aprobado ni movió latest. La posterior comprobación confirmó el tarball original.

| Dato | Resultado publicado y descargado |
| --- | --- |
| Git de fuentes verificado | `62e9688eba083cb8c4f82f00ee8075cca41681f1` |
| SHA-256 | `988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2` |
| SHA-1 / dist.shasum | `eb2e96dad9d3a823ab1c3cb04e847000e65c456a` |
| dist.integrity | `sha512-aSJP/7vcFnsCFqG+GbVyrNN+kF67e7TguqYTymqstjznhQKZY8VqvS3lsgN9glGfB03olA9zXBosKvGU02dTMw==` |
| Archivos | 12 |
| Tamaño comprimido | 546.976 bytes |
| CSS SHA-256 | `08a7193400cf63eba77c3bffbeb44e339d74ce0cd999d876da2357d875b55108` |
| Tags npm comprobados al cierre | next = 0.4.0; latest = 0.3.5 |

Se descargó la URL dist.tarball oficial mediante npm pack debido al desfase temporal del índice:

```powershell
npm pack https://registry.npmjs.org/@raulbellosom/atlas-web-builder/-/atlas-web-builder-0.4.0.tgz --ignore-scripts --pack-destination .artifacts/releases/0.4.0/registry --registry https://registry.npmjs.org/
node scripts/verify-packed-release.mjs .artifacts/releases/0.4.0/registry/raulbellosom-atlas-web-builder-0.4.0.tgz
```

La descarga es idéntica byte a byte al tarball aprobado. No se generó otra versión ni se sustituyó el artefacto. El paquete preconstruido no incorpora gitHead en los metadatos del registro; la procedencia se demostró comparando 112 fuentes de sourcemaps y siete archivos de metadatos/documentación/licencia contra Git, además de sus hashes.

## 3. API y compatibilidad comprobadas

- 140 exports ESM/CJS coincidentes; se conservan los 139 anteriores de 0.3.5.
- Marcador público `editorCapabilitiesVersion = 1`, perfil opcional capabilities del editor, versión y getVersion 0.4.0.
- Resolución correcta de la entrada principal, styles y package.json. CSS idéntico a 0.3.5.
- Incluye bundles ESM/CJS, mapas, CSS, README, LICENSE, changelog, contrato de capacidades y notas de procedencia/migración.
- Se conserva el contrato de documentos y el identificador de catálogo 0.3.5; runtime 0.4.0 no cambia ese identificador ni fuerza migración de las plantillas.

## 4. Adopción y verificaciones posteriores a publicación

Se aplicaron los parches preparados, se actualizaron locks y se instalaron con pnpm 9.15.0, la versión declarada por ambos proyectos. No hay referencias a tarballs temporales en los cambios definitivos.

Hub fija 0.4.0 directamente y mediante override, de modo que el paquete compartido inmutable website-blocks también resuelve 0.4.0. Su revisión e inventario de archivos no cambiaron. ERP fija exactamente 0.4.0 en API, desktop y website-blocks.

La resolución inicial del lock ERP intentó actualizar dependencias latest ajenas. Se descartó esa deriva; se conservaron el registro de paquete Atlas generado por pnpm, sus nuevos pins/integridad y todas las resoluciones anteriores de dependencias y peers. Una comprobación estructural del lock verificó que no existían otras diferencias. La instalación frozen-lockfile pasó y sólo instaló el nuevo Atlas. No se actualizaron dependencias ajenas.

Comandos de adopción ejecutados (el contexto del parche Hub se adaptó a la base remota):

```powershell
git apply --check docs/releases/atlas-0.4.0-dependencies.patch
git apply docs/releases/atlas-0.4.0-dependencies.patch
corepack pnpm install --lockfile-only --ignore-scripts
corepack pnpm install --frozen-lockfile
corepack pnpm why -r @raulbellosom/atlas-web-builder
```

Después de instalar, se comprobó en los cuatro consumidores directos que ESM/CJS y CSS son idénticos a los extraídos del registro, y que exponen la nueva API. pnpm why confirmó que tanto el import directo como website-blocks resuelven realmente 0.4.0.

| Verificación dirigida | Resultado |
| --- | --- |
| Verificador del tarball del registro antes de adoptar | Aprobado |
| Mismo verificador tras instalar los pins definitivos | Aprobado |
| Siete pruebas Hub de capacidades, ZIP, preservación y catálogo | 7/7 en cada punto de control |
| Chromium Frame: cargar plantilla, editar texto/color, guardar y reabrir | Aprobado, valor exacto |
| Efectos/SEO/tema incompatibles y ausencia de API legacy | Edición protegida, documento sin mutaciones silenciosas; 0.3.5 sigue rechazado |
| Tema intacto, fuentes/radios históricos y propiedades personalizadas | Conservados |
| Efectos/SEO admitidos por Atlas/ERP, serialización y SSR | Aprobado; validadores conservados |
| React/ReactDOM 18.3.1, 19.3.0 Hub y 19.3.1 ERP | Imports, SSR y flujo de editor Chromium aprobados |
| Runtime ERP público real y SSR con el paquete publicado | Construcción, SSR, hidratación y menú móvil aprobados |
| Versión de runtime no revisada | Rechazada |
| Catálogo ERP/Hub | 148 tipos; 144 defaults portables válidos |
| verifyWebsiteSource production | github-packages, revisión 3a071090875b9f3803f895e00d78fc25a047e829; inventario íntegro |
| Lint dirigido y git diff --check | Aprobados |
| Privacidad de los siete archivos de preparación/adopción ERP | 0 hallazgos |
| Gate obligatorio global ERP | BLOQUEADO: código 1, 7.222 archivos, 72 hallazgos |

Digest de catálogo conservado: `0e6f77787d7351448f05dc87af8b1f2bb701170a1077eacc76633d548216d248`.

El runtime ERP también se construyó desde el checkout con el paquete realmente instalado. Produce el mismo par cliente/SSR verificado:

- Cliente: `a062570ae8afd649bdab103eb8199e57ab0a3ba2db355eba657d1615edf16d12`.
- CSS público: `0b03ec3960b35e412ed70607f940a39fb28a1653f4d014f9f22c61f143da9e43`.
- SSR: `a3caef8ee6bb53cf98f208ed9f97f319568f6754fb3297b04d4d2d654e4d4532`.

Evidencia local no publicable: `.artifacts/releases/0.4.0/registry/dist.json`, tarball descargado, `adoption.json` y `erp-installed-runtime/`, dentro de Atlas. Log de privacidad con valores redactados: `.artifacts/atlas-0.4.0-privacy.log` dentro del ERP. No se incorporaron los bundles generados al repositorio ERP.

Hub se publicó con push normal HEAD:refs/heads/main después de fetch y merge-base --is-ancestor. El workflow existente sólo admite workflow_dispatch; no se lanzó ningún workflow ni comando de despliegue.

## 5. Archivos modificados por repositorio

Atlas: este informe documental. La publicación usa sin cambios los archivos aprobados en Fase 0.6 y el tag permanece en su commit de release.

ERP, preparación y adopción acumuladas desde la base local 645769f37:

- apps/api/package.json
- apps/desktop/package.json
- packages/website-blocks/package.json
- pnpm-lock.yaml
- scripts/build-website-public-runtime.mjs
- docs/releases/ATLAS_0_4_0_ADOPTION.md
- docs/releases/atlas-0.4.0-dependencies.patch

Hub, rango distribuido desde main remoto 754c7d7:

- apps/web/src/marketplace-console/WebsiteEditor.jsx
- apps/web/src/website/Frame.jsx
- apps/web/src/website/capabilities.js
- apps/web/src/website/portable.js
- apps/web/src/website/theme-portability.js
- package.json
- pnpm-lock.yaml
- tests/support/atlas-legacy-fixture.js
- tests/website-capabilities.test.js
- tests/website-capabilities-browser.test.js
- docs/releases/ATLAS_0_4_0_ADOPTION.md
- docs/releases/atlas-0.4.0-dependencies.patch

## 6. Bloqueos y alcance pendiente

El único bloqueo observado para completar la integración solicitada es el gate obligatorio ERP: se conservan y documentan los 72 hallazgos globales anteriores. Los siete archivos de esta tarea se comprobaron con el mismo inspectFile y no añaden hallazgos. No se modificaron políticas, validadores, hooks, allowlists ni controles de seguridad; el resultado dirigido no sustituye al gate global. ERP no se integró ni se subió a ninguna rama remota.

Resolver la deuda global de privacidad es trabajo separado de esta adopción. Una vez resuelta, será necesario revalidar el gate y revisar la base remota antes de integrar sólo los commits Atlas, evitando arrastrar los commits locales ajenos de module-compiler. La autorización de distribución existente no autoriza a saltar ese gate.

La promoción npm latest no se ejecutó: se mantuvo la distribución controlada mediante next y pins exactos. Una futura promoción/despliegue requiere su autorización y gates; no es necesaria para que los consumidores usen exactamente 0.4.0.

No se certificaron persistencia autenticada en una base de datos ni publicación de sitios en producción. Las pruebas de guardado/reapertura usaron el escritor/lector real del contrato y ZIP, y el runtime público se probó localmente. No se repitieron las 51 pruebas Atlas ya aprobadas, auditorías, suites globales ni matrices E2E completas: las repeticiones se limitaron a los dos puntos de control del paquete publicado prescritos en Fase 0.6. El intento prematuro inicial de abrir el tarball aún no descargado produjo ENOENT; se corrigió el orden y las verificaciones reales posteriores pasaron.

## 7. Rollback

No se ejecutó rollback ni hay cambios de producción que revertir.

1. Ante un defecto, detener adopción/promoción/despliegue. Conservar documentos, guards, tarballs y tags; no despublicar, reemplazar 0.4.0 ni reescribir historia.
2. Hub: preparar una rama desde el main remoto actualizado y revertir únicamente el commit de pin/override/lock `6db2e8a03365b5975d778f63aec9321e02f65868`, conservando las defensas anteriores:

```powershell
git fetch origin main
git switch -c rollback/atlas-0.4.0 origin/main
git revert 6db2e8a03365b5975d778f63aec9321e02f65868
corepack pnpm install --frozen-lockfile
```

3. ERP: en su rama local de adopción, revertir `34ca30fc4390dd40f7d22338c2529571134f4bdb` y reinstalar con frozen-lockfile. Mantener el guard exacto del runtime preparado. No publicar esa reversión mientras siga bloqueado el gate.
4. Restaurar siempre manifests/lock/código y el par cliente/SSR como conjunto. No mezclar versiones de runtime ni sobrescribir assets inmutables. Verificar las pruebas dirigidas antes de una integración de rollback.
5. Con 0.3.5, el Hub protegido debe deshabilitar la edición explícitamente y conservar los documentos; nunca retirar el guard ni podar propiedades para recuperar edición.
6. No tocar el tag Git v0.4.0. Un arreglo nuevo requiere otra versión y autorización; no se publica automáticamente. Si se necesitara retirar next, sería una acción separada y autorizada. latest sigue en 0.3.5.

**Producción permanece intacta:** no hubo despliegues, conexiones para modificar datos, migraciones ni cambios en servidores. No comenzó el rediseño visual ni la Fase 1.

**NO APTO PARA INICIAR FASE 1: falta resolver el gate obligatorio de privacidad ERP y completar su integración segura.**
