import { PerspectiveCamera, Vector3, type Camera, type Mesh, type Object3D } from 'three'

import { FOV, type CameraPose, type Viewport } from '@/three/framing'

export function makeCamera(pose: CameraPose, v: Viewport): PerspectiveCamera {
  const cam = new PerspectiveCamera(FOV, v.width / v.height, 10, 10000)
  cam.position.copy(pose.position)
  cam.lookAt(pose.target)
  cam.updateMatrixWorld(true)
  cam.updateProjectionMatrix()
  return cam
}

/** NDC extent of every vertex under `root`; [-1, 1] is on screen. */
export function ndcBounds(root: Object3D, camera: Camera) {
  root.updateMatrixWorld(true)
  const v = new Vector3()
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).project(camera)
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y)
    }
  })
  return { minX, maxX, minY, maxY }
}
