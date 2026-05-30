/**
 * @file Spanish UI strings for the editor chrome. Keep keys in English so they
 * are stable across translations.
 */
export const es = {
  topbar: {
    title: 'Atlas WB',
    undo: 'Deshacer',
    redo: 'Rehacer',
    preview: 'Vista previa',
    saveDraft: 'Guardar borrador',
    publish: 'Publicar',
    importPage: 'Importar',
    exportPage: 'Exportar',
    importError: 'No se pudo importar la página: {message}',
    device: {
      desktop: 'Escritorio',
      tablet: 'Tableta',
      mobile: 'Móvil',
    },
  },
  leftPanel: {
    blocks: 'Bloques',
    templates: 'Plantillas',
    pages: 'Páginas',
    emptyTemplates: 'No hay plantillas registradas. Añádelas a la prop "templates" del editor.',
    emptyPages: 'La gestión de páginas estará disponible en una fase posterior.',
    dragHint: 'Arrastra al lienzo para insertar',
    insertTemplate: 'Insertar plantilla',
  },
  rightPanel: {
    properties: 'Propiedades',
    theme: 'Tema',
    page: 'Página',
    layers: 'Capas',
    noSelection: 'Selecciona un bloque para editar sus propiedades.',
    themeReadOnly: 'El editor de tema llegará en la Fase 5.',
    pageReadOnly: 'La gestión de páginas llegará en la Fase 8.',
  },
  canvas: {
    empty: 'Arrastra un bloque desde el panel izquierdo para empezar.',
    dropHere: 'Suelta aquí',
  },
  selection: {
    duplicate: 'Duplicar',
    moveUp: 'Subir',
    moveDown: 'Bajar',
    remove: 'Eliminar',
  },
  breadcrumb: {
    root: 'Página',
  },
  layers: {
    empty: 'No hay bloques en esta página.',
  },
  regions: {
    tabsLabel: 'Regiones de la página',
    activate: 'Editar región {name}',
    defaultLabels: {
      main: 'Principal',
      header: 'Cabecera',
      footer: 'Pie',
      sidebar: 'Barra lateral',
      aside: 'Aparte',
    },
  },
  assets: {
    pickerLabel: 'Selector de medios',
    pickerTitle: 'Medios',
    browse: 'Examinar...',
    upload: 'Subir',
    uploading: 'Subiendo...',
    close: 'Cerrar',
    loading: 'Cargando medios...',
    empty: 'No hay medios disponibles. Sube un archivo para empezar.',
    invalidUrl: 'URL no permitida (usa https:// o ruta interna).',
  },
  theme: {
    untitled: 'Tema',
    reset: 'Restablecer',
    empty: 'Este tema no tiene tokens editables.',
    categories: {
      color: 'Color',
      font: 'Tipografía',
      fontSize: 'Tamaño de fuente',
      radius: 'Radios',
      spacing: 'Espaciado',
      shadow: 'Sombras',
    },
  },
  notifications: {
    region: 'Notificaciones',
    dismiss: 'Cerrar',
    importSuccess: 'Página importada correctamente.',
    importUnknownTypes: 'La página usa bloques no registrados: {types}',
    exportSuccess: 'Página exportada.',
    templateInserted: 'Plantilla insertada: {label}',
  },
}
