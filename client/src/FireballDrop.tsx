/**
 * FireballDrop — OGL WebGL two-phase fire using the EvilEye shader pattern.
 * Phase 1 (0→0.38): animated fire orb (polar noise iris) falls from above.
 * Phase 2 (0.38→1): radial explosion with EvilEye-style noise fire spreads outward.
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
    const fx = (px/size)*freq, fy = (py/size)*freq
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx-ix, ty = fy-iy, w = freq|0
    const v00=hash(((ix%w)+w)%w,((iy%w)+w)%w,seed), v10=hash((((ix+1)%w)+w)%w,((iy%w)+w)%w,seed)
    const v01=hash(((ix%w)+w)%w,(((iy+1)%w)+w)%w,seed), v11=hash((((ix+1)%w)+w)%w,(((iy+1)%w)+w)%w,seed)
    return v00*(1-tx)*(1-ty)+v10*tx*(1-ty)+v01*(1-tx)*ty+v11*tx*ty
  }
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    let v=0,amp=0.5,tot=0
    for(let o=0;o<7;o++){const f=4*(1<<o);v+=amp*noise(x,y,f,o*23);tot+=amp;amp*=0.58}
    const val=Math.round(Math.max(0,Math.min(1,v/tot))*255), i=(y*size+x)*4
    d[i]=val;d[i+1]=val;d[i+2]=val;d[i+3]=255
  }
  return d
}

const vert = `attribute vec2 uv;attribute vec2 position;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0,1);}`

// EvilEye-style: polar noise for the orb surface + spreading explosion
const frag = `
precision highp float;
uniform float uTime;
uniform float uPhase;    // 0→1 overall
uniform vec3  uRes;
uniform sampler2D uNoise;

vec3 firePal(float t) {
  t = clamp(t, 0.0, 1.0);
  if(t < 0.2)  return mix(vec3(0.0),            vec3(0.6,0.0,0.0),    t*5.0);
  if(t < 0.45) return mix(vec3(0.6,0.0,0.0),   vec3(1.0,0.38,0.0),  (t-0.2)*4.0);
  if(t < 0.7)  return mix(vec3(1.0,0.38,0.0),  vec3(1.0,0.88,0.05), (t-0.45)*4.0);
  return         mix(vec3(1.0,0.88,0.05), vec3(1.0,1.0,0.95),         (t-0.7)*3.33);
}

void main(){
  vec2 uv = (gl_FragCoord.xy*2.0 - uRes.xy) / uRes.y;
  float t = uTime;

  float p1 = clamp(uPhase / 0.38, 0.0, 1.0);         // orb fall progress
  float p2 = clamp((uPhase - 0.38) / 0.62, 0.0, 1.0); // explosion progress

  // ── PHASE 1: fire orb falling (EvilEye iris pattern) ──────────────────────
  float orbY = mix(0.82, 0.0, p1);        // falls from top to centre
  vec2 orbUv = uv - vec2(0.0, orbY);
  float orbDist = length(orbUv);
  float orbAngle = atan(orbUv.y, orbUv.x);

  // EvilEye polar noise for orb surface turbulence
  float pR = orbDist * 2.0;
  float pA = (orbAngle / 6.2832) * 0.3;
  vec2 pUv = vec2(pR, pA);
  vec4 nA = texture2D(uNoise, pUv * vec2(0.20, 7.0) + vec2(-t*0.10, 0.0));
  vec4 nB = texture2D(uNoise, pUv * vec2(0.30, 4.0) + vec2(-t*0.20, 0.0));
  vec4 nC = texture2D(uNoise, pUv * vec2(0.10, 5.0) + vec2(-t*0.10, 0.0));

  // Orb shape — EvilEye inner ring approach
  float dMask = 1.0 - orbDist * 9.0;
  float innerRing = clamp(-1.0*((dMask - 0.7)/0.25), 0.0, 1.0);
  innerRing = (innerRing*dMask - 0.2)/0.28 + nA.r - 0.5;
  innerRing = clamp(innerRing*1.3, 0.0, 1.0);
  float innerEye = clamp(dMask - 0.1*2.0, 0.0, 1.0) * nB.r * 2.0;
  float orbGlow = exp(-orbDist*8.0)*0.6;

  float orbAlpha = (1.0 - p2*p2);
  vec3 orbCol = firePal(clamp(innerRing + innerEye, 0.0, 1.0)) * orbAlpha;
  orbCol += firePal(0.5) * orbGlow * orbAlpha;

  // Fire tail trailing upward from orb
  vec2 tailUv = uv - vec2(0.0, orbY + 0.08);
  float tail = exp(-length(tailUv*vec2(18.0,3.0))*1.0) * (1.0-p1*0.5) * (1.0-p2);
  orbCol += firePal(0.6) * tail;

  // ── PHASE 2: explosion (polar noise, same EvilEye pattern) ────────────────
  float exDist = length(uv);
  float exAngle = atan(uv.y, uv.x);
  float exR = exDist * 2.0;
  float exA = (exAngle / 6.2832) * 0.3;
  vec2 exUv = vec2(exR, exA);

  vec4 eA = texture2D(uNoise, exUv * vec2(0.18,6.5) + vec2(-t*0.14, 0.0));
  vec4 eB = texture2D(uNoise, exUv * vec2(0.28,3.8) + vec2(-t*0.24, 0.0));
  vec4 eC = texture2D(uNoise, exUv * vec2(0.10,5.2) + vec2(-t*0.11, 0.05));

  float spread = p2 * 0.88;
  float disp = (eA.r-0.5)*0.18 + (eC.r-0.5)*0.09;
  float exEdge = exDist - (spread + disp);
  float exBody = 1.0 - smoothstep(-0.12, 0.07, exEdge);
  float turb = eB.r*0.55 + eA.r*0.45;
  float heat = (1.0 - exDist/max(spread+0.01,0.01)) * turb * 1.9;
  float exHalo = exp(-max(exEdge,0.0)*10.0)*0.55;
  float exFade = 1.0 - smoothstep(0.6, 1.0, p2);

  vec3 exCol = (firePal(clamp(heat,0.0,1.0))*exBody + firePal(0.5)*exHalo) * p2 * exFade;

  // Combine
  vec3 col = orbCol + exCol;
  float alpha = clamp(max(length(orbCol), length(exCol)), 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha);
}
`

interface FireballDropProps { x: number; y: number; radius: number; duration?: number }

export function FireballDrop({ x, y, radius, duration = 2200 }: FireballDropProps) {
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
      uTime:{value:0}, uPhase:{value:0},
      uRes:{value:[size,size,1]}, uNoise:{value:noiseTex},
    }})
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
    el.appendChild(gl.canvas)
    const start = performance.now(); let raf: number
    function frame() {
      raf = requestAnimationFrame(frame)
      const elapsed = performance.now() - start
      program.uniforms.uTime.value  = elapsed / 1000
      program.uniforms.uPhase.value = Math.min(elapsed / duration, 1)
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); el.removeChild(gl.canvas); gl.getExtension('WEBGL_lose_context')?.loseContext() }
  }, [duration, radius])

  return <div ref={ref} style={{ position:'fixed', left:x-radius, top:y-radius, width:radius*2, height:radius*2, pointerEvents:'none', zIndex:40, borderRadius:'50%', overflow:'hidden' }} />
}
