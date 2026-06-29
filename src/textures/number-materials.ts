import { CanvasTexture, MeshToonMaterial, SRGBColorSpace } from 'three'
import { FACES } from '../physics/faces'

/** Draw a single digit on a light square → a CanvasTexture (no asset pipeline). */
function makeDigitTexture(digit: number): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, size, size)

  // thin inset border so adjacent faces read apart
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = size * 0.05
  ctx.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88)

  ctx.fillStyle = '#0f172a'
  ctx.font = `bold ${size * 0.6}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(digit), size / 2, size * 0.55)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// Six face materials in BoxGeometry order (+X, −X, +Y, −Y, +Z, −Z), digits taken from the FACES
// table so the rendered number always matches readDieValue. Toon material for the cel-shaded look
// (paired with drei <Outlines> on the die). Built once and shared by every die.
let shared: MeshToonMaterial[] | null = null

export function getNumberMaterials(): MeshToonMaterial[] {
  if (!shared) {
    shared = FACES.map((face) => new MeshToonMaterial({ map: makeDigitTexture(face.value) }))
  }
  return shared
}
