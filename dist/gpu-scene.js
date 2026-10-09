import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const canvas = document.querySelector("#aipo-gpu-scene");
const stage = document.querySelector("#gpu-stage");
const loading = document.querySelector("#gpu-loading");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 700px)").matches;

if (canvas && stage) {
  try {
    // ---------- Scene ----------
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05090f, 0.065);
    const camera = new THREE.PerspectiveCamera(38, stage.clientWidth / stage.clientHeight, 0.1, 60);
    camera.position.set(mobile ? 7.4 : 7.8, 2.15, mobile ? 12.6 : 11.2);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 15;
    controls.target.set(0, 0, 0.2);

    const hemi = new THREE.HemisphereLight(0xa9dfff, 0x071019, 1.6);
    const key = new THREE.DirectionalLight(0xf1f8ff, 5);
    key.position.set(4, 7, 8);
    key.castShadow = !mobile;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    const rim = new THREE.SpotLight(0x7a5cff, 26, 24, 0.55, 0.7, 1);
    rim.position.set(-7, 4, -3);
    rim.target.position.set(0, 0, 0);
    const accentLight = new THREE.PointLight(0x5ee7ee, mobile ? 7 : 12, 13, 2);
    accentLight.position.set(4, 0, 4);
    scene.add(hemi, key, rim, rim.target, accentLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 28),
      new THREE.MeshPhysicalMaterial({
        color: 0x05090d,
        metalness: 0.9,
        roughness: 0.24,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.38;
    floor.receiveShadow = !mobile;
    scene.add(floor);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(4.7, 64),
      new THREE.MeshBasicMaterial({
        color: 0x5ee7ee,
        transparent: true,
        opacity: 0.065,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -2.34;
    glow.scale.set(1.6, 0.72, 1);
    scene.add(glow);

    // ---------- Background particles ----------
    const particleCount = mobile ? 170 : 480;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.35) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x7fa9bc,
        size: mobile ? 0.024 : 0.032,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    // ---------- Procedural GPU ----------
    const gpu = new THREE.Group();
    gpu.rotation.set(-0.09, 0.18, 0.02);
    gpu.position.y = -0.05;
    scene.add(gpu);

    const mat = {
      armor: new THREE.MeshPhysicalMaterial({
        color: 0x151c25,
        metalness: 0.88,
        roughness: 0.24,
        clearcoat: 0.45,
      }),
      dark: new THREE.MeshStandardMaterial({ color: 0x070a0f, metalness: 0.35, roughness: 0.48 }),
      edge: new THREE.MeshPhysicalMaterial({
        color: 0x4b5765,
        metalness: 0.96,
        roughness: 0.19,
        clearcoat: 0.55,
      }),
      pcb: new THREE.MeshStandardMaterial({ color: 0x061a17, metalness: 0.14, roughness: 0.67 }),
      fin: new THREE.MeshStandardMaterial({ color: 0x687480, metalness: 1, roughness: 0.28 }),
      blade: new THREE.MeshPhysicalMaterial({
        color: 0x0d131b,
        metalness: 0.52,
        roughness: 0.29,
        clearcoat: 0.45,
      }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd2a932, metalness: 0.92, roughness: 0.2 }),
      black: new THREE.MeshStandardMaterial({ color: 0x020304, metalness: 0.1, roughness: 0.52 }),
    };

    const pieces = {};
    const add = (parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], shadow = true) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = shadow && !mobile;
      mesh.receiveShadow = !mobile;
      parent.add(mesh);
      return mesh;
    };

    pieces.backplate = new THREE.Group();
    gpu.add(pieces.backplate);
    add(pieces.backplate, new RoundedBoxGeometry(10.8, 4.5, 0.34, 5, 0.18), mat.armor, [0, 0, -0.72]);
    for (let x = -4.7; x < 5; x += 0.65) {
      add(pieces.backplate, new THREE.BoxGeometry(0.025, 3.5, 0.015), mat.edge, [x, 0, -0.9], [-0.15, 0, 0.14], false);
    }

    pieces.pcb = new THREE.Group();
    gpu.add(pieces.pcb);
    add(pieces.pcb, new RoundedBoxGeometry(10.35, 4.0, 0.26, 4, 0.1), mat.pcb, [0, 0, -0.36]);
    const chip = new THREE.MeshStandardMaterial({ color: 0x101722, metalness: 0.64, roughness: 0.4 });
    for (let i = 0; i < 16; i += 1) {
      const x = -4.1 + (i % 8) * 1.15;
      const y = -1.15 + Math.floor(i / 8) * 2.25;
      add(pieces.pcb, new THREE.BoxGeometry(0.39, 0.39, 0.1), chip, [x, y, -0.17]);
    }
    for (let i = 0; i < 24; i += 1) {
      add(pieces.pcb, new THREE.BoxGeometry(0.25, 0.6, 0.055), mat.gold, [-3.05 + i * 0.265, -2.2, -0.3], [], false);
    }
    const powerConnector = add(
      pieces.pcb,
      new RoundedBoxGeometry(1.2, 0.72, 0.65, 3, 0.08),
      mat.black,
      [3.74, 2.05, -0.05],
    );
    for (const x of [-0.35, 0, 0.35]) {
      for (const y of [-0.18, 0.18]) {
        add(powerConnector, new THREE.CylinderGeometry(0.065, 0.065, 0.24, 10), mat.edge, [x, y, 0.34], [Math.PI / 2, 0, 0], false);
      }
    }

    pieces.heatsink = new THREE.Group();
    gpu.add(pieces.heatsink);
    add(
      pieces.heatsink,
      new RoundedBoxGeometry(9.85, 3.64, 0.42, 4, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x7d8993, metalness: 1, roughness: 0.22 }),
      [0, 0, 0.03],
    );
    for (let x = -4.62; x < 4.74; x += 0.19) {
      add(pieces.heatsink, new THREE.BoxGeometry(0.07, 3.44, 0.73), mat.fin, [x, 0, 0.33], [], false);
    }
    const copper = new THREE.MeshStandardMaterial({ color: 0xa96a2c, metalness: 0.93, roughness: 0.21 });
    for (let i = -1; i <= 1; i += 1) {
      const pipe = add(
        pieces.heatsink,
        new THREE.TorusGeometry(2.75 + i * 0.4, 0.065, 8, 42, Math.PI),
        copper,
        [i * 0.52, 0, 0.72],
        [Math.PI / 2, 0, 0],
      );
      pipe.scale.y = 0.48;
    }

    pieces.shroud = new THREE.Group();
    gpu.add(pieces.shroud);
    add(pieces.shroud, new RoundedBoxGeometry(11.2, 4.72, 0.58, 7, 0.27), mat.dark, [0, 0, 0.79]);
    const cutout = new THREE.MeshBasicMaterial({ color: 0x04070b });
    add(pieces.shroud, new RoundedBoxGeometry(2.12, 4.18, 0.34, 5, 0.18), mat.armor, [-4.32, 0, 1.08], [0, 0, -0.06]);
    add(pieces.shroud, new RoundedBoxGeometry(2.12, 4.18, 0.34, 5, 0.18), mat.armor, [4.32, 0, 1.08], [0, 0, 0.06]);
    add(pieces.shroud, new RoundedBoxGeometry(1.0, 4.4, 0.42, 4, 0.14), mat.edge, [0, 0, 1.12]);
    for (const x of [-3.14, 0, 3.14]) {
      add(pieces.shroud, new THREE.CylinderGeometry(1.5, 1.5, 0.7, 64), cutout, [x, 0, 1.18], [Math.PI / 2, 0, 0], false);
    }
    add(pieces.shroud, new RoundedBoxGeometry(10.55, 0.23, 0.32, 3, 0.1), mat.edge, [0, 2.1, 1.22]);
    add(pieces.shroud, new RoundedBoxGeometry(10.55, 0.23, 0.32, 3, 0.1), mat.edge, [0, -2.1, 1.22]);

    pieces.fans = new THREE.Group();
    gpu.add(pieces.fans);
    const rotors = [];
    for (const [index, x] of [-3.14, 0, 3.14].entries()) {
      const fan = new THREE.Group();
      fan.position.set(x, 0, 1.56);
      pieces.fans.add(fan);
      add(fan, new THREE.TorusGeometry(1.41, 0.1, 12, 58), mat.edge);
      const rotor = new THREE.Group();
      rotor.userData.direction = index % 2 ? 1 : -1;
      fan.add(rotor);
      rotors.push(rotor);
      for (let i = 0; i < 11; i += 1) {
        const angle = (i / 11) * Math.PI * 2;
        const blade = add(
          rotor,
          new THREE.BoxGeometry(0.18, 1.08, 0.085),
          mat.blade,
          [Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0.05],
          [0, 0, angle - 0.44],
        );
        blade.geometry.translate(0, 0.31, 0);
      }
      add(rotor, new THREE.CylinderGeometry(0.39, 0.39, 0.2, 32), mat.armor, [0, 0, 0.11], [Math.PI / 2, 0, 0]);
      add(rotor, new THREE.CylinderGeometry(0.19, 0.19, 0.22, 32), mat.dark, [0, 0, 0.22], [Math.PI / 2, 0, 0]);
    }

    const rgbMaterial = new THREE.MeshStandardMaterial({
      color: 0x5ee7ee,
      emissive: 0x5ee7ee,
      emissiveIntensity: 5,
      metalness: 0.2,
      roughness: 0.22,
    });
    add(pieces.shroud, new RoundedBoxGeometry(8.3, 0.075, 0.11, 3, 0.05), rgbMaterial, [0.5, 2.27, 1.24], [-0.02, 0, 0], false);
    const rgbLights = [];
    for (const x of [-3.15, 0, 3.15]) {
      const light = new THREE.PointLight(0x5ee7ee, mobile ? 2.5 : 5, 4, 2);
      light.position.set(x, 2.13, 1.58);
      pieces.shroud.add(light);
      rgbLights.push(light);
    }

    const bracket = add(gpu, new THREE.BoxGeometry(0.2, 4.8, 1.52), mat.edge, [-5.58, 0, 0.17]);
    for (let y = -1.4; y <= 1.4; y += 0.7) {
      add(bracket, new THREE.BoxGeometry(0.22, 0.34, 0.36), mat.black, [-0.13, y, 0.24], [], false);
    }

    // ---------- Exploded view and UI ----------
    const explodeOffsets = {
      backplate: new THREE.Vector3(-1.8, 1.0, -1.7),
      pcb: new THREE.Vector3(-0.9, 0.5, -0.8),
      heatsink: new THREE.Vector3(0, 0, 0.2),
      shroud: new THREE.Vector3(0.9, -0.5, 1.2),
      fans: new THREE.Vector3(1.8, -1.0, 2.35),
    };
    const zero = new THREE.Vector3();
    let exploded = false;
    let explodeAmount = 0;
    const explodeButton = document.querySelector("#gpu-explode");
    const setExploded = (value) => {
      exploded = value;
      explodeButton?.setAttribute("aria-pressed", String(value));
      if (explodeButton) explodeButton.textContent = value ? "Reassemble GPU" : "Explode GPU";
    };
    explodeButton?.addEventListener("click", () => setExploded(!exploded));

    const infoPanel = document.querySelector("#gpu-info");
    const info = {
      cooling: {
        kicker: "THERMAL ARRAY",
        title: "Tri-axial cooling",
        copy: "Three tuned fans accelerate as you hover, feeding a dense fin stack and full-cover vapor chamber.",
        camera: [0.8, 0.6, 8.2],
      },
      power: {
        kicker: "POWER DELIVERY",
        title: "High-density board",
        copy: "A reinforced PCB, plated PCIe edge, and compact power connector make the current path visible.",
        camera: [6.1, 3.1, 7.4],
      },
    };
    for (const button of document.querySelectorAll("[data-hotspot]")) {
      button.addEventListener("click", () => {
        const item = info[button.dataset.hotspot];
        document.querySelector("#gpu-info-kicker").textContent = item.kicker;
        document.querySelector("#gpu-info-title").textContent = item.title;
        document.querySelector("#gpu-info-copy").textContent = item.copy;
        infoPanel.hidden = false;
        camera.position.set(...item.camera);
        controls.target.set(0, 0, 0.5);
      });
    }
    document.querySelector("#gpu-info-close")?.addEventListener("click", () => {
      infoPanel.hidden = true;
    });

    let accent = new THREE.Color("#5ee7ee");
    for (const button of document.querySelectorAll("[data-gpu-color]")) {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-gpu-color]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        accent.set(button.dataset.gpuColor);
        const [r, g, b] = [accent.r, accent.g, accent.b].map((value) => Math.round(value * 255));
        document.documentElement.style.setProperty("--gpu-accent", button.dataset.uiColor);
        document.documentElement.style.setProperty("--gpu-accent-rgb", r + ", " + g + ", " + b);
        rgbMaterial.color.copy(accent);
        rgbMaterial.emissive.copy(accent);
        glow.material.color.copy(accent);
        accentLight.color.copy(accent);
        rgbLights.forEach((light) => light.color.copy(accent));
      });
    }

    const syncBuild = (detail) => {
      const { recommendation, constraints } = detail ?? {};
      const gpuPart = recommendation?.parts?.gpu;
      if (gpuPart) document.querySelector("#gpu-stage-name").textContent = gpuPart.name;
      if (constraints?.resolution) document.querySelector("#hero-target").textContent = constraints.resolution.toUpperCase();
      if (constraints?.budget) document.querySelector("#hero-budget").textContent = "$" + Number(constraints.budget).toLocaleString();
      const failed = recommendation?.checks?.filter((check) => check.pass === false).length ?? 0;
      document.querySelector("#hero-compatibility").textContent = failed ? Math.max(72, 100 - failed * 7) + "%" : "100%";
    };
    window.addEventListener("aipo:build-updated", (event) => syncBuild(event.detail));
    syncBuild(window.__AIPO_LATEST_BUILD__);

    // ---------- Pointer response, resize and animation ----------
    let hover = 0;
    canvas.addEventListener("pointerenter", () => { hover = 1; });
    canvas.addEventListener("pointerleave", () => { hover = 0; });
    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 2));
    };
    new ResizeObserver(resize).observe(stage);

    const clock = new THREE.Clock();
    let fanSpeed = 1.35;
    const animate = () => {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;
      fanSpeed = THREE.MathUtils.lerp(fanSpeed, hover ? 7.2 : 1.35, 0.065);
      if (!reduceMotion) rotors.forEach((rotor) => { rotor.rotation.z += dt * fanSpeed * rotor.userData.direction; });
      if (!reduceMotion) {
        gpu.position.y = -0.05 + Math.sin(time * 0.75) * 0.09;
        particles.rotation.y += dt * 0.012;
      }
      const rainbow = new THREE.Color().setHSL((time * 0.055) % 1, 0.95, 0.56);
      rgbMaterial.color.copy(rainbow);
      rgbMaterial.emissive.copy(rainbow);
      rgbLights.forEach((light, index) => light.color.setHSL((time * 0.055 + index * 0.06) % 1, 0.95, 0.55));
      explodeAmount = THREE.MathUtils.lerp(explodeAmount, exploded ? 1 : 0, reduceMotion ? 1 : 0.075);
      for (const [name, piece] of Object.entries(pieces)) {
        piece.position.lerp(exploded ? explodeOffsets[name] : zero, 0.18);
      }
      gpu.rotation.y += reduceMotion ? 0 : dt * 0.018;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    setTimeout(() => loading?.classList.add("is-done"), 620);
  } catch (error) {
    console.error("AIPO-GPT 3D scene could not initialize", error);
    loading?.classList.add("is-done");
    stage.classList.add("gpu-fallback");
  }
}
