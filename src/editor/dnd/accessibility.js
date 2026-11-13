const label = item => item?.data.current?.label || 'bloque'

export const editorDndAccessibility = {
  screenReaderInstructions: { draggable: 'Para arrastrar, pulsa Espacio. Usa las flechas para elegir un destino, Espacio para soltar y Escape para cancelar. También puedes usar los botones Subir y Bajar.' },
  announcements: {
    onDragStart: ({ active }) => `Moviendo ${label(active)}.`,
    onDragOver: ({ over }) => over ? `Destino: ${label(over)}.` : 'Sin destino disponible.',
    onDragEnd: ({ active, over }) => over ? `${label(active)} colocado en ${label(over)}.` : 'Movimiento cancelado, sin destino.',
    onDragCancel: () => 'Movimiento cancelado.',
  },
}
