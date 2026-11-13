# Capacidades del editor Website — API 1

Contrato local de Fase 0.5, 13 de noviembre de 2026. Complementa la auditoría existente; no modifica Page schema 1, Website Template v2, catálogo, digest ni validadores de seguridad.

## Versiones y adopción

Son identidades independientes:

| Identidad | Valor |
|---|---|
| Versión npm recuperada | `@raulbellosom/atlas-web-builder@0.3.5` |
| Base de fuente publicada | `dc30666923a6b4d19919a0e154bb4eb2cdd65e2f` |
| API nueva local del editor | `editorCapabilitiesVersion = 1` |
| Perfil del Hub | `id: runly.website-template.v2`, `schemaVersion: 1` |
| Documento Atlas | `schemaVersion: 1` |
| ZIP Website | `formatVersion: 2`, `minReaderVersion: 2` |
| Catálogo compartido | 148 tipos, SHA-256 `0e6f77787d7351448f05dc87af8b1f2bb701170a1077eacc76633d548216d248` |

El npm 0.3.5 original **no implementa** la API nueva. Los cambios locales de esta fase mantienen el número npm por instrucción del propietario, pero no son un reemplazo publicable con el mismo número. El Hub comprueba el marcador antes de montar un editor restringido. Si falta o es distinto, informa el bloqueo, no envía loaded y no monta controles editables. El host mantiene deshabilitado el guardado. Preview puede seguir usando el renderer sin editar.

Para adoptar los cambios fuera de las pruebas de fuente se necesita distribuir una revisión nueva autorizada y fijarla en los consumidores. No modificar node_modules, sustituir tarballs ni cambiar la interpretación de un lock existente. Esa distribución no está autorizada en esta fase.

## API declarativa

```jsx
<AtlasWebBuilderEditor
  capabilities={{
    schemaVersion: 1,
    id: 'runly.website-template.v2',
    reason: 'Website v2 no representa este ajuste',
    effects: false,
    seo: false,
    pageMetadata: false,
    templates: false,
    pageCreation: false,
    jsonImport: false,
    manualAssetUrls: false,
    themeBrand: false,
    themeReset: false,
    themeTokenGroups: ['color'],
    themeTokenPatterns: {color: '^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$'},
  }}
  {...hostProps}
/>
```

La ausencia de capabilities conserva el editor genérico. Un perfil con otra schemaVersion se rechaza explícitamente. Los controles deshabilitados muestran una nota de sólo lectura; no filtran ni reescriben la instancia del documento. La API limita edición de UI, **no es una frontera de seguridad ni una autorización**. El servidor sigue validando todos los bytes.

| Clave | Alcance de la restricción |
|---|---|
| effects | Inspector de efectos universales; no afecta las props ya existentes ni animaciones internas de bloques |
| seo | Panel SEO completo |
| pageMetadata | Título, slug y visibilidad nativos; el host conserva la gestión de páginas/rutas |
| pageCreation | Creación de páginas dentro del editor; no inventa una API de layouts |
| templates | Inserción/clic/drag desde la biblioteca de templates nativa; el host sigue importando ZIPs validados |
| jsonImport | Importación JSON desde toolbar; el formato portable se importa en el host |
| manualAssetUrls | Entrada manual y fallback FileReader de ImageField, URL de BackgroundField y URL del AssetPicker; biblioteca/AssetSource permanece disponible |
| themeBrand / themeReset | Reemplazo masivo del tema y reset; evitan alterar grupos no representables |
| themeTokenGroups | Allowlist de grupos editables; los demás son visibles pero deshabilitados |
| themeTokenPatterns | Patrones de valores aceptados; texto de color inválido muestra error y no reemplaza el último token válido |

El Hub bloquea snapshot cuando encuentra inputs inválidos. No transmite el valor anterior como si un borrador inválido visible se hubiera aceptado. Los valores inválidos no se incorporan al estado persistible.

`fields[*].readOnly` permite deshabilitar un campo declarado sin borrar su valor. El perfil del Hub registra overrides para formId (sólo `''`, `@contact`, `@newsletter`) y calendarId (sólo lectura; enlace al importar). Las restricciones se concentran en `apps/web/src/website/capabilities.js`, no en listas de condiciones repartidas en el motor.

`portableBlockDefinition` usa sólo defaults catalogados al crear una instancia nueva (por ejemplo evita metadatos de imagen no declarados). No filtra props del documento histórico. El renderer sigue combinando defaults permitidos y props originales. Un valor histórico no portable se conserva y el validador rechaza su exportación; no se inventa una migración que lo suprima.

## Matriz por propiedad/capacidad

«Publicar ERP» se refiere a la política de release builder revisada, no a haber ejecutado una publicación. «Guardar/reabrir Hub» usa el escritor y lector instalados; el editor nuevo requiere adopción de la API 1. Ninguna afirmación de esta matriz sustituye la seguridad de contenido ni los bindings y permisos del servidor.

| Propiedad | Atlas representa / renderer | Edición Atlas genérico | Backend ERP | Guardar/reabrir ERP | Edición Hub API 1 | Guardar/reabrir/publicar Website v2 | ¿Migración? |
|---|---|---|---|---|---|---|---|
| Texto, selects, números, toggles catalogados | Sí | Sí | Catálogo y validación por ruta | Sí, valores válidos; revisión y permisos | Sí | Sí, si cumple tipo/rango/contenido | No |
| Props propias de Runly Blocks | Sí, con definición registrada | Fields que exponga el bloque | Catálogo compartido | Sí, sujeto a bindings | Fields catalogados | Sí dentro de grupo/perfil | No para las actuales |
| `_opacity`, `_hover`, `_scrollReveal` | Sí | Sí | Allowlist de efectos al publicar | Borrador conserva; publicación valida | Sólo lectura | Rechazadas: prop_unknown | Sí para incorporarlas a ZIP |
| `_animation` | Sí, presets tipados | Sí | Presets y rangos | Igual que efectos | Sólo lectura | Rechazada | Sí |
| `_filter`, `_transform` | Sí | Sí | Rangos más restrictivos que runtime en algunos ejes | Borrador conserva; valores fuera de rango fallan al publicar | Sólo lectura | Rechazadas | Sí; primero acordar límites |
| `_stagger`, `_parallax` | Sí | Sí | Allowlist numérica | Sí con límites | Sólo lectura | Rechazadas | Sí |
| `_cursor`, `_sticky`, `_zIndex`, `_lazy`, `_lazyMinHeight` | Sí | Sí/parcial según control | Allowlist específica | Sí con límites | Sólo lectura en inspector; lazy no tiene control nuevo | Rechazadas | Sí |
| Counter/Typewriter y movimiento propio de bloques | Sí | Fields catalogados | Tipo y propiedades de catálogo | Sí según contrato | Sí, fields propios | Sí, distintos de las props universales `_...` | No para fields existentes |
| `page.seo` | Sí; helpers/head/panel separados | Sí | Servicios/documentos propios | Conservado; requiere política SEO de publicación | Sólo lectura | PAGE_NOT_PORTABLE si no vacío | Sí para SEO portable |
| Visibilidad public/private | Sí | Sí; draft ya no se ofrece como visibilidad | Estado editorial separado | Parse admite public/private | Sólo lectura; public en ZIP | Sólo public | Sí para otra visibilidad portable |
| Tema: colores hex 6/8 dígitos | CSS vars | Sí | Tokens del sitio | Bridge guarda tema por separado | Sí, patrón validado | Sí; clave/valor original preservados | No |
| Tema: fonts body/heading | Tokens; fuentes requieren carga confiable | Texto libre | Tokens; estilos host | Preservadas | Sólo lectura en esta fase | Se conservan; lector exige familia permitida | No para familias ya permitidas; nuevo selector/catálogo requiere trabajo posterior |
| Tema: radius/spacing únicos | Representables mediante escalas | Escalas individuales | Tokens | Bridge conserva | Sólo lectura: no hay editor acoplado de escala en esta fase | Valores originales conservados | No para escala actual; nueva estructura sí |
| Tema: shadow/fontSize/button/card/serif/mono | Sí, según bloque | Sí | Tokens guardables en ERP | Conservados por bridge | Sólo lectura | Fuera del tema v2 actual si se intenta cambiarlos | Sí |
| Tema de marca / reset masivo | Sí | Sí | Bridge de tema | Según tokens y permisos | Deshabilitados | No se intenta convertir grupos no representables | No se amplía en esta fase |
| Fondo sólido/token | Sí | Sí | Campo background | Sí | Sí | Sí, valor válido | No |
| Degradado lineal de dos colores | Sí | Sí | Background validado | Sí | Sí | Sí; sin CSS libre ni url() | No |
| Degradado multiparada/radial/cónico | No en contrato actual | No | No contrato común | No afirmado | No | No | Sí |
| Imagen de biblioteca `asset:hash` | Adaptador a data URL en Frame | AssetSource | ERP usa file:ID y bindings | Requiere archivo autorizado | Biblioteca, sin URL externa/fallback sin registrar | PNG/JPEG/WebP empaquetados y licenciados | No |
| naturalWidth/naturalHeight/dominantColor/variants | Runtime de imagen | AssetSource según spec | Algunos metadatos admitidos, variants no generales | Según validador de release | No se añaden; defaults nuevos catalogados | No declarados en v2, se rechazan si existentes | Sí |
| SEO/tema no portable histórico | Puede conservarlo | UI restringida en perfil Hub | Preservación estructural | No se modifica para migrarlo | Sólo lectura | Bloqueo explícito si ya es incompatible | Migración explícita; nunca poda silenciosa |
| Responsive viewport desktop/tablet/mobile | Sí, preview | Sí | No cambia documento | No añade props | Sí | No afecta persistencia | No |
| Overrides arbitrarios por breakpoint | Sin modelo general | No | Sin contrato común | No afirmado | No | No | Sí |
| `stackOnMobile` de Columns | Campo representable; render no lo implementa en base auditada | Sigue como field de catálogo | Lo guarda | Valor conservado; comportamiento responsive pendiente | Valor guardable, efecto visual no certificado | Se conserva; no se afirma apilado resuelto | Corrección de renderer futura, sin formato nuevo necesariamente |
| Props personalizadas ya guardadas | Props abiertas; renderer las usa si las conoce | Fields de definición confiable | Draft conserva; publicación puede conformar/validar | No garantía portable fuera de catálogo | No hay control inventado | Fuera de catálogo se rechazan sin mutar origen | Sí para incorporarlas al perfil |
| Componentes React personalizados | Sí desde host confiable | Registro de bloques | Necesita runtime/catálogo/política | No automático | Sin carga de código de plantilla | Tipo desconocido rechazado | Contrato/catálogo nuevo; nunca JS arbitrario |
| Video/embed/cart/account | Hay implementaciones | Host decide | Runtime/bindings propios | No garantía universal | Cuatro tipos excluidos del perfil | VideoBlock, CartBlock, CartPageBlock, AccountPortalBlock excluidos | Revisión explícita de política |
| formId/calendarId | Runly Blocks | Fields del host | IDs/bindings locales | Depende de permisos/servicios | Marcadores para formId; calendario sólo lectura | @contact/@newsletter; calendarId vacío | No para marcadores; acciones dinámicas nuevas sí |

El guardado estructural ERP no equivale a publicación. La Fase 0.5 no cambia conformTemplateDocument, permisos, validadores, límite de 8 MiB por imagen importada, restricciones de red/iframe ni formatos de paquetes. No se certifica pago/reserva ni publicación de un componente dinámico por estar presente en el catálogo.

## Conservación y pruebas

- El documento no se filtra al abrir ni al guardar un snapshot. El validador rechaza una propiedad no soportada; la copia original permanece intacta.
- El bridge de tema aplica sólo diferencias de color sobre el tema original. Reabrir/guardar sin cambios no agrega colores por defecto ni elimina familias/radio originales.
- Los defaults de nuevas instancias se proyectan al catálogo; los defaults opcionales `''` siguen pasando por el escritor existente.
- Los 148 tipos y claves fields se verifican contra el catálogo. Los 144 tipos no excluidos prueban sus defaults mediante el escritor v2 real, con su siteKind correspondiente.
- La prueba Chromium usa Frame, MessageChannel, controles y lector/escritor reales. Guarda ZIP en memoria, reabre y compara texto/color exactos. No usa base de datos, cuenta ni producción y no pretende certificar esos servicios.

Pruebas: `src/__tests__/capabilities.test.jsx` en Atlas; `tests/website-capabilities.test.js` y `tests/website-capabilities-browser.test.js` en Hub. La prueba de navegador adopta la fuente local sólo en el bundler de la fixture y también prueba el npm original como caso incompatible. No cambia aliases/locks del producto ni node_modules.

## Bloqueos explícitos

1. El paquete que fijan los consumidores no contiene editorCapabilitiesVersion. Mientras no se distribuya/adopte una versión compatible, el Hub modificado inhabilita edición. No es un problema que se resuelva ignorando la restricción o simulando compatibilidad.
2. Efectos, SEO y tokens avanzados no pueden hacerse editables en Website v2 sin ampliar/versionar el contrato. Esta fase evita crearlos y preserva los existentes; no afirma que un documento ya incompatible pueda exportarse.
3. Persistencia ERP, revisiones de DB e importación/publicación remota no se ejecutaron. La validación local no certifica despliegue ni transacciones de producción.
