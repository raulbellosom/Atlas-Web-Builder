import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { CapabilityBoundary } from '../capabilities.jsx'
import { SliderInput } from '../ui/NumericControls.jsx'
import { AnimationField } from '../fields/AnimationField.jsx'
import { FilterField } from '../fields/FilterField.jsx'
import { HoverField } from '../fields/HoverField.jsx'
import { TransformField } from '../fields/TransformField.jsx'
import { KenBurnsField, PressedField } from '../fields/MotionFields.jsx'

export function UniversalEffects({ merged, def, selectedId }) {
  const updateBlockProps = useEditorStore(state => state.updateBlockProps)
  const opacityVal = merged._opacity !== undefined ? merged._opacity : 1
  const cursorVal = merged._cursor || 'auto'
  const zIndexVal = merged._zIndex || ''
  const stickyVal = !!merged._sticky
  const scrollReveal = !!merged._scrollReveal
  const playEffectPreview = useEditorStore(state => state.playEffectPreview)
  // Ken Burns only makes sense on blocks that show an image or a background image.
  const hasImage = Object.entries(def.fields ?? {}).some(([key, spec]) => spec?.type === 'image' || key === 'backgroundImage')
  const hasEntrance = !!merged._animation && merged._animation.preset && merged._animation.preset !== 'none'
  return (
          <CapabilityBoundary name="effects">
          <div className="atlas-wb-field">
            <span className="atlas-wb-field__label">Opacidad</span>
            <SliderInput label="Opacidad" value={opacityVal} min={0} max={1} step={0.01} onChange={value => updateBlockProps(selectedId, { _opacity: value })} />
          </div>
          <AnimationField
            label="Animación de entrada"
            value={merged._animation}
            onChange={(v) => updateBlockProps(selectedId, { _animation: v })}
          />
          {hasEntrance && (
            <div className="atlas-wb-field">
              <button type="button" className="atlas-wb-btn atlas-wb-btn--secondary" onClick={() => playEffectPreview(selectedId)}>Reproducir entrada</button>
            </div>
          )}
          <div className="atlas-wb-field">
            <span className="atlas-wb-field__label">Revelar al hacer scroll</span>
            <label className="atlas-wb-effects-toggle">
              <input
                type="checkbox"
                checked={scrollReveal}
                onChange={(e) => updateBlockProps(selectedId, { _scrollReveal: e.target.checked })}
              />
              <span className="atlas-wb-effects-toggle__text">
                {scrollReveal
                  ? 'La animación se dispara cuando el bloque entra en pantalla'
                  : 'La animación se reproduce al cargar la página'}
              </span>
            </label>
          </div>
          <HoverField
            label="Efecto al pasar el cursor"
            value={merged._hover}
            onChange={(v) => updateBlockProps(selectedId, { _hover: v })}
          />
          <PressedField value={merged._pressed} onChange={(v) => updateBlockProps(selectedId, { _pressed: v })} />
          {hasImage && <KenBurnsField value={merged._kenburns} onChange={(v) => updateBlockProps(selectedId, { _kenburns: v })} />}
          {def.slots && Object.keys(def.slots).length > 0 && (
            <div className="atlas-wb-field">
              <span className="atlas-wb-field__label">Cascada de hijos</span>
              <div className="atlas-wb-props__opacity-row">
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="25"
                  aria-label="Cascada de hijos"
                  value={merged._stagger || 0}
                  onChange={(e) =>
                    updateBlockProps(selectedId, { _stagger: Number(e.target.value) || undefined })
                  }
                />
                <span className="atlas-wb-props__opacity-val">
                  {merged._stagger ? `${merged._stagger}ms` : 'Off'}
                </span>
              </div>
              <span className="atlas-wb-effects-toggle__text">
                Los hijos aparecen uno tras otro al hacer scroll (pausa entre cada uno)
              </span>
            </div>
          )}
          <div className="atlas-wb-field">
            <span className="atlas-wb-field__label">Parallax</span>
            <div className="atlas-wb-props__opacity-row">
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.05"
                aria-label="Parallax"
                value={merged._parallax?.speed || 0}
                onChange={(e) => {
                  const speed = Number(e.target.value)
                  updateBlockProps(selectedId, { _parallax: speed ? { speed } : undefined })
                }}
              />
              <span className="atlas-wb-props__opacity-val">
                {merged._parallax?.speed ? merged._parallax.speed.toFixed(2) : 'Off'}
              </span>
            </div>
            <span className="atlas-wb-effects-toggle__text">
              El bloque se desplaza a distinta velocidad que el scroll (se desactiva con movimiento
              reducido)
            </span>
          </div>
          <FilterField
            label="Filtros CSS"
            value={merged._filter}
            onChange={(v) => updateBlockProps(selectedId, { _filter: v })}
          />
          <TransformField
            label="Transformaciones"
            value={merged._transform}
            onChange={(v) => updateBlockProps(selectedId, { _transform: v })}
          />
          <div className="atlas-wb-field">
            <span className="atlas-wb-field__label">Cursor</span>
            <select
              className="atlas-wb-field__select"
              aria-label="Cursor"
              value={cursorVal}
              onChange={(e) => updateBlockProps(selectedId, { _cursor: e.target.value })}
            >
              <option value="auto">Auto (por defecto)</option>
              <option value="default">Flecha</option>
              <option value="pointer">Mano (pointer)</option>
              <option value="grab">Agarrar (grab)</option>
              <option value="zoom-in">Zoom +</option>
              <option value="zoom-out">Zoom −</option>
              <option value="crosshair">Cruz</option>
              <option value="not-allowed">No permitido</option>
              <option value="text">Texto (I-beam)</option>
            </select>
          </div>
          <div className="atlas-wb-field">
            <span className="atlas-wb-field__label">Z-index (capa)</span>
            <select
              className="atlas-wb-field__select"
              aria-label="Z-index"
              value={zIndexVal}
              onChange={(e) =>
                updateBlockProps(selectedId, {
                  _zIndex: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">Auto</option>
              <option value="1">1</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="1000">1000</option>
            </select>
          </div>
          <div className="atlas-wb-field">
            <span className="atlas-wb-field__label">Posición fija (sticky)</span>
            <label className="atlas-wb-effects-toggle">
              <input
                type="checkbox"
                checked={stickyVal}
                onChange={(e) =>
                  updateBlockProps(selectedId, { _sticky: e.target.checked || undefined })
                }
              />
              <span className="atlas-wb-effects-toggle__text">
                {stickyVal
                  ? 'El bloque queda fijo al hacer scroll (sticky)'
                  : 'Posición normal en el flujo del documento'}
              </span>
            </label>
          </div>
          </CapabilityBoundary>
  )
}
