// @ts-nocheck
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './LiquidEther.css'

export default function LiquidEther({
  mouseForce = 20, cursorSize = 100, isViscous = false, viscous = 30,
  iterationsViscous = 32, iterationsPoisson = 32, dt = 0.014, BFECC = true,
  resolution = 0.5, isBounce = false,
  colors = ['#5227FF', '#FF9FFC', '#B497CF'],
  style = {}, className = '',
  autoDemo = true, autoSpeed = 0.5, autoIntensity = 2.2,
  takeoverDuration = 0.25, autoResumeDelay = 1000, autoRampDuration = 0.6,
}) {
  const mountRef = useRef(null)
  const webglRef = useRef(null)
  const rafRef = useRef(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current

    function makePaletteTexture(stops) {
      const arr = stops.length === 1 ? [stops[0], stops[0]] : stops
      const data = new Uint8Array(arr.length * 4)
      arr.forEach((hex, i) => {
        const c = new THREE.Color(hex)
        data[i*4]   = Math.round(c.r*255)
        data[i*4+1] = Math.round(c.g*255)
        data[i*4+2] = Math.round(c.b*255)
        data[i*4+3] = 255
      })
      const tex = new THREE.DataTexture(data, arr.length, 1, THREE.RGBAFormat)
      tex.magFilter = tex.minFilter = THREE.LinearFilter
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
      tex.generateMipmaps = false; tex.needsUpdate = true
      return tex
    }
    const paletteTex = makePaletteTexture(colors)
    const bgVec4 = new THREE.Vector4(0,0,0,0)

    // ── Shaders ─────────────────────────────────────────────────────────────
    const face_vert = `attribute vec3 position;uniform vec2 px;uniform vec2 boundarySpace;varying vec2 uv;precision highp float;void main(){vec3 pos=position;vec2 scale=1.0-boundarySpace*2.0;pos.xy=pos.xy*scale;uv=vec2(0.5)+(pos.xy)*0.5;gl_Position=vec4(pos,1.0);}`
    const line_vert = `attribute vec3 position;uniform vec2 px;precision highp float;varying vec2 uv;void main(){vec3 pos=position;uv=0.5+pos.xy*0.5;vec2 n=sign(pos.xy);pos.xy=abs(pos.xy)-px*1.0;pos.xy*=n;gl_Position=vec4(pos,1.0);}`
    const mouse_vert = `precision highp float;attribute vec3 position;attribute vec2 uv;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 pos=position.xy*scale*2.0*px+center;vUv=uv;gl_Position=vec4(pos,0.0,1.0);}`
    const advection_frag = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform bool isBFECC;uniform vec2 fboSize;uniform vec2 px;varying vec2 uv;void main(){vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;if(!isBFECC){vec2 vel=texture2D(velocity,uv).xy;vec2 uv2=uv-vel*dt*ratio;gl_FragColor=vec4(texture2D(velocity,uv2).xy,0,0);}else{vec2 vel_old=texture2D(velocity,uv).xy;vec2 spot_old=uv-vel_old*dt*ratio;vec2 vel_new1=texture2D(velocity,spot_old).xy;vec2 spot_new2=spot_old+vel_new1*dt*ratio;vec2 error=spot_new2-uv;vec2 spot_new3=uv-error/2.0;vec2 vel_2=texture2D(velocity,spot_new3).xy;vec2 spot_old2=spot_new3-vel_2*dt*ratio;gl_FragColor=vec4(texture2D(velocity,spot_old2).xy,0,0);}}`
    const color_frag = `precision highp float;uniform sampler2D velocity;uniform sampler2D palette;uniform vec4 bgColor;varying vec2 uv;void main(){vec2 vel=texture2D(velocity,uv).xy;float lenv=clamp(length(vel),0.0,1.0);vec3 c=texture2D(palette,vec2(lenv,0.5)).rgb;gl_FragColor=vec4(mix(bgColor.rgb,c,lenv),mix(bgColor.a,1.0,lenv));}`
    const divergence_frag = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform vec2 px;varying vec2 uv;void main(){float x0=texture2D(velocity,uv-vec2(px.x,0)).x;float x1=texture2D(velocity,uv+vec2(px.x,0)).x;float y0=texture2D(velocity,uv-vec2(0,px.y)).y;float y1=texture2D(velocity,uv+vec2(0,px.y)).y;gl_FragColor=vec4((x1-x0+y1-y0)/2.0/dt);}`
    const externalForce_frag = `precision highp float;uniform vec2 force;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 circle=(vUv-0.5)*2.0;float d=1.0-min(length(circle),1.0);d*=d;gl_FragColor=vec4(force*d,0,1);}`
    const poisson_frag = `precision highp float;uniform sampler2D pressure;uniform sampler2D divergence;uniform vec2 px;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x*2,0)).r;float p1=texture2D(pressure,uv-vec2(px.x*2,0)).r;float p2=texture2D(pressure,uv+vec2(0,px.y*2)).r;float p3=texture2D(pressure,uv-vec2(0,px.y*2)).r;float div=texture2D(divergence,uv).r;gl_FragColor=vec4((p0+p1+p2+p3)/4.0-div);}`
    const pressure_frag = `precision highp float;uniform sampler2D pressure;uniform sampler2D velocity;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x,0)).r;float p1=texture2D(pressure,uv-vec2(px.x,0)).r;float p2=texture2D(pressure,uv+vec2(0,px.y)).r;float p3=texture2D(pressure,uv-vec2(0,px.y)).r;vec2 v=texture2D(velocity,uv).xy;gl_FragColor=vec4(v-vec2(p0-p1,p2-p3)*0.5*dt,0,1);}`
    const viscous_frag = `precision highp float;uniform sampler2D velocity;uniform sampler2D velocity_new;uniform float v;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){vec2 old=texture2D(velocity,uv).xy;vec2 n0=texture2D(velocity_new,uv+vec2(px.x*2,0)).xy;vec2 n1=texture2D(velocity_new,uv-vec2(px.x*2,0)).xy;vec2 n2=texture2D(velocity_new,uv+vec2(0,px.y*2)).xy;vec2 n3=texture2D(velocity_new,uv-vec2(0,px.y*2)).xy;vec2 nv=4.0*old+v*dt*(n0+n1+n2+n3);gl_FragColor=vec4(nv/(4.0*(1.0+v*dt)),0,0);}`

    // ── Common ───────────────────────────────────────────────────────────────
    const Common = {
      width:0, height:0, pixelRatio:1, renderer:null, clock:null,
      init(el) {
        this.pixelRatio = Math.min(window.devicePixelRatio||1, 2)
        this.resize(el)
        this.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
        this.renderer.autoClear = false
        this.renderer.setClearColor(0x000000, 0)
        this.renderer.setPixelRatio(this.pixelRatio)
        this.renderer.setSize(this.width, this.height)
        Object.assign(this.renderer.domElement.style, { width:'100%', height:'100%', display:'block' })
        this.clock = new THREE.Clock(); this.clock.start()
      },
      resize(el) {
        const r = (el||container).getBoundingClientRect()
        this.width  = Math.max(1, Math.floor(r.width))
        this.height = Math.max(1, Math.floor(r.height))
        this.renderer?.setSize(this.width, this.height, false)
      },
      update() { this.delta = this.clock.getDelta(); this.time = (this.time||0)+this.delta },
    }

    // ── Mouse ────────────────────────────────────────────────────────────────
    const Mouse = {
      coords: new THREE.Vector2(), coords_old: new THREE.Vector2(), diff: new THREE.Vector2(),
      isAutoActive: false, autoIntensity: 2, hasUserControl: false,
      takeoverActive: false, takeoverFrom: new THREE.Vector2(), takeoverTo: new THREE.Vector2(),
      takeoverStartTime: 0, takeoverDuration: 0.25,
      init(el) {
        this._mm = e => {
          const r = el.getBoundingClientRect()
          const inside = e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom
          if (!inside) return
          if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
            const nx=(e.clientX-r.left)/r.width, ny=(e.clientY-r.top)/r.height
            this.takeoverFrom.copy(this.coords)
            this.takeoverTo.set(nx*2-1,-(ny*2-1))
            this.takeoverStartTime = performance.now()
            this.takeoverActive = true; this.hasUserControl = true; this.isAutoActive = false
            return
          }
          const nx=(e.clientX-r.left)/r.width, ny=(e.clientY-r.top)/r.height
          this.coords.set(nx*2-1,-(ny*2-1))
          this.hasUserControl = true
        }
        window.addEventListener('mousemove', this._mm)
      },
      dispose() { window.removeEventListener('mousemove', this._mm) },
      setNorm(nx,ny) { this.coords.set(nx,ny) },
      update() {
        if (this.takeoverActive) {
          const t = (performance.now()-this.takeoverStartTime)/(this.takeoverDuration*1000)
          if (t>=1) { this.takeoverActive=false; this.coords.copy(this.takeoverTo); this.coords_old.copy(this.coords); this.diff.set(0,0) }
          else { const k=t*t*(3-2*t); this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo,k) }
        }
        this.diff.subVectors(this.coords, this.coords_old)
        this.coords_old.copy(this.coords)
        if (this.coords_old.x===0&&this.coords_old.y===0) this.diff.set(0,0)
        if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity)
      },
    }

    // ── FBO factory ──────────────────────────────────────────────────────────
    function makeFBO(w,h) {
      const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent)
      return new THREE.WebGLRenderTarget(w,h,{
        type: isIOS ? THREE.HalfFloatType : THREE.FloatType,
        depthBuffer:false, stencilBuffer:false,
        minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter,
        wrapS:THREE.ClampToEdgeWrapping, wrapT:THREE.ClampToEdgeWrapping,
      })
    }

    // ── ShaderPass ──────────────────────────────────────────────────────────
    class SP {
      constructor(vsrc, fsrc, uniforms, output) {
        this.scene = new THREE.Scene()
        this.camera = new THREE.Camera()
        this.mat = new THREE.RawShaderMaterial({ vertexShader:vsrc, fragmentShader:fsrc, uniforms })
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.mat)
        this.scene.add(this.mesh)
        this.output = output
      }
      render(out) {
        Common.renderer.setRenderTarget(out !== undefined ? out : this.output)
        Common.renderer.render(this.scene, this.camera)
        Common.renderer.setRenderTarget(null)
      }
    }

    // ── Simulation ───────────────────────────────────────────────────────────
    const w = Math.max(1, Math.round(resolution * Common.width))
    const h = Math.max(1, Math.round(resolution * Common.height))
    const cell = new THREE.Vector2(1/w, 1/h)
    const fboSz = new THREE.Vector2(w, h)

    const fbos = {}
    ;['v0','v1','vv0','vv1','div','p0','p1'].forEach(k => fbos[k] = makeFBO(w,h))

    // Advection
    const advUni = { boundarySpace:{value:cell}, px:{value:cell}, fboSize:{value:fboSz}, velocity:{value:fbos.v0.texture}, dt:{value:dt}, isBFECC:{value:BFECC} }
    const adv = new SP(face_vert, advection_frag, advUni, fbos.v1)
    // Boundary line
    const bGeo = new THREE.BufferGeometry()
    bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1,-1,0,-1,1,0,-1,1,0,1,1,0,1,1,0,1,-1,0,1,-1,0,-1,-1,0]),3))
    const bLine = new THREE.LineSegments(bGeo, new THREE.RawShaderMaterial({ vertexShader:line_vert, fragmentShader:advection_frag, uniforms:advUni }))
    adv.scene.add(bLine)

    // External force
    const forceUni = { px:{value:cell}, force:{value:new THREE.Vector2()}, center:{value:new THREE.Vector2()}, scale:{value:new THREE.Vector2(cursorSize,cursorSize)} }
    const forcePass = new SP(mouse_vert, externalForce_frag, forceUni, fbos.v1)
    forcePass.mat.blending = THREE.AdditiveBlending; forcePass.mat.depthWrite = false
    forcePass.scene.remove(forcePass.mesh)
    const mouseGeo = new THREE.PlaneGeometry(1,1)
    const mouseMesh = new THREE.Mesh(mouseGeo, forcePass.mat)
    forcePass.scene.add(mouseMesh)

    // Divergence
    const divUni = { boundarySpace:{value:cell}, velocity:{value:fbos.v1.texture}, px:{value:cell}, dt:{value:dt} }
    const divPass = new SP(face_vert, divergence_frag, divUni, fbos.div)

    // Poisson
    const poisUni = { boundarySpace:{value:cell}, pressure:{value:fbos.p0.texture}, divergence:{value:fbos.div.texture}, px:{value:cell} }
    const poisPass = new SP(face_vert, poisson_frag, poisUni, fbos.p1)

    // Pressure
    const presUni = { boundarySpace:{value:cell}, pressure:{value:fbos.p0.texture}, velocity:{value:fbos.v1.texture}, px:{value:cell}, dt:{value:dt} }
    const presPass = new SP(face_vert, pressure_frag, presUni, fbos.v0)

    // Output colour
    const outScene = new THREE.Scene(), outCam = new THREE.Camera()
    const outMat = new THREE.RawShaderMaterial({ vertexShader:face_vert, fragmentShader:color_frag, transparent:true, depthWrite:false,
      uniforms:{ velocity:{value:fbos.v0.texture}, boundarySpace:{value:new THREE.Vector2()}, palette:{value:paletteTex}, bgColor:{value:bgVec4} } })
    outScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), outMat))

    // ── Auto driver ──────────────────────────────────────────────────────────
    let autoCurrent = new THREE.Vector2(0,0), autoTarget = new THREE.Vector2()
    let autoActive = false, autoLastTime = performance.now(), autoActivationTime = 0
    let lastUserInteraction = performance.now()
    const margin = 0.2
    function pickTarget() { autoTarget.set((Math.random()*2-1)*(1-margin),(Math.random()*2-1)*(1-margin)) }
    pickTarget()

    function updateAuto() {
      if (!autoDemo) return
      const now = performance.now()
      if (now - lastUserInteraction < autoResumeDelay) { if(autoActive){autoActive=false;Mouse.isAutoActive=false}; return }
      if (!autoActive) { autoActive=true; autoCurrent.copy(Mouse.coords); autoLastTime=now; autoActivationTime=now }
      Mouse.isAutoActive = true
      let dtSec = Math.min((now-autoLastTime)/1000, 0.2); autoLastTime=now
      const dir = new THREE.Vector2().subVectors(autoTarget, autoCurrent)
      const dist = dir.length()
      if (dist < 0.01) { pickTarget(); return }
      dir.normalize()
      let ramp = 1
      if (autoRampDuration > 0) { const t=Math.min(1,(now-autoActivationTime)/(autoRampDuration*1000)); ramp=t*t*(3-2*t) }
      autoCurrent.addScaledVector(dir, Math.min(autoSpeed*dtSec*ramp, dist))
      Mouse.setNorm(autoCurrent.x, autoCurrent.y)
    }

    // ── Render loop ──────────────────────────────────────────────────────────
    let raf
    function loop() {
      raf = requestAnimationFrame(loop)
      updateAuto()
      Mouse.update()
      Common.update()

      // Advection
      advUni.dt.value = dt; advUni.isBFECC.value = BFECC; bLine.visible = isBounce
      adv.render()

      // Force
      const fx = (Mouse.diff.x/2)*mouseForce, fy = (Mouse.diff.y/2)*mouseForce
      const csx = cursorSize*cell.x, csy = cursorSize*cell.y
      forceUni.force.value.set(fx,fy)
      forceUni.center.value.set(Math.min(Math.max(Mouse.coords.x,-1+csx+cell.x*2),1-csx-cell.x*2), Math.min(Math.max(Mouse.coords.y,-1+csy+cell.y*2),1-csy-cell.y*2))
      forceUni.scale.value.set(cursorSize,cursorSize)
      forcePass.render(fbos.v1)

      // Divergence
      divUni.velocity.value = fbos.v1.texture; divPass.render()

      // Poisson
      let p_in=fbos.p0, p_out=fbos.p1
      for (let i=0;i<iterationsPoisson;i++) {
        poisUni.pressure.value = p_in.texture; poisPass.render(p_out)
        ;[p_in,p_out]=[p_out,p_in]
      }

      // Pressure
      presUni.velocity.value = fbos.v1.texture; presUni.pressure.value = p_in.texture; presPass.render()

      // Output
      Common.renderer.setRenderTarget(null)
      Common.renderer.render(outScene, outCam)
    }

    Common.init(container)
    Mouse.init(container)
    container.prepend(Common.renderer.domElement)
    raf = requestAnimationFrame(loop)
    webglRef.current = { dispose() {
      cancelAnimationFrame(raf)
      Mouse.dispose()
      Common.renderer.dispose()
      Common.renderer.forceContextLoss()
      Common.renderer.domElement.parentNode?.removeChild(Common.renderer.domElement)
    }}

    return () => { webglRef.current?.dispose(); webglRef.current = null }
  }, []) // mount once — props are captured via closure on initial render

  return <div ref={mountRef} className={`liquid-ether-container ${className}`} style={style} />
}
