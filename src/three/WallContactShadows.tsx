'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  MeshDepthMaterial,
  PlaneGeometry,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget,
  type Camera,
  type Group,
  type OrthographicCamera,
  type Scene,
  type WebGLRenderer,
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js'
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js'

interface WallContactShadowsProps {
  position: [number, number, number]
  rotation: [number, number, number]
  /** plane edge length (square) */
  scale: number
  /** depth range of the shadow camera */
  far: number
  opacity: number
  blur: number
  resolution: number
  /** Infinity renders every frame; n renders n frames after `frames` changes. */
  frames: number
}

/** The GPU side: targets, materials, and the depth-then-blur render. */
class WallShadowPass {
  readonly target: WebGLRenderTarget
  readonly plane: PlaneGeometry
  private readonly targetBlur: WebGLRenderTarget
  private readonly depth = new MeshDepthMaterial()
  private readonly horizontal = new ShaderMaterial({
    ...HorizontalBlurShader,
    uniforms: UniformsUtils.clone(HorizontalBlurShader.uniforms),
  })
  private readonly vertical = new ShaderMaterial({
    ...VerticalBlurShader,
    uniforms: UniformsUtils.clone(VerticalBlurShader.uniforms),
  })
  private readonly quad = new FullScreenQuad()

  constructor(resolution: number, scale: number) {
    this.target = new WebGLRenderTarget(resolution, resolution)
    this.targetBlur = new WebGLRenderTarget(resolution, resolution)
    this.target.texture.generateMipmaps = this.targetBlur.texture.generateMipmaps = false
    this.plane = new PlaneGeometry(scale, scale).rotateX(Math.PI / 2)

    this.depth.depthTest = this.depth.depthWrite = false
    this.depth.onBeforeCompile = (shader) => {
      shader.uniforms = { ...shader.uniforms, ucolor: { value: new Color('#000000') } }
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        'uniform vec3 ucolor;\nvoid main() {',
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );',
      )
    }
    this.horizontal.depthTest = this.vertical.depthTest = false
  }

  render(gl: WebGLRenderer, scene: Scene, camera: Camera, hide: Group, blur: number) {
    const background = scene.background
    const override = scene.overrideMaterial
    hide.visible = false
    scene.background = null
    scene.overrideMaterial = this.depth
    gl.setRenderTarget(this.target)
    gl.render(scene, camera)
    this.blur(gl, blur)
    this.blur(gl, blur * 0.4)
    gl.setRenderTarget(null)
    hide.visible = true
    scene.overrideMaterial = override
    scene.background = background
  }

  private blur(gl: WebGLRenderer, amount: number) {
    this.quad.material = this.horizontal
    this.horizontal.uniforms.tDiffuse.value = this.target.texture
    this.horizontal.uniforms.h.value = amount / 256
    gl.setRenderTarget(this.targetBlur)
    this.quad.render(gl)

    this.quad.material = this.vertical
    this.vertical.uniforms.tDiffuse.value = this.targetBlur.texture
    this.vertical.uniforms.v.value = amount / 256
    gl.setRenderTarget(this.target)
    this.quad.render(gl)
  }

  dispose() {
    this.target.dispose()
    this.targetBlur.dispose()
    this.plane.dispose()
    this.depth.dispose()
    this.horizontal.dispose()
    this.vertical.dispose()
    this.quad.dispose()
  }
}

/**
 * drei's ContactShadows, with the one change that lets it stand upright.
 *
 * drei blurs by drawing a bare quad, lying in the world XZ plane at the
 * origin, through its own shadow camera. That only covers the target when the
 * camera looks along world ±y — a floor. Turned into a back wall, the camera
 * looks along +z, sees the quad edge-on (zero screen area), and each blur pass
 * clears its target and draws nothing, so the depth pass is wiped before it is
 * ever shown. Measured: depth-pass alpha max 254, alpha max 0 after the blur.
 *
 * Here the blur runs on a full-screen quad, independent of any camera.
 * Everything else — the depth shader patch, the plane's transforms, `blur / 256` — is drei
 * 10.7's, so the look is the same as a drei floor shadow.
 */
export function WallContactShadows({
  position,
  rotation,
  scale,
  far,
  opacity,
  blur,
  resolution,
  frames,
}: WallContactShadowsProps) {
  const ref = useRef<Group>(null)
  const shadowCamera = useRef<OrthographicCamera>(null)
  const pass = useMemo(() => new WallShadowPass(resolution, scale), [resolution, scale])
  useEffect(() => () => pass.dispose(), [pass])

  // drei resets its frame counter on every render; resetting it when `frames`
  // changes is the part of that the caller relies on.
  const count = useRef(0)
  useLayoutEffect(() => {
    count.current = 0
  }, [frames])

  useFrame(({ gl, scene }) => {
    const group = ref.current
    const camera = shadowCamera.current
    if (!group || !camera || !(frames === Infinity || count.current < frames)) return
    count.current++
    pass.render(gl, scene, camera, group, blur)
  })

  const half = scale / 2
  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh geometry={pass.plane} scale={[1, -1, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial transparent map={pass.target.texture} opacity={opacity} depthWrite={false} />
      </mesh>
      <orthographicCamera ref={shadowCamera} args={[-half, half, half, -half, 0, far]} />
    </group>
  )
}
