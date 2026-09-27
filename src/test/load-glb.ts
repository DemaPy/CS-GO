import { readFileSync } from 'node:fs'
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
} from 'three'

interface GltfJson {
  scene?: number
  scenes: { nodes: number[] }[]
  nodes: {
    name?: string
    mesh?: number
    children?: number[]
    translation?: number[]
    rotation?: number[]
    scale?: number[]
  }[]
  meshes: { primitives: { attributes: { POSITION: number } }[] }[]
  accessors: {
    bufferView: number
    byteOffset?: number
    count: number
    componentType: number
    type: string
  }[]
  bufferViews: { byteOffset?: number; byteStride?: number }[]
}

/**
 * Loads a GLB's node graph and vertex positions in Node, with no DOM.
 *
 * GLTFLoader needs image decoding for the embedded textures, which Node does
 * not have, and the framing/shadow tests only need geometry. It builds the
 * graph the way GLTFLoader does: a node with a one-primitive mesh IS the Mesh,
 * so `createGltfRig`'s `isMesh` filters see the same shape they see in the
 * browser. Materials are MeshBasicMaterial, which `paint()` leaves alone.
 */
export function loadGlbGeometry(path: string): Object3D {
  const buf = readFileSync(path)
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path} is not a GLB`)
  const jsonLength = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8')) as GltfJson
  const binStart = 20 + jsonLength + 8

  const positions = (index: number): Float32Array => {
    const a = json.accessors[index]
    const view = json.bufferViews[a.bufferView]
    if (a.componentType !== 5126 || a.type !== 'VEC3') {
      throw new Error('POSITION must be a float VEC3 accessor')
    }
    if (view.byteStride && view.byteStride !== 12) {
      throw new Error('interleaved POSITION is not supported')
    }
    const offset = binStart + (view.byteOffset ?? 0) + (a.byteOffset ?? 0)
    const out = new Float32Array(a.count * 3)
    for (let i = 0; i < out.length; i++) out[i] = buf.readFloatLE(offset + i * 4)
    return out
  }

  const meshFor = (index: number): Object3D => {
    const parts = json.meshes[index].primitives.map((p) => {
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(positions(p.attributes.POSITION), 3))
      return new Mesh(g, new MeshBasicMaterial())
    })
    if (parts.length === 1) return parts[0]
    const group = new Group()
    parts.forEach((m) => group.add(m))
    return group
  }

  const objects = json.nodes.map((n) => {
    const o = n.mesh !== undefined ? meshFor(n.mesh) : new Group()
    o.name = n.name ?? ''
    if (n.translation) o.position.fromArray(n.translation)
    if (n.rotation) o.quaternion.fromArray(n.rotation)
    if (n.scale) o.scale.fromArray(n.scale)
    return o
  })
  json.nodes.forEach((n, i) => n.children?.forEach((c) => objects[i].add(objects[c])))

  const root = new Group()
  json.scenes[json.scene ?? 0].nodes.forEach((i) => root.add(objects[i]))
  root.updateMatrixWorld(true)
  return root
}
