import { useEffect, useRef, useState } from 'react'
import { DEVICE_WIDTHS } from '../store/createEditorStore.js'
import { Monitor, Smartphone, Tablet, ZoomIn, ZoomOut } from 'lucide-react'
import { IconButton } from '../ui/OverlayControls.jsx'

export function CanvasViewport({ device, frameProps, children }) {
  const frame = useRef(null)
  const [size, setSize] = useState({ available: DEVICE_WIDTHS[device], height: 400 })
  const [zoom, setZoom] = useState('fit')
  const width = DEVICE_WIDTHS[device]
  const DeviceIcon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor
  const scale = zoom === 'fit' ? Math.min(1, size.available / width) : zoom
  useEffect(() => {
    const element = frame.current, parent = element.closest('.atlas-wb-canvas'), view = element.ownerDocument.defaultView
    const measure = () => {
      const styles = view.getComputedStyle(parent)
      const available = parent.clientWidth - parseFloat(styles.paddingLeft || 0) - parseFloat(styles.paddingRight || 0)
      const height = element.offsetHeight || 400
      setSize(previous => previous.available === available && previous.height === height ? previous : { available: available || width, height })
    }
    const observer = view.ResizeObserver ? new view.ResizeObserver(measure) : null
    observer?.observe(parent); observer?.observe(element)
    measure(); view.addEventListener('resize', measure)
    return () => { observer?.disconnect(); view.removeEventListener('resize', measure) }
  }, [width])
  return <>
    <div className="atlas-wb-canvas-tools" role="group" aria-label="Zoom del lienzo">
      <span className="atlas-wb-canvas-tools__label"><DeviceIcon />{device === 'mobile' ? 'Teléfono' : device === 'tablet' ? 'Tableta' : 'Escritorio'} · {width}px</span>
      <div className="atlas-wb-canvas-tools__zoom">
      <IconButton icon={ZoomOut} label="Alejar lienzo" side="bottom" disabled={scale <= .25} onClick={() => setZoom(Math.max(.25, Math.round((scale - .1) * 100) / 100))} />
      <select aria-label="Zoom del lienzo" value={zoom} onChange={event => setZoom(event.target.value === 'fit' ? 'fit' : Number(event.target.value))}>
        <option value="fit">Ajustar · {Math.round(scale * 100)}%</option>
        {[.25, .5, .75, 1, 1.25, 1.5].map(value => <option key={value} value={value}>{value * 100}%</option>)}
        {zoom !== 'fit' && ![.25, .5, .75, 1, 1.25, 1.5].includes(zoom) && <option value={zoom}>{Math.round(zoom * 100)}%</option>}
      </select>
      <IconButton icon={ZoomIn} label="Acercar lienzo" side="bottom" disabled={scale >= 1.5} onClick={() => setZoom(Math.min(1.5, Math.round((scale + .1) * 100) / 100))} />
      </div>
    </div>
    <div className="atlas-wb-canvas__stage" style={{ width: width * scale, height: size.height * scale, alignSelf: width * scale > size.available ? 'flex-start' : 'center' }}>
      <div ref={frame} className="atlas-wb-canvas__frame" {...frameProps} style={{ width, maxWidth: 'none', transform: `scale(${scale})`, transformOrigin: 'top left', '--awb-canvas-scale': scale }}>{children}</div>
    </div>
  </>
}
