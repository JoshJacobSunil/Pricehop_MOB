import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import heroImage from './src/assets/hero.png';
import ip1Image from './src/assets/ip1.png';
import ip2Image from './src/assets/ip2.png';
import ip3Image from './src/assets/ip3.png';
import ip4Image from './src/assets/ip4.png';
const seqUrlsGlob = import.meta.glob('./src/assets/First_phone_mesh/*.jpg', { eager: true, query: '?url', import: 'default' });
const sortedSeqKeys = Object.keys(seqUrlsGlob).sort((a, b) => {
  const numA = parseInt(a.match(/(\d+)\.jpg$/)[1], 10);
  const numB = parseInt(b.match(/(\d+)\.jpg$/)[1], 10);
  return numA - numB;
});
const seqUrls = sortedSeqKeys.map(k => seqUrlsGlob[k]);

const secondSeqUrlsGlob = import.meta.glob('./src/assets/Second_phone_mesh/*.jpg', { eager: true, query: '?url', import: 'default' });
const sortedSecondSeqKeys = Object.keys(secondSeqUrlsGlob).sort((a, b) => {
  const numA = parseInt(a.match(/(\d+)\.jpg$/)[1], 10);
  const numB = parseInt(b.match(/(\d+)\.jpg$/)[1], 10);
  return numA - numB;
});
const secondSeqUrls = sortedSecondSeqKeys.map(k => secondSeqUrlsGlob[k]);

const thirdSeqUrlsGlob = import.meta.glob('./src/assets/Third_phone_mesh/*.jpg', { eager: true, query: '?url', import: 'default' });
const sortedThirdSeqKeys = Object.keys(thirdSeqUrlsGlob).sort((a, b) => {
  const numA = parseInt(a.match(/(\d+)\.jpg$/)[1], 10);
  const numB = parseInt(b.match(/(\d+)\.jpg$/)[1], 10);
  return numA - numB;
});
const thirdSeqUrls = sortedThirdSeqKeys.map(k => thirdSeqUrlsGlob[k]);

const fourthSeqUrlsGlob = import.meta.glob('./src/assets/Fourth_phone_mesh/*.jpg', { eager: true, query: '?url', import: 'default' });
const sortedFourthSeqKeys = Object.keys(fourthSeqUrlsGlob).sort((a, b) => {
  const numA = parseInt(a.match(/(\d+)\.jpg$/)[1], 10);
  const numB = parseInt(b.match(/(\d+)\.jpg$/)[1], 10);
  return numA - numB;
});
const fourthSeqUrls = sortedFourthSeqKeys.map(k => fourthSeqUrlsGlob[k]);

const allSeqUrls = [...seqUrls, ...secondSeqUrls, ...thirdSeqUrls, ...fourthSeqUrls];

gsap.registerPlugin(ScrollTrigger);

// 1. Scene Setup
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

// 1.5 Lenis Smooth Scrolling Setup
const lenis = new Lenis({
  autoBind: true,
  lerp: 0.1, // Modern standard for smooth, responsive scrolling
  smoothWheel: true,
  wheelMultiplier: 1,
});

// Sync Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// 2. Camera Setup
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
scene.add(camera);

// 3. Renderer Setup
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // transparent background so black shows through
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// For nicer GLTF rendering
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// 4. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// 5. Load Model & Setup Animations
const gltfLoader = new GLTFLoader();
let interactiveGroup = new THREE.Group();
scene.add(interactiveGroup);

let phoneGroup = new THREE.Group();
let extraPhones = [];
let screenMaterial = null;
let seqTextures = [];
interactiveGroup.add(phoneGroup);

gltfLoader.load('/iphone_17.glb', (gltf) => {
  const model = gltf.scene;

  // Center the model's geometry
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x += (model.position.x - center.x);
  model.position.y += (model.position.y - center.y);
  model.position.z += (model.position.z - center.z);

  // Apply texture to the screen mesh
  const textureLoader = new THREE.TextureLoader();
  const screenTexture = textureLoader.load(heroImage);
  const Y_OFFSET = 0.01; // Offset to bring the image slightly down in the mesh

  screenTexture.flipY = false;
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.offset.y = Y_OFFSET;

  seqTextures = [screenTexture];
  allSeqUrls.forEach(url => seqTextures.push(textureLoader.load(url)));
  seqTextures.forEach(t => {
    if (t !== screenTexture) {
      t.flipY = false;
      t.colorSpace = THREE.SRGBColorSpace;
      t.offset.y = -Y_OFFSET;
    }
  });

  const extraTextures = [
    textureLoader.load(ip1Image),
    textureLoader.load(ip2Image),
    textureLoader.load(ip3Image),
    textureLoader.load(ip4Image),
  ];
  extraTextures.forEach(t => {
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.offset.y = -Y_OFFSET;
  });

  model.traverse((child) => {
    if (child.isMesh) {
      // Remove apple logo completely
      const name = child.name.toLowerCase();
      const matName = child.material.name.toLowerCase();
      if (name.includes('logo') || matName.includes('logo') || name.includes('apple') || matName.includes('apple')) {
        child.visible = false;
        child.scale.set(0, 0, 0);
        child.material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
      }

      if (child.material.name.includes('Screen') || child.material.name === '17ProMax_Screen') {
        screenMaterial = new THREE.ShaderMaterial({
          uniforms: {
            tex1: { value: screenTexture },
            tex2: { value: screenTexture },
            mixRatio: { value: 0.0 },
            yOffset: { value: Y_OFFSET }
          },
          vertexShader: `
            varying vec2 vUv;
            uniform float yOffset;
            void main() {
              vUv = vec2(uv.x, uv.y - yOffset);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tex1;
            uniform sampler2D tex2;
            uniform float mixRatio;
            varying vec2 vUv;
            void main() {
              vec4 c1 = texture2D(tex1, vUv);
              vec4 c2 = texture2D(tex2, vUv);
              gl_FragColor = mix(c1, c2, mixRatio);
              #include <colorspace_fragment>
            }
          `
        });
        child.material = screenMaterial;
      }
      if (child.material.name.toLowerCase().includes('glass')) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.1;
        child.material.depthWrite = false;
      }
    }
  });

  phoneGroup.add(model);

  for (let i = 0; i < 4; i++) {
    const clone = model.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.material.name.includes('Screen') || child.material.name === '17ProMax_Screen') {
          child.material = new THREE.MeshBasicMaterial({
            map: extraTextures[i]
          });
        }
      }
    });
    clone.visible = false;
    phoneGroup.add(clone);
    extraPhones.push(clone);
  }

  // Setup Initial State (Hero)
  // Big, front-facing, top 20% visible
  // To show top 20%, we shift it up relative to the camera
  // --- SIZE EDITING: Change initialScale to modify the starting size ---
  let initialScale = 50.0; // Really big scale (was 15.0)
  if (window.innerWidth < 768) initialScale = 63.0; // Responsive scale (was 9.0)

  phoneGroup.scale.set(initialScale, initialScale, initialScale);
  phoneGroup.position.set(0, -4.5, 0); // Moved down so camera sees top
  phoneGroup.rotation.set(0, Math.PI, 0);

  // Setup GSAP ScrollTrigger Animations
  setupScrollAnimations();
});

let mainTimeline;

function setupScrollAnimations() {
  // We have 6 sections. 
  // Hero (0) -> Section 2 (1) -> Section 3 (2) -> Section 4 (3) -> Section 5 (4) -> Section 6 (5)
  const isMobile = window.innerWidth < 768;

  mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true, // Let Lenis handle the smoothing natively
    }
  });

  // --- SIZE EDITING: Modify the 'scale' values in the timelines below (x, y, z must be equal) ---

  // Section 2: Minimizes, remains in center, front-facing
  mainTimeline.to(phoneGroup.position, { x: 0, y: 0, z: 0, ease: 'power1.inOut' }, 0)
    .to(phoneGroup.scale, { x: 18.5, y: 18.5, z: 18.5, ease: 'power1.inOut' }, 0)
    .to(phoneGroup.rotation, { x: 0, y: Math.PI, z: 0, ease: 'power1.inOut' }, 0);

  gsap.set(['#popup-image', '#popout-1', '#popout-2'], { xPercent: -50, yPercent: -50 });
  gsap.set('#drow-text', { xPercent: -50, yPercent: -50 });
  gsap.set('#logo-strip', { xPercent: -50, yPercent: -50 });
  gsap.set('#dday-text', { xPercent: -50, yPercent: -50 });
  gsap.set('#logo-strip-2', { xPercent: -50, yPercent: -50 });
  // --- NEW DEALSROW POPOUT ---
  gsap.set('#drow-popup', {
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    x: -65, // Shifted 5 pixels further right
    y: 35,
    scale: 0.35, // Decreased size by 75%
    opacity: 0, // Initially hidden
    zIndex: -1
  });

  gsap.set('#dday-popup', {
    xPercent: -50,
    yPercent: -50,
    left: '50%',
    x: 0,
    y: 45, // Bring entirely down 10 pixels initially
    scale: 0.43, // Scaled up 30% larger than DROW
    opacity: 0,
    zIndex: -1
  });

  let screenAnim = { frame: 0 };

  const updateScreenShader = () => {
    if (screenMaterial) {
      const maxFrame = seqTextures.length - 1;
      const currentFrame = Math.min(Math.max(screenAnim.frame, 0), maxFrame);
      const frameIndex = Math.floor(currentFrame);
      const nextFrameIndex = Math.min(frameIndex + 1, maxFrame);
      const mixRatio = currentFrame - frameIndex;

      screenMaterial.uniforms.tex1.value = seqTextures[frameIndex];
      screenMaterial.uniforms.tex2.value = seqTextures[nextFrameIndex];
      screenMaterial.uniforms.mixRatio.value = mixRatio;
    }
  };

  // --- DROW POPUP ---
  // Screen Anim to 5
  mainTimeline.to(screenAnim, { frame: 5, ease: "none", duration: 0.1, onUpdate: updateScreenShader }, 0.5);

  // Pop out drow popup
  mainTimeline.to('#webgl-canvas', { filter: 'blur(3px)', duration: 0.3, ease: 'power2.inOut' }, 0.6);
  mainTimeline.to('#drow-popup', { scale: 0.38, opacity: 1, duration: 0.3, ease: 'power2.inOut' }, 0.6);
  mainTimeline.set('#drow-popup', { zIndex: 10 }, 0.75);

  // Shift phone left, drow popup moves right
  mainTimeline.to(phoneGroup.position, { x: isMobile ? 0 : -1.5, ease: 'power1.inOut', duration: 0.3 }, 0.9);
  mainTimeline.to(phoneGroup.rotation, { y: Math.PI + Math.PI / 6, ease: 'power1.inOut', duration: 0.3 }, 0.9);
  mainTimeline.to('#drow-popup', { x: '25vw', scale: 0.42, ease: 'power2.inOut', duration: 0.3 }, 0.9);
  // Slide text and logo strip in from right
  mainTimeline.fromTo('#drow-text',
    { opacity: 0, x: '75vw', y: 0 },
    { opacity: 1, x: '25vw', y: 0, ease: 'power2.out', duration: 0.3 },
    0.9
  );
  mainTimeline.fromTo('#logo-strip',
    { opacity: 0, x: '75vw', y: 0 },
    { opacity: 1, x: '25vw', y: 0, ease: 'power2.out', duration: 0.3 },
    0.9
  );

  // Slide drow popup, text, and logo strip out to the right, phone returns to center
  mainTimeline.to('#drow-popup', { x: '100vw', scale: 0.35, opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.3);
  mainTimeline.to('#drow-text', { opacity: 0, x: '100vw', duration: 0.4, ease: 'power2.in' }, 1.3);
  mainTimeline.to('#logo-strip', { opacity: 0, x: '100vw', duration: 0.4, ease: 'power2.in' }, 1.3);
  mainTimeline.to(phoneGroup.position, { x: 0, ease: 'power1.inOut', duration: 0.4 }, 1.3);
  mainTimeline.to(phoneGroup.rotation, { y: Math.PI, ease: 'power1.inOut', duration: 0.4 }, 1.3);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(0px)', duration: 0.4, ease: 'power2.inOut' }, 1.3);

  // --- DDAY POPUP ---
  // Screen Anim to 225
  mainTimeline.to(screenAnim, { frame: 225, ease: "none", duration: 0.4, onUpdate: updateScreenShader }, 1.7);

  // Pop out dday popup
  mainTimeline.to('#webgl-canvas', { filter: 'blur(3px)', duration: 0.3, ease: 'power2.inOut' }, 2.1);
  mainTimeline.to('#dday-popup', { scale: 0.49, opacity: 1, duration: 0.3, ease: 'power2.inOut' }, 2.1);
  mainTimeline.set('#dday-popup', { zIndex: 10 }, 2.25);

  // Shift phone right, dday popup moves left
  mainTimeline.to(phoneGroup.position, { x: isMobile ? 0 : 1.5, ease: 'power1.inOut', duration: 0.3 }, 2.5);
  mainTimeline.to(phoneGroup.rotation, { y: Math.PI - Math.PI / 6, ease: 'power1.inOut', duration: 0.3 }, 2.5);
  mainTimeline.to('#dday-popup', { x: '-25vw', scale: 0.55, ease: 'power2.inOut', duration: 0.3 }, 2.5);

  // Slide text and logo strip 2 in from left
  mainTimeline.fromTo('#dday-text',
    { opacity: 0, x: '-75vw', y: 0 },
    { opacity: 1, x: '-25vw', y: 0, ease: 'power2.out', duration: 0.3 },
    2.5
  );
  mainTimeline.fromTo('#logo-strip-2',
    { opacity: 0, x: '-75vw', y: 0 },
    { opacity: 1, x: '-25vw', y: 0, ease: 'power2.out', duration: 0.3 },
    2.5
  );

  // Slide dday popup, text, and logo strip 2 out to the left, phone returns to center
  mainTimeline.to('#dday-popup', { x: '-100vw', scale: 0.45, opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.9);
  mainTimeline.to('#dday-text', { opacity: 0, x: '-100vw', duration: 0.4, ease: 'power2.in' }, 2.9);
  mainTimeline.to('#logo-strip-2', { opacity: 0, x: '-100vw', duration: 0.4, ease: 'power2.in' }, 2.9);
  mainTimeline.to(phoneGroup.position, { x: 0, ease: 'power1.inOut', duration: 0.4 }, 2.9);
  mainTimeline.to(phoneGroup.rotation, { y: Math.PI, ease: 'power1.inOut', duration: 0.4 }, 2.9);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(0px)', duration: 0.4, ease: 'power2.inOut' }, 2.9);

  // Finish screen animation
  mainTimeline.to(screenAnim, {
    frame: seqUrls.length,
    ease: "none",
    duration: 0.2,
    onUpdate: updateScreenShader
  }, 3.3);

  // Blur canvas and show popup image
  mainTimeline.to('#webgl-canvas', { filter: 'blur(6px)', duration: 0.5, ease: 'power2.inOut' }, 3.5);
  mainTimeline.to('#popup-image', { scale: 1.38, opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 3.5);
  mainTimeline.set('#popup-image', { zIndex: 10 }, 3.75);

  // Undo blur and hide popup when moving to next section
  mainTimeline.to('#webgl-canvas', { filter: 'blur(0px)', duration: 0.5, ease: 'power2.inOut' }, 5.0);
  mainTimeline.to('#popup-image', { scale: 1.15, duration: 0.5, ease: 'power2.inOut' }, 5.0);
  mainTimeline.set('#popup-image', { zIndex: 0 }, 5.25);
  mainTimeline.set('#popup-image', { opacity: 0 }, 5.5);

  // Section 3: Zooms back in to center, top 40% seen (Old T=1)
  mainTimeline.to(phoneGroup.position, { x: 0, y: -2.2, z: 0, ease: 'power1.inOut' }, 5.5)
    .to(phoneGroup.scale, { x: 36.5, y: 36.5, z: 36.5, ease: 'power1.inOut' }, 5.5)
    .to(phoneGroup.rotation, { x: 0, y: Math.PI, z: 0, ease: 'power1.inOut' }, 5.5);

  mainTimeline.to(screenAnim, {
    frame: seqUrls.length + 161,
    ease: "none",
    onUpdate: updateScreenShader
  }, 5.95);

  mainTimeline.to(screenAnim, {
    frame: seqUrls.length + secondSeqUrls.length,
    ease: "none",
    duration: 0.8,
    onUpdate: updateScreenShader
  }, 6.7);

  mainTimeline.call(() => {
    targetRotation = Math.round(targetRotation / (Math.PI * 2)) * (Math.PI * 2);
  }, null, 6.5);

  // Section 4: 360-Degree Spinning Circle (Carousel)
  mainTimeline.to(phoneGroup.position, { x: 0, y: -0.9, z: 0, ease: 'power1.inOut' }, 6.5)
    .to(phoneGroup.scale, { x: 11.7, y: 11.7, z: 11.7, ease: 'power1.inOut' }, 6.5);

  const radius = 0.143;

  const mainPhone = phoneGroup.children[0];
  mainTimeline.to(mainPhone.position, {
    x: Math.sin(0) * radius,
    y: 0,
    z: -Math.cos(0) * radius,
    ease: 'power1.inOut'
  }, 6.5);
  mainTimeline.to(mainPhone.rotation, {
    y: 0,
    ease: 'power1.inOut'
  }, 6.5);

  extraPhones.forEach((phone, i) => {
    const index = i + 1;
    const angle = -index * (Math.PI * 2 / 5);
    const startTime = 6.5 + (i * 0.1);

    const targetX = Math.sin(angle) * radius;
    const targetZ = -Math.cos(angle) * radius;

    phone.position.set(targetX, 0, targetZ);
    phone.rotation.set(0, -angle, 0);

    mainTimeline.set(phone, { visible: true }, startTime);

    mainTimeline.fromTo(phone.scale, {
      x: 0.001, y: 0.001, z: 0.001
    }, {
      x: 1, y: 1, z: 1,
      ease: 'power2.out'
    }, startTime);
  });

  mainTimeline.to(phoneGroup.rotation, { x: 0, y: Math.PI * 3, z: 0, duration: 0.8, ease: 'power1.inOut' }, 6.7);

  mainTimeline.call(() => {
    targetRotation = Math.round(targetRotation / (Math.PI * 2)) * (Math.PI * 2);
  }, null, 7.5);

  // Section 5: Extra phones go up and disappear, main phone back to normal center
  mainTimeline.to(phoneGroup.position, { x: 0, y: -1.5, z: 0, ease: 'power1.inOut' }, 7.5)
    .to(phoneGroup.scale, { x: 18.0, y: 18.0, z: 18.0, ease: 'power1.inOut' }, 7.5);

  mainTimeline.to(screenAnim, {
    frame: allSeqUrls.length - fourthSeqUrls.length,
    ease: "none",
    duration: 1.0,
    onUpdate: updateScreenShader
  }, 7.5);

  mainTimeline.to(mainPhone.position, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 7.5);
  mainTimeline.to(mainPhone.rotation, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 7.5);

  extraPhones.forEach((phone, i) => {
    mainTimeline.to(phone.position, {
      y: 1.5,
      x: Math.sin(-i * Math.PI) * 0.5,
      ease: 'power2.inOut'
    }, 7.5);
    mainTimeline.to(phone.scale, {
      x: 0.001, y: 0.001, z: 0.001,
      ease: 'power2.inOut'
    }, 7.5);
    mainTimeline.set(phone, { visible: false }, 8.5);
  });

  // Section 6: Keep at center, straight and front facing
  mainTimeline.to(phoneGroup.position, { x: 0, y: -1.5, z: 0, ease: 'power1.inOut' }, 8.5)
    .to(phoneGroup.rotation, { x: 0, y: Math.PI * 3, z: 0, ease: 'power1.inOut' }, 8.5);

  mainTimeline.to(screenAnim, {
    frame: allSeqUrls.length,
    ease: "none",
    duration: 1.0,
    onUpdate: updateScreenShader
  }, 8.5);

  // Section 7: Popout images split
  // Blur canvas and show popup images
  mainTimeline.to('#webgl-canvas', { filter: 'blur(4.8px)', duration: 0.5, ease: 'power2.inOut' }, 9.5);
  mainTimeline.to(['#popout-1', '#popout-2'], { scale: 1.3, opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 9.5);
  mainTimeline.set(['#popout-1', '#popout-2'], { zIndex: 10 }, 9.75);

  // Split left and right
  mainTimeline.to('#popout-1', { x: -440, duration: 0.5, ease: 'power2.inOut' }, 10.0);
  mainTimeline.to('#popout-2', { x: 440, duration: 0.5, ease: 'power2.inOut' }, 10.0);

  // Grab specific text wrappers
  const text2 = document.querySelector('#section-2 .content-wrapper');
  const text2bLeft = document.querySelector('#section-2b .split-left');
  const text2bRight = document.querySelector('#section-2b .split-right');
  const text3Left = document.querySelector('#section-3 .split-left');
  const text3Right = document.querySelector('#section-3 .split-right');
  const text4 = document.querySelector('#section-4 .content-wrapper');
  const text5 = document.querySelector('#section-5 .content-wrapper');
  const text6 = document.querySelector('#section-6 .content-wrapper');
  const text7Left = document.querySelector('#section-7 .split-left');
  const text7Right = document.querySelector('#section-7 .split-right');

  // Text 2: Fade in, slide in from the left, float slightly
  mainTimeline.fromTo(text2, { opacity: 0, y: -80, x: -100 }, { opacity: 1, y: -95, x: -20, duration: 0.5, ease: 'power2.out' }, 0.25);
  mainTimeline.to(text2, { y: -100, duration: 0.65, ease: 'none' }, 0.75);
  mainTimeline.to(text2, { opacity: 0, x: -500, duration: 0.3, ease: 'power2.inOut' }, 0.9);

  const glowingBtn = document.querySelector('.glowing-btn');
  if (glowingBtn) {
    mainTimeline.set(glowingBtn, { opacity: 0 }, 0);
    mainTimeline.set(glowingBtn, { opacity: 1 }, 3.98); // Appear at completely popped out state
    mainTimeline.set(glowingBtn, { opacity: 0 }, 5.01); // Disappear if it goes back in even by a pixel
  }

  if (text2bLeft) mainTimeline.fromTo(text2bLeft, { opacity: 0, x: -300 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, 3.5);
  if (text2bRight) mainTimeline.fromTo(text2bRight, { opacity: 0, x: 300 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, 3.5);

  if (text2bLeft) mainTimeline.to(text2bLeft, { opacity: 0, x: -300, duration: 0.5, ease: 'power2.in' }, 5.0);
  if (text2bRight) mainTimeline.to(text2bRight, { opacity: 0, x: 300, duration: 0.5, ease: 'power2.in' }, 5.0);

  // Text 3: Slide in from the sides
  mainTimeline.fromTo(text3Left, { opacity: 0, x: -100 }, { opacity: 1, x: -40, duration: 0.5, ease: 'power2.out' }, 5.75);
  mainTimeline.fromTo(text3Right, { opacity: 0, x: 100 }, { opacity: 1, x: 40, duration: 0.5, ease: 'power2.out' }, 5.75);
  mainTimeline.to([text3Left, text3Right], { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 6.5);

  mainTimeline.to(text4, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 6.75);
  mainTimeline.to(text4, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 7.5);

  mainTimeline.to(text5, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 7.75);
  mainTimeline.to(text5, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 8.5);

  mainTimeline.to(text6, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 8.75);
  mainTimeline.to(text6, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 9.5);

  // Text 7: Fade in text blocks
  if (text7Left) mainTimeline.fromTo(text7Left, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 10.0);
  if (text7Right) mainTimeline.fromTo(text7Right, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 10.0);
}

// 6. Interaction Logic for Hover (formerly Dragging)
let previousMousePosition = { x: window.innerWidth / 2 };
let targetRotation = 0;
let currentRotation = 0;

window.addEventListener('pointermove', (e) => {
  // Always track the delta so there are no massive jumps when entering the section
  const deltaX = e.clientX - previousMousePosition.x;
  previousMousePosition.x = e.clientX;

  if (mainTimeline) {
    const t = mainTimeline.time();
    // Simple bounding box for the carousel (middle 60% of screen horizontally and vertically)
    const isOverCarousel = (
      e.clientX > window.innerWidth * 0.2 &&
      e.clientX < window.innerWidth * 0.8 &&
      e.clientY > window.innerHeight * 0.2 &&
      e.clientY < window.innerHeight * 0.8
    );

    // Allow rotation only when completely in the circle group and fully aligned
    const arePhonesAligned = extraPhones.length > 0 && extraPhones.every(p => p.scale.x >= 0.99 && p.visible);
    if (t >= 6.5 && t < 7.5 && arePhonesAligned && isOverCarousel) {
      targetRotation += deltaX * 0.005; // Hover sensitivity
    }
  }
});

// 7. Resize Handler
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 8. Animation Loop
const clock = new THREE.Clock();
let lastTimelineProgress = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Add auto-rotation during the carousel section
  if (mainTimeline) {
    const t = mainTimeline.time();
    const currentProgress = mainTimeline.progress();
    const isScrubbing = currentProgress !== lastTimelineProgress;
    lastTimelineProgress = currentProgress;

    const arePhonesAligned = extraPhones.length > 0 && extraPhones.every(p => p.scale.x >= 0.99 && p.visible);
    // When in the carousel section, slowly increment the target rotation, ONLY if not currently scrolling
    if (t >= 5.5 && t < 6.5 && arePhonesAligned && !isScrubbing) {
      targetRotation += 0.0015; // Slower infinite auto-rotation (was 0.003)
    }
  }

  // Smooth out the manual rotation (momentum)
  currentRotation += (targetRotation - currentRotation) * 0.05;
  if (interactiveGroup) {
    interactiveGroup.rotation.y = currentRotation;
  }

  // Very subtle floating animation (optional, only if ScrollTrigger isn't aggressively pinning it)
  // if(phoneGroup) {
  //   phoneGroup.position.y += Math.sin(elapsedTime) * 0.001;
  // }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
