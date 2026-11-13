import '@testing-library/jest-dom/vitest'

// jsdom has no layout. Desktop fixtures use the desktop viewport from the UI
// acceptance matrix; responsive tests explicitly set their own widths.
if (typeof window !== 'undefined') Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1440 })
