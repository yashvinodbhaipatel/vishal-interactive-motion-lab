const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
let selectedScene = 'form';
let finish = 'chrome';
let expanded = false;
let controllers = [];
let dirty = true;
let toastTimer;
const finishes = { chrome: { color: 0xd8dfdb, roughness: .16, metalness: 1, label: 'Chrome' }, orange: { color: 0xfa5429, roughness: .22, metalness: .55, label: 'Ember' }, green: { color: 0x9eb28f, roughness: .28, metalness: .7, label: 'Sage' } };
const content = {
  form: { title: 'A form.<br>Infinite angles.', description: 'A fluid chrome sculpture that responds to your curiosity. Rotate it, change its finish, and pull the composition apart.', tag: 'BRAND EXPERIENCE', label: 'EXPERIMENT 01 / FORM STUDY', action: 'Pull it apart', active: 'Bring it together', tech: 'PROCEDURAL GEOMETRY', accessible: 'Interactive sculpture' },
  fintech: { title: 'A different<br>kind of currency.', description: 'A tactile card concept for a digital-first world. Explore the finish, turn it over, and discover the details. Illustrative product, no real account.', tag: 'FINTECH EXPLORATION', label: 'EXPERIMENT 02 / DIGITAL FINANCE', action: 'Flip the card', active: 'See the front', tech: 'DYNAMIC CANVAS TEXTURE', accessible: 'Interactive concept payment card' },
  luxury: { title: 'Desire, in<br>every dimension.', description: 'A fragrance concept with a sculptural silhouette. Choose a finish, turn it in the light, and reveal what’s beneath the cap.', tag: 'LUXURY COMMERCE', label: 'EXPERIMENT 03 / OBJECT STUDY', action: 'Reveal the detail', active: 'Close the bottle', tech: 'PROCEDURAL PRODUCT MODEL', accessible: 'Interactive concept fragrance bottle' }
};
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2300); }
function updateMotion() { document.body.classList.toggle('motion-paused', paused); document.body.classList.toggle('reduced-motion', reduced.matches); $('#motion-toggle').innerHTML = paused ? '<span>▷</span> Resume motion' : '<span>Ⅱ</span> Pause motion'; $('#motion-toggle').setAttribute('aria-pressed', String(paused)); $('#fps-value').textContent = paused ? '—' : $('#fps-value').textContent; dirty = true; }
$('#motion-toggle').addEventListener('click', () => { paused = !paused; updateMotion(); });
reduced.addEventListener('change', () => { paused = reduced.matches; updateMotion(); updateStory(); });
updateMotion();
function setScene(name) {
  selectedScene = name; expanded = false;
  const data = content[name];
  $$('.experiment-tabs button').forEach(button => { const active = button.dataset.scene === name; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
  $('#experiment-panel').setAttribute('aria-labelledby', `tab-${name}`);
  $('#scene-title').innerHTML = data.title; $('#scene-description').textContent = data.description;
  $('#scene-tag').textContent = data.tag; $('#stage-label').textContent = data.label; $('#scene-tech').textContent = data.tech;
  $('#scene-action').innerHTML = `${data.action} <span>↗</span>`;
  $('#experiment-stage').setAttribute('aria-label', `${data.accessible}. Drag or use arrow keys to rotate. Press R to reset.`);
  controllers[1]?.select(name); dirty = true;
}
$$('.experiment-tabs button').forEach((button, index, buttons) => {
  button.addEventListener('click', () => setScene(button.dataset.scene));
  button.addEventListener('keydown', event => { let next; if (event.key === 'ArrowRight') next = (index + 1) % 3; if (event.key === 'ArrowLeft') next = (index + 2) % 3; if (event.key === 'Home') next = 0; if (event.key === 'End') next = 2; if (next !== undefined) { event.preventDefault(); buttons[next].focus(); setScene(buttons[next].dataset.scene); } });
});
$$('[data-finish]').forEach(button => button.addEventListener('click', () => { finish = button.dataset.finish; $$('[data-finish]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }); $('#finish-label').textContent = finishes[finish].label; controllers[1]?.setFinish(finish); dirty = true; }));
$$('[data-hero-finish]').forEach(button => button.addEventListener('click', () => { $$('[data-hero-finish]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); }); controllers[0]?.setFinish(button.dataset.heroFinish); dirty = true; }));
$('#scene-action').addEventListener('click', () => { if (!controllers.length) { notify('3D is unavailable on this device. You can still explore the page.'); return; } expanded = !expanded; $('#scene-action').innerHTML = `${expanded ? content[selectedScene].active : content[selectedScene].action} <span>${expanded ? '↙' : '↗'}</span>`; dirty = true; });
$('#reset-scene').addEventListener('click', () => { controllers[1]?.reset(); expanded = false; $('#scene-action').innerHTML = `${content[selectedScene].action} <span>↗</span>`; dirty = true; notify('View reset. Explore another angle.'); });
$$('details').forEach(detail => detail.addEventListener('toggle', () => { detail.querySelector('summary span:last-child').textContent = detail.open ? '−' : '+'; }));
let scrollScheduled = false;
function updateStory() {
  scrollScheduled = false;
  const section = $('#scroll-story'); const bounds = section.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - innerHeight)));
  $('#story-percent').textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
  $('#story-progress').style.width = `${progress * 100}%`;
  if (!paused && !reduced.matches) $('.story-orbit').style.setProperty('--orbit-rotation', `${progress * 150}deg`);
  const index = Math.min(2, Math.floor(progress * 3));
  $('#story-word').textContent = ['Move.', 'Connect.', 'Remember.'][index];
  $('#story-caption').textContent = ['An invitation to explore.', 'A response that feels natural.', 'A moment that stays with you.'][index];
  dirty = true;
}
addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateStory); } }, { passive: true });
updateStory();

// Three.js is pinned. UI, navigation and the CSS sculpture remain usable if it cannot load.
async function boot() {
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js');
    const { Group, Mesh, MeshStandardMaterial, MeshPhysicalMaterial, TorusGeometry, SphereGeometry, BoxGeometry, CylinderGeometry, CanvasTexture, Vector3 } = THREE;
    function environment(renderer) {
      const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
      const ctx = canvas.getContext('2d'); const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#aab2a8'); gradient.addColorStop(.42, '#5b6357'); gradient.addColorStop(.49, '#151b16'); gradient.addColorStop(.6, '#a6aea3'); gradient.addColorStop(1, '#30362e');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(80, 35, 85, 365); ctx.fillRect(480, 80, 190, 220); ctx.fillStyle = '#e6e9d7'; ctx.fillRect(850, 140, 35, 270); ctx.fillStyle = '#fa5429'; ctx.fillRect(740, 220, 40, 250);
      const texture = new CanvasTexture(canvas); texture.mapping = THREE.EquirectangularReflectionMapping; texture.colorSpace = THREE.SRGBColorSpace;
      const generator = new THREE.PMREMGenerator(renderer); const target = generator.fromEquirectangular(texture); texture.dispose(); generator.dispose(); return target;
    }
    function sculpture() {
      const group = new Group(); const parts = []; const material = new MeshPhysicalMaterial({ color: finishes.chrome.color, roughness: finishes.chrome.roughness, metalness: 1, clearcoat: 1, clearcoatRoughness: .12 });
      const geometry = new TorusGeometry(1.5, .38, 24, 100);
      for (let i = 0; i < 3; i++) {
        const ring = new Mesh(geometry, material); ring.rotation.set(Math.PI / 2.5, i * Math.PI / 3, i * Math.PI / 3); ring.userData.origin = new Vector3(Math.cos(i * Math.PI * 2 / 3) * .26, Math.sin(i * Math.PI * 2 / 3) * .26, 0); ring.position.copy(ring.userData.origin); group.add(ring); parts.push(ring);
      }
      const core = new Mesh(new SphereGeometry(.44, 24, 16), new MeshStandardMaterial({ color: 0xfa5429, metalness: .6, roughness: .18 })); group.add(core);
      const halo = new Mesh(new TorusGeometry(2.55, .012, 6, 120), new MeshStandardMaterial({ color: 0xfa5429, roughness: .7 })); halo.rotation.set(.9, .4, .1); group.add(halo);
      return { group, material, update(time, amount) { parts.forEach((part, index) => { const theta = index * Math.PI * 2 / 3; part.position.set(part.userData.origin.x + Math.cos(theta) * amount * 1.4, part.userData.origin.y + Math.sin(theta) * amount * 1.4, (index - 1) * amount * .6); }); halo.rotation.z = time * .06; } };
    }
    function roundedShape(w, h, r) {
      const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    function canvasTexture(width, height, paint) { const c = document.createElement('canvas'); c.width = width; c.height = height; paint(c.getContext('2d')); const t = new CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
    function fintech() {
      const group = new Group(); const pivot = new Group(); group.add(pivot);
      const material = new MeshStandardMaterial({ color: 0xc6cebd, roughness: .24, metalness: .95 });
      const shape = roundedShape(3.7, 2.3, .16); const geometry = new THREE.ExtrudeGeometry(shape, { depth: .07, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, steps: 1 });
      pivot.add(new Mesh(geometry, material));
      const front = canvasTexture(1024, 640, ctx => {
        const g = ctx.createLinearGradient(0, 0, 1024, 640); g.addColorStop(0, '#282e27'); g.addColorStop(1, '#080d09'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 640);
        ctx.strokeStyle = '#58614d'; ctx.lineWidth = 1; for (let i = 0; i < 19; i++) { ctx.beginPath(); ctx.ellipse(850, 350, 120 + i * 21, 140 + i * 14, -.6, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#faf8e7'; ctx.font = '500 64px Arial'; ctx.fillText('flow', 75, 110); ctx.font = '18px Arial'; ctx.fillStyle = '#a8b294'; ctx.fillText('A NEW WAY FORWARD', 75, 150); ctx.fillStyle = '#e9e9d7'; ctx.font = '24px monospace'; ctx.fillText('••••  ••••  ••••  0088', 75, 457); ctx.font = '19px Arial'; ctx.fillText('CONCEPT CARD', 75, 535);
        ctx.fillStyle = '#fa5429'; ctx.beginPath(); ctx.arc(855, 510, 43, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e5e7da'; ctx.beginPath(); ctx.arc(907, 510, 43, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b6ae89'; ctx.fillRect(78, 245, 109, 79); ctx.strokeStyle = '#565a49'; for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(78, 245 + i * 26); ctx.lineTo(187, 245 + i * 26); ctx.stroke(); } ctx.strokeRect(111, 245, 43, 79);
      });
      const frontMesh = new Mesh(new THREE.ShapeGeometry(shape), new MeshStandardMaterial({ map: front, metalness: .35, roughness: .45 }));
      // ShapeGeometry uses world coordinates for UVs; normalize them to the card bounds.
      function normalizeUV(mesh) { const positions = mesh.geometry.attributes.position; const uvs = mesh.geometry.attributes.uv; for (let i = 0; i < positions.count; i++) uvs.setXY(i, (positions.getX(i) + 1.85) / 3.7, (positions.getY(i) + 1.15) / 2.3); }
      normalizeUV(frontMesh); frontMesh.position.z = .101; pivot.add(frontMesh);
      const back = canvasTexture(1024, 640, ctx => { ctx.fillStyle = '#1d241b'; ctx.fillRect(0, 0, 1024, 640); ctx.fillStyle = '#070a07'; ctx.fillRect(0, 95, 1024, 120); ctx.fillStyle = '#eeeedd'; ctx.fillRect(75, 290, 690, 65); ctx.fillStyle = '#394130'; ctx.font = '20px monospace'; ctx.fillText('DESIGNED TO MOVE WITH YOU', 95, 331); ctx.fillStyle = '#a6af96'; ctx.font = '19px Arial'; ctx.fillText('An illustrative finance experience. No real account.', 75, 490); ctx.fillStyle = '#fa5429'; ctx.font = '52px Arial'; ctx.fillText('flow ↗', 75, 580); });
      const backMesh = new Mesh(new THREE.ShapeGeometry(shape), new MeshStandardMaterial({ map: back, metalness: .2, roughness: .5 })); normalizeUV(backMesh); backMesh.rotation.y = Math.PI; backMesh.position.z = -.03; pivot.add(backMesh);
      const coins = []; for (let i = 0; i < 3; i++) { const coin = new Mesh(new CylinderGeometry(.43, .43, .09, 40), new MeshStandardMaterial({ color: i === 1 ? 0xfa5429 : 0xcbd1c4, metalness: .95, roughness: .22 })); coin.rotation.x = Math.PI / 2; coin.position.set((i - 1) * 1.6, i % 2 ? 1.8 : -1.6, -.5); group.add(coin); coins.push(coin); }
      return { group, material, setFinish(value) { frontMesh.material.color.set(value === 'orange' ? 0xff8a54 : value === 'green' ? 0xb4dca0 : 0xffffff); backMesh.material.color.copy(frontMesh.material.color); }, update(time, amount) { pivot.rotation.y = amount * Math.PI; coins.forEach((coin, i) => { coin.rotation.z = time * .1 + i; coin.position.y = (i % 2 ? 1.8 : -1.6) + Math.sin(time + i) * .12; }); } };
    }
    function luxury() {
      const group = new Group(); const material = new MeshPhysicalMaterial({ color: 0xc8d1c0, metalness: .55, roughness: .12, clearcoat: 1, clearcoatRoughness: .08 });
      const body = new Mesh(new THREE.ExtrudeGeometry(roundedShape(1.85, 2.2, .2), { depth: .8, bevelEnabled: true, bevelThickness: .12, bevelSize: .12, bevelSegments: 4, steps: 1 }), material); body.position.set(0, -.3, -.4); group.add(body);
      const base = new Mesh(new BoxGeometry(1.65, .12, .76), new MeshStandardMaterial({ color: 0xbac3b4, metalness: .95, roughness: .15 })); base.position.y = -1.36; group.add(base);
      const neck = new Mesh(new CylinderGeometry(.27, .27, .55, 32), new MeshStandardMaterial({ color: 0xd1c29b, metalness: 1, roughness: .22 })); neck.position.y = 1; group.add(neck);
      const cap = new Mesh(new CylinderGeometry(.59, .59, .7, 48), new MeshStandardMaterial({ color: 0x171b15, metalness: .8, roughness: .25 })); cap.position.y = 1.39; group.add(cap);
      const trim = new Mesh(new TorusGeometry(.59, .018, 6, 48), new MeshStandardMaterial({ color: 0xe1cda1, metalness: 1, roughness: .2 })); trim.rotation.x = Math.PI / 2; trim.position.y = -.28; cap.add(trim);
      const labelTexture = canvasTexture(512, 512, ctx => { ctx.fillStyle = '#eee9dc'; ctx.fillRect(0, 0, 512, 512); ctx.fillStyle = '#171b16'; ctx.textAlign = 'center'; ctx.font = '22px Arial'; ctx.fillText('O B J E C T   N ° 0 3', 256, 85); ctx.font = '88px Georgia'; ctx.fillText('Forme', 256, 260); ctx.font = '17px Arial'; ctx.fillText('L’ESSENCE DU MOUVEMENT', 256, 322); ctx.font = '15px Arial'; ctx.fillText('EAU DE CONCEPT · 50 ML', 256, 435); });
      const label = new Mesh(new THREE.PlaneGeometry(1.25, 1.25), new MeshStandardMaterial({ map: labelTexture, roughness: .7 })); label.position.set(0, -.25, .531); group.add(label);
      const platform = new Mesh(new CylinderGeometry(1.5, 1.6, .13, 64), new MeshStandardMaterial({ color: 0x999f8c, metalness: .35, roughness: .45 })); platform.position.y = -1.62; group.add(platform);
      return { group, material, update(time, amount) { cap.position.y = 1.39 + amount * 1.1; cap.rotation.y = amount * .8; } };
    }
    function createController(canvas, hero) {
      const host = canvas.parentElement;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1.25 : 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
      const scene = new THREE.Scene(); const environmentTarget = environment(renderer); scene.environment = environmentTarget.texture;
      const camera = new THREE.PerspectiveCamera(35, 1, .1, 100); camera.position.set(0, 0, hero ? 9.9 : 10.2);
      const ambient = new THREE.HemisphereLight(0xf4f6ed, 0x42483d, 2); scene.add(ambient);
      const key = new THREE.DirectionalLight(0xfff4e4, 4); key.position.set(-4, 6, 5); scene.add(key);
      const rim = new THREE.DirectionalLight(0xfa5429, 2); rim.position.set(5, -1, -3); scene.add(rim);
      const models = { form: sculpture() }; const root = new Group(); scene.add(root); root.add(models.form.group);
      let active = 'form', amount = 0, drag = false, lastX = 0, lastY = 0, targetX = -.18, targetY = -.35, userX = 0, userY = 0;
      const controller = { renderer, scene, camera, visible: false, ratio: 0, reset() { targetX = -.18; targetY = -.35; userX = userY = 0; amount = 0; dirty = true; }, select(name) { root.remove(models[active].group); if (!models[name]) models[name] = name === 'fintech' ? fintech() : luxury(); active = name; root.add(models[name].group); this.setFinish(finish); this.reset(); }, setFinish(value) { const { label, ...properties } = finishes[value]; Object.assign(models[active].material, properties); models[active].material.color = new THREE.Color(properties.color); models[active].material.needsUpdate = true; models[active].setFinish?.(value); dirty = true; }, render(time, delta) {
        const lerp = paused || reduced.matches ? 1 : 1 - Math.exp(-delta * 7);
        amount += ((hero ? 0 : expanded ? 1 : 0) - amount) * lerp;
        root.rotation.x += (targetX + userX - root.rotation.x) * lerp;
        root.rotation.y += (targetY + userY + (!paused ? Math.sin(time * .14) * .12 : 0) - root.rotation.y) * lerp;
        root.rotation.z = hero ? -.25 : -.06;
        root.position.y = !paused ? Math.sin(time * .65) * .09 : 0;
        if (hero && !reduced.matches && !paused) root.rotation.z += Math.min(scrollY / innerHeight, 1) * .45;
        const scale = active === 'form' && amount > 0 ? 1 - amount * .2 : 1; root.scale.setScalar(scale);
        models[active].update(time, amount); renderer.render(scene, camera);
      } };
      function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.z = hero ? (w / h < 1 ? 11 : 9.9) : w / h < 1 ? 11.2 : 10.2; camera.updateProjectionMatrix(); dirty = true; }
      new ResizeObserver(resize).observe(host); resize();
      host.addEventListener('pointerdown', event => { if (event.target.closest('button')) return; drag = true; lastX = event.clientX; lastY = event.clientY; host.setPointerCapture(event.pointerId); });
      host.addEventListener('pointermove', event => { if (drag) { targetY += (event.clientX - lastX) * .008; targetX = Math.max(-1.2, Math.min(1.2, targetX + (event.clientY - lastY) * .006)); lastX = event.clientX; lastY = event.clientY; } else if (event.pointerType !== 'touch') { const bounds = host.getBoundingClientRect(); userY = ((event.clientX - bounds.left) / bounds.width - .5) * .25; userX = ((event.clientY - bounds.top) / bounds.height - .5) * .12; } dirty = true; });
      const stopDrag = () => { drag = false; }; host.addEventListener('pointerup', stopDrag); host.addEventListener('pointercancel', stopDrag); host.addEventListener('pointerleave', () => { userX = userY = 0; dirty = true; });
      host.addEventListener('keydown', event => { if (event.target !== host) return; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); targetY += event.key === 'ArrowRight' ? .2 : event.key === 'ArrowLeft' ? -.2 : 0; targetX += event.key === 'ArrowDown' ? .2 : event.key === 'ArrowUp' ? -.2 : 0; dirty = true; } if (event.key.toLowerCase() === 'r') { controller.reset(); dirty = true; } });
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); host.classList.remove('webgl-ready'); controller.visible = false; notify('3D paused by your device. Reload to restore the scene.'); });
      controller.render(0, 1); host.classList.add('webgl-ready'); return controller;
    }
    controllers = [createController($('#hero-canvas'), true), createController($('#experiment-canvas'), false)];
    $('#render-status').textContent = 'LIVE WEBGL / INTERACTIVE';
    let previous = performance.now(), elapsed = 0, frameCount = 0, sampleStart = performance.now(), slowWindows = 0;
    function frame(now) {
      const delta = Math.min(.05, (now - previous) / 1000); previous = now;
      if (document.hidden) return;
      const active = controllers.filter(c => c.visible).sort((a, b) => b.ratio - a.ratio)[0];
      if (!active || (paused && !dirty)) return;
      if (!paused) elapsed += delta;
      active.render(elapsed, delta); dirty = false;
      if (!paused) { frameCount++; const duration = now - sampleStart; if (duration >= 1000) { const fps = Math.round(frameCount * 1000 / duration); $('#fps-value').textContent = String(fps); $('#fps-label').textContent = 'LAST VISIBLE SCENE'; if (fps < 40) slowWindows++; else slowWindows = 0; if (slowWindows === 3) controllers.forEach(c => c.renderer.setPixelRatio(1)); sampleStart = now; frameCount = 0; } }
    }
    function syncLoop() { const run = !document.hidden && controllers.some(c => c.visible); previous = performance.now(); sampleStart = previous; frameCount = 0; controllers[0].renderer.setAnimationLoop(run ? frame : null); }
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { const c = controllers.find(item => item.renderer.domElement.parentElement === entry.target); c.visible = entry.isIntersecting; c.ratio = entry.intersectionRatio; }); dirty = true; syncLoop(); }, { threshold: [0, .2, .5, .8, 1] });
    controllers.forEach(c => observer.observe(c.renderer.domElement.parentElement));
    document.addEventListener('visibilitychange', syncLoop);
    addEventListener('pagehide', () => { controllers[0].renderer.setAnimationLoop(null); });
    addEventListener('pageshow', syncLoop);
  } catch (error) {
    console.warn('3D unavailable; static presentation remains active.', error);
    $('#render-status').textContent = 'STATIC VIEW / 3D UNAVAILABLE';
    $('#fps-label').textContent = 'STATIC FALLBACK';
    $('#fps-value').textContent = '—';
    $('#scene-action').textContent = '3D unavailable on this device';
  }
}
boot();
