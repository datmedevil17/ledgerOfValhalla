/**
 * FireCircle — OGL WebGL spreading fire (EvilEye shader pattern).
 * Uses a noise texture + polar-coordinate FBM to drive jagged animated
 * flame tongues that spread radially outward from the click point.
 */
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl'
import { useEffect, useRef } from 'react'

function makeNoise(size = 256): Uint8Array {
  const d = new Uint8Array(size * size * 4)
  function hash(x: number, y: number, s: number) {
    let n = x * 374761393 + y * 668265263 + s * 1274126177
    n = Math.imul(n ^ (n >>> 13), 1274126177)
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296
  }
  function noise(px: number, py: number, freq: number, seed: number) {
    const fx = (px / size) * freq, fy = (py / size) * freq
    const ix = Math.floor(fx), iy = Math.floor(fy)
    const tx = fx - ix, ty = fy - iy, w = freq | 0
    const v00 = hash(((ix%w)+w)%w,   ((iy%w)+w)%w,   seed)
    const v10 = hash((((ix+1)%w)+w)%w, ((iy%w)+w)%w,   seed)
    const v01 = hash(((ix%w)+w)%w,   (((iy+1)%w)+w)%w, seed)
    const v11 = hash((((ix+1)%w)+w)%w, (((iy+1)%w)+w)%w, seed)
    return v00*(1-tx)*(1-ty) + v10*tx*(1-ty) + v01*(1-tx)*ty + v11*tx*ty
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, amp = 0.5, tot = 0
    for (let o = 0; o < 7; o++) { const f=4*(1<<o); v+=amp*noise(x,y,f,o*17); tot+=amp; amp*=0.58 }
    const val = Math.round(Math.max(0, Math.min(1, v / tot)) * 255)
    const i = (y * size + x) * 4
    d[i] = val; d[i+1] = val; d[i+2] = val; d[i+3] = 255
  }
  return d
}

const vert = `attribute vec2 uv;attribute vec2 position;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0,1);}`

// Fragment: EvilEye-style polar noise driving a spreading fire ring
const frag = `
precision highp float;
uniform float uTime;
uniform float uProgress;   // 0→1 spread front
uniform vec3  uRes;
uniform sampler2D uNoise;

vec3 firePal(float t) {
  t = clamp(t,0.0,1.0);
  if(t<0.2) return mix(vec3(0.0), vec3(0.55,0.0,0.0), t*5.0);
  if(t<0.45) return mix(vec3(0.55,0.0,0.0), vec3(1.0,0.35,0.0), (t-0.2)*4.0);
  if(t<0.7) return mix(vec3(1.0,0.35,0.0), vec3(1.0,0.85,0.05), (t-0.45)*4.0);
  return mix(vec3(1.0,0.85,0.05), vec3(1.0,1.0,0.9), (t-0.7)*3.33);
}

void main(){
  vec2 uv = (gl_FragCoord.xy*2.0 - uRes.xy) / uRes.y;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float t = uTime;

  // Multi-octave polar noise — same technique as EvilEye iris
  float polarR = dist * 2.0;
  float polarA = (angle / 6.2832) * 0.3;
  vec2 pUv = vec2(polarR, polarA);

  vec4 nA = texture2D(uNoise, pUv * vec2(0.18,6.0) + vec2(-t*0.12, 0.0));
  vec4 nB = texture2D(uNoise, pUv * vec2(0.28,3.5) + vec2(-t*0.22, 0.1));
  vec4 nC = texture2D(uNoise, pUv * vec2(0.10,5.0) + vec2(-t*0.10, 0.05));

  // Expanding ring edge with noise displacement
  float spread = uProgress * 0.92;
  float disp = (nA.r - 0.5) * 0.20 + (nC.r - 0.5) * 0.10;
  float edgeDist = dist - (spread + disp);

  // Inner fire body
  float body = 1.0 - smoothstep(-0.14, 0.06, edgeDist);

  // Heat intensity — hottest at centre, noisy turbulence inside
  float turb = nB.r * 0.6 + nA.r * 0.4;
  float heat = (1.0 - dist / max(spread + 0.01, 0.01)) * turb * 1.8;
  heat = clamp(heat, 0.0, 1.0);

  // Outer halo glow
  float halo = exp(-max(edgeDist,0.0)*12.0) * 0.5;

  // Fade out as spread completes
  float fade = 1.0 - smoothstep(0.68, 1.0, uProgress);

  vec3 col = (firePal(heat) * body + vec3(1.0,0.4,0.0) * halo) * fade;
  float alpha = clamp(body + halo, 0.0, 1.0) * fade;

  gl_FragColor = vec4(col * alpha, alpha);
}
`

interface FireCircleProps { x: number; y: number; radius: number; duration?: number }

export function FireCircle({ x, y, radius, duration = 2400 }: FireCircleProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const size = radius * 2
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false })
    const gl = renderer.gl
    gl.clearColor(0,0,0,0); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const noiseTex = new Texture(gl, { image: makeNoise(256), width:256, height:256, generateMipmaps:false, flipY:false })
    ;(noiseTex as any).minFilter = gl.LINEAR; (noiseTex as any).magFilter = gl.LINEAR
    ;(noiseTex as any).wrapS = gl.REPEAT;    (noiseTex as any).wrapT = gl.REPEAT

    renderer.setSize(size, size)
    const program = new Program(gl, { vertex:vert, fragment:frag, uniforms:{
      uTime:{value:0}, uProgress:{value:0},
      uRes:{value:[size,size,1]}, uNoise:{value:noiseTex},
    }})
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
    el.appendChild(gl.canvas)
    const start = performance.now(); let raf: number
    function frame() {
      raf = requestAnimationFrame(frame)
      const e = performance.now() - start
      program.uniforms.uTime.value = e / 1000
      program.uniforms.uProgress.value = Math.min(e / duration, 1)
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); el.removeChild(gl.canvas); gl.getExtension('WEBGL_lose_context')?.loseContext() }
  }, [duration, radius])

  return <div ref={ref} style={{ position:'fixed', left:x-radius, top:y-radius, width:radius*2, height:radius*2, pointerEvents:'none', zIndex:40, borderRadius:'50%', overflow:'hidden' }} />
}
