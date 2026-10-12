import * as THREE from 'three';
// "The Den": a lone figure in a lit hall, 54 agents in orbit. One-bit ink dither, gold for the agents.
export function createDen(canvas, { width, height, pixel = 2, look = [-2.4, 2.35, 0] }) {
  const W = Math.round(width / pixel), H = Math.round(height / pixel);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; canvas.style.imageRendering = 'pixelated';
  const rtMain = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const rtAcc = new THREE.WebGLRenderTarget(W, H);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000); scene.fog = new THREE.FogExp2(0x000000, 0.045);
  const acc = new THREE.Scene(); acc.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 200);
  const base = new THREE.Vector3(0, 2.7, 14.5), target = new THREE.Vector3(...look);
  camera.position.copy(base); camera.lookAt(target);
  const stone = new THREE.MeshStandardMaterial({ color: 0xb3ad9f, roughness: 0.85 });
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const occl = (m) => { const c = new THREE.Mesh(m.geometry, black); c.position.copy(m.position); c.rotation.copy(m.rotation); c.scale.copy(m.scale); acc.add(c); return c; };
  // floor with carved rings
  const fc = document.createElement('canvas'); fc.width = fc.height = 2048; const g = fc.getContext('2d');
  g.fillStyle = '#070706'; g.fillRect(0, 0, 2048, 2048); g.strokeStyle = '#38352f';
  for (let r = 60; r < 1024; r += 52) { g.lineWidth = r % 156 === 8 ? 5 : 2; g.beginPath(); g.arc(1024, 1024, r, 0, Math.PI * 2); g.stroke(); }
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; g.lineWidth = 2; g.beginPath(); g.moveTo(1024 + Math.cos(a) * 160, 1024 + Math.sin(a) * 160); g.lineTo(1024 + Math.cos(a) * 1000, 1024 + Math.sin(a) * 1000); g.stroke(); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(fc), roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // plinth
  for (const [r1, r2, h, y] of [[2.5, 2.7, 0.22, 0.11], [1.75, 1.95, 0.42, 0.43]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 72), stone); m.position.y = y; scene.add(m); occl(m); }
  // the figure, back to us, hands clasped behind
  const fig = new THREE.Group(); fig.position.y = 0.64; scene.add(fig);
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 0.95 }), skin = new THREE.MeshStandardMaterial({ color: 0xc9b496, roughness: 0.7 }), hairMat = new THREE.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.6 });
  const prof = [[0, 0], [0.64, 0], [0.6, 0.1], [0.5, 0.62], [0.41, 1.12], [0.35, 1.34], [0.4, 1.56], [0.51, 1.73], [0.46, 1.84], [0.25, 1.92], [0.12, 1.97], [0, 1.98]].map(([x, y]) => new THREE.Vector2(x, y));
  const parts = [];
  const robe = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), robeMat); parts.push(robe);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.028, 10, 48), hairMat); collar.rotation.x = Math.PI / 2; collar.position.y = 1.9; parts.push(collar);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 24), skin); head.position.y = 2.15; parts.push(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.198, 32, 24), hairMat); hair.scale.set(1, 0.92, 1); hair.position.set(0, 2.18, 0.025); parts.push(hair);
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.5, 6, 12), robeMat); a.position.set(s * 0.27, 1.43, 0.2); a.rotation.set(0.5, 0, s * 0.62); parts.push(a); }
  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), skin); hands.position.set(0, 1.17, 0.36); parts.push(hands);
  for (const p of parts) { fig.add(p); }
  const figOcc = fig.clone(true); figOcc.traverse((o) => { if (o.isMesh) o.material = black; }); acc.add(figOcc);
  // columns in an arc behind him
  for (let i = 0; i < 11; i++) {
    const a = -1.25 + (i / 10) * 2.5, R = 10.5 + Math.abs(a) * 1.4; const x = Math.sin(a) * R, z = -Math.cos(a) * R + 1;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.66, 13, 28), stone); col.position.set(x, 6.5, z); scene.add(col); occl(col);
    for (const y of [0.2, 12.9]) { const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 1.7), stone); cap.position.set(x, y, z); scene.add(cap); }
  }
  // light from above
  const arch = new THREE.Shape(); const aw = 1.9, ah = 6.2; arch.moveTo(-aw, 0); arch.lineTo(-aw, ah); arch.absarc(0, ah, aw, Math.PI, 0, true); arch.lineTo(aw, 0); arch.lineTo(-aw, 0);
  const portal = new THREE.Mesh(new THREE.ShapeGeometry(arch, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); portal.position.set(0, 0, -8.5); portal.scale.setScalar(1.15); scene.add(portal);
  const frameShape = new THREE.Shape(); const fw = aw + 0.45, fh = ah; frameShape.moveTo(-fw, 0); frameShape.lineTo(-fw, fh); frameShape.absarc(0, fh, fw, Math.PI, 0, true); frameShape.lineTo(fw, 0); frameShape.lineTo(-fw, 0); frameShape.holes.push(arch);
  const archFrame = new THREE.Mesh(new THREE.ShapeGeometry(frameShape, 48), new THREE.MeshStandardMaterial({ color: 0x9a9488, roughness: 0.8 })); archFrame.position.set(0, 0, -8.45); archFrame.scale.setScalar(1.15); scene.add(archFrame);
  const archLight = new THREE.PointLight(0xffffff, 40, 0, 1.4); archLight.position.set(0, 4, -7.2); scene.add(archLight);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: 0x0d0c0b, roughness: 0.98 })); wall.position.set(0, 15, -8.6); scene.add(wall);
  const spill = document.createElement('canvas'); spill.width = 512; spill.height = 1024; const sg = spill.getContext('2d'); const gr = sg.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); sg.fillStyle = gr; sg.beginPath(); sg.moveTo(170, 0); sg.lineTo(342, 0); sg.lineTo(512, 1024); sg.lineTo(0, 1024); sg.closePath(); sg.fill();
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 13), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(spill), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -2.2); scene.add(pool);
  const rimL = new THREE.DirectionalLight(0xffffff, 3.2); rimL.position.set(0, 5, -9); rimL.target = fig; scene.add(rimL);
  const front = new THREE.DirectionalLight(0xfff1dc, 0.22); front.position.set(-6, 6, 12); scene.add(front);
  scene.add(new THREE.HemisphereLight(0x4a4642, 0x0a0908, 0.12));
  const side = new THREE.DirectionalLight(0xffffff, 0.5); side.position.set(10, 8, 4); scene.add(side);
  // 54 agents in three rings
  const agents = []; const agGeo = new THREE.OctahedronGeometry(1, 0); const agMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 }); const agAcc = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const rings = [{ n: 18, r: 2.75, y: 1.15, tilt: 0.12, sp: 1 }, { n: 20, r: 3.75, y: 1.95, tilt: -0.2, sp: -1 }, { n: 16, r: 4.9, y: 2.7, tilt: 0.3, sp: 1 }];
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const ring of rings) for (let k = 0; k < ring.n; k++) {
    const s = 0.06 + rnd() * 0.05; const m = new THREE.Mesh(agGeo, agMat); m.scale.setScalar(s); scene.add(m); const c = new THREE.Mesh(agGeo, agAcc); c.scale.setScalar(s); acc.add(c);
    agents.push({ m, c, ring, a0: (k / ring.n) * Math.PI * 2 + rnd() * 0.15, bob: rnd() * Math.PI * 2, bk: 1 + Math.floor(rnd() * 2), spin: rnd() * Math.PI });
  }
  // dust in the light
  const N = 260, dp = new Float32Array(N * 3), dseed = []; for (let i = 0; i < N; i++) { const r = Math.sqrt(rnd()) * 3.2, a = rnd() * Math.PI * 2; dseed.push([Math.cos(a) * r, rnd(), Math.sin(a) * r - 3]); }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.9, fog: false })));
  // ink dither
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { tMain: { value: rtMain.texture }, tAcc: { value: rtAcc.texture }, ink: { value: new THREE.Color(0x0b0a09) }, bone: { value: new THREE.Color(0xece4d2) }, gold: { value: new THREE.Color(0xeccb84) }, exposure: { value: 1.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tMain; uniform sampler2D tAcc; uniform vec3 ink; uniform vec3 bone; uniform vec3 gold; uniform float exposure; varying vec2 vUv;
      float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
      float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
      float b8(vec2 a){ return b4(0.5 * a) * 0.25 + b2(a); }
      void main(){ vec3 c = texture2D(tMain, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); l = 1.0 - exp(-l * exposure); l = clamp((l - 0.07) / 0.93, 0.0, 1.0); l = pow(l, 0.72);
        float t = b8(gl_FragCoord.xy); vec3 col = l > t ? bone : ink; float a = texture2D(tAcc, vUv).r; if (a > 0.5) col = gold; gl_FragColor = vec4(col, 1.0); }`,
    depthTest: false, depthWrite: false }));
  const qs = new THREE.Scene(); qs.add(quad); const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let px = 0, py = 0;
  function frame(u, opts = {}) {
    for (const ag of agents) { const { ring } = ag; const th = ag.a0 + u * Math.PI * 2 * ring.sp; const x = Math.cos(th) * ring.r, z = Math.sin(th) * ring.r; const y = ring.y + Math.sin(th) * ring.r * ring.tilt * 0.35 + Math.sin(u * Math.PI * 2 * ag.bk + ag.bob) * 0.12;
      for (const o of [ag.m, ag.c]) { o.position.set(x, y, z); o.rotation.set(ag.spin + u * Math.PI * 2, ag.spin * 2 + u * Math.PI * 4, 0); } }
    for (let i = 0; i < N; i++) { const [x, s, z] = dseed[i]; dp[3 * i] = x; dp[3 * i + 1] = 0.3 + ((s - u + 1) % 1) * 8; dp[3 * i + 2] = z; } dgeo.attributes.position.needsUpdate = true;
    if (opts.parallax) { px += (opts.parallax[0] - px) * 0.05; py += (opts.parallax[1] - py) * 0.05; camera.position.set(base.x + px * 1.6, base.y + py * 0.6, base.z); camera.lookAt(target); }
    renderer.setRenderTarget(rtMain); renderer.render(scene, camera); renderer.setRenderTarget(rtAcc); renderer.render(acc, camera); renderer.setRenderTarget(null); renderer.render(qs, qc);
  }
  return { frame, resize(w, h) { renderer.setSize(Math.round(w / pixel), Math.round(h / pixel), false); rtMain.setSize(Math.round(w / pixel), Math.round(h / pixel)); rtAcc.setSize(Math.round(w / pixel), Math.round(h / pixel)); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; camera.aspect = w / h; camera.updateProjectionMatrix(); } };
}
