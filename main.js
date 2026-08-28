import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initTinderCards } from './src/tinder-cards.js';
import heroImage from './src/assets/hero.png';
import ip1Image from './src/assets/ip1.png';
import ip2Image from './src/assets/ip2.png';
import ip3Image from './src/assets/ip3.png';
import ip4Image from './src/assets/ip4.png';
import pCompImage from './src/assets/Pr_comp/P_comp.png';
import pAlertImage from './src/assets/Pr_alert/P_alert.png';
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
  autoRaf: false, // Stops Lenis from running its own RAF loop (since we call raf inside GSAP ticker)
  lerp: 0.08,     // Luxurious, slightly slower catchup for smooth scrolling
  duration: 1.2,  // Set uniform duration
  smoothWheel: true,
  wheelMultiplier: 1.0,
  syncTouch: true // Normalizes touch devices
});
window.lenis = lenis; // expose for tinder-cards overlay

// Sync Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// 2. Camera Setup
// On mobile, use visualViewport for the initial canvas dimensions so the renderer
// is correctly sized from frame 0 (window.innerHeight can include browser chrome).
const vvpInit = window.visualViewport;
const initIsMobile = window.innerWidth <= 768;
const sizes = {
  width:  initIsMobile && vvpInit ? Math.round(vvpInit.width)  : window.innerWidth,
  height: initIsMobile && vvpInit ? Math.round(vvpInit.height) : window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
scene.add(camera);

// 3. Renderer Setup
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // transparent background so black shows through
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// LinearToneMapping keeps phone body bright white; ACESFilmic was graying/darkening the chassis
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.2;

// 4. Lighting — bright enough so phone body doesn't look gray
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

// 5. Load Model & Setup Animations
const gltfLoader = new GLTFLoader();
let interactiveGroup = new THREE.Group();
scene.add(interactiveGroup);

let phoneGroup = new THREE.Group();
let extraPhones = [];
let endPhones = [];
let screenMaterial = null;
let seqTextures = [];
interactiveGroup.add(phoneGroup);

gltfLoader.load(`${import.meta.env.BASE_URL}${import.meta.env.VITE_GLB_MODEL_PATH || 'iphone_17.glb'}`, (gltf) => {
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

  const endTextures = [
    textureLoader.load(pCompImage),
    textureLoader.load(pAlertImage),
  ];
  endTextures.forEach(t => {
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.offset.y = -Y_OFFSET;
  });

  // Asynchronously invert pCompImage to make its screen light mode
  textureLoader.load(pCompImage, (tex) => {
    const canvas = document.createElement('canvas');
    canvas.width = tex.image.width;
    canvas.height = tex.image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(tex.image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i+1] = 255 - data[i+1];
      data[i+2] = 255 - data[i+2];
    }
    ctx.putImageData(imgData, 0, 0);
    
    const invertedTex = new THREE.CanvasTexture(canvas);
    invertedTex.flipY = false;
    invertedTex.colorSpace = THREE.SRGBColorSpace;
    invertedTex.offset.y = -Y_OFFSET;
    invertedTex.needsUpdate = true;
    
    endTextures[0] = invertedTex;
    if (endPhones[0]) {
      endPhones[0].traverse((child) => {
        if (child.isMesh && (child.material.name.includes('Screen') || child.material.name === '17ProMax_Screen')) {
          child.material.map = invertedTex;
          child.material.needsUpdate = true;
        }
      });
    }
  });

  // Asynchronously invert pAlertImage to make its screen light mode
  textureLoader.load(pAlertImage, (tex) => {
    const canvas = document.createElement('canvas');
    canvas.width = tex.image.width;
    canvas.height = tex.image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(tex.image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i+1] = 255 - data[i+1];
      data[i+2] = 255 - data[i+2];
    }
    ctx.putImageData(imgData, 0, 0);
    
    const invertedTex = new THREE.CanvasTexture(canvas);
    invertedTex.flipY = false;
    invertedTex.colorSpace = THREE.SRGBColorSpace;
    invertedTex.offset.y = -Y_OFFSET;
    invertedTex.needsUpdate = true;
    
    endTextures[1] = invertedTex;
    if (endPhones[1]) {
      endPhones[1].traverse((child) => {
        if (child.isMesh && (child.material.name.includes('Screen') || child.material.name === '17ProMax_Screen')) {
          child.material.map = invertedTex;
          child.material.needsUpdate = true;
        }
      });
    }
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
          name: '17ProMax_Screen',
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

  for (let i = 0; i < 2; i++) {
    const clone = model.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.material.name.includes('Screen') || child.material.name === '17ProMax_Screen') {
          child.material = new THREE.MeshBasicMaterial({
            map: endTextures[i]
          });
        }
      }
    });
    clone.visible = false;
    clone.scale.set(0.897, 0.897, 0.897); // Size 15% larger than original 0.78 scale
    phoneGroup.add(clone);
    endPhones.push(clone);
  }

  // Setup Initial State (Hero) - Centered in middle of any phone
  const isMobile = window.innerWidth <= 768;
  const initialScale = isMobile ? 11.8 : 15.0;

  phoneGroup.scale.set(initialScale, initialScale, initialScale);
  phoneGroup.position.set(0, 0, 0); // Positioned right in the middle
  phoneGroup.rotation.set(0, Math.PI, 0); // Front facing

  // Setup GSAP ScrollTrigger Animations
  setupScrollAnimations();

  // Project phone screen-space edges and set CSS custom properties
  // so text zones are anchored strictly above (left→top) and below (right→bottom) the phone
  updatePhoneEdgeVars();
}, undefined, (error) => {
  console.warn("Could not load the 3D phone model. Using fallback image.", error);
  // Show fallback image inside canvas if loading fails
  const canvasEl = document.querySelector('#webgl-canvas');
  if (canvasEl) {
    canvasEl.style.backgroundImage = `url(${heroImage})`;
    canvasEl.style.backgroundSize = 'contain';
    canvasEl.style.backgroundPosition = 'center';
    canvasEl.style.backgroundRepeat = 'no-repeat';
  }
});

let mainTimeline;

function setupScrollAnimations() {
  const isMobile = window.innerWidth <= 768;
  const phoneScale = isMobile ? 11.8 : 15.0;

  mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1, // Smooth animation catch-up synced with Lenis inertia
    }
  });

  // Ensure phone remains centered at (0, 0, 0)
  phoneGroup.position.set(0, 0, 0);
  phoneGroup.scale.set(phoneScale, phoneScale, phoneScale);
  phoneGroup.rotation.set(0, Math.PI, 0);

  // Set all popout elements centered at scale 0.2 and hidden
  gsap.set(['#popup-image', '#popout-1', '#popout-2', '#alert-popout', '#cmp-popout', '#drow-popup', '#dday-popup'], {
    x: 0,
    y: 0,
    scale: 0.2,
    opacity: 0,
    transformOrigin: 'center center'
  });

  gsap.set(['#drow-text', '#dday-text', '#logo-strip', '#logo-strip-2'], {
    x: 0,
    y: 0,
    opacity: 0,
    transformOrigin: 'center center'
  });

  // Select text wrappers
  const text1 = document.querySelector('#section-1 .content-wrapper');
  const text2 = document.querySelector('#section-2 .content-wrapper');
  const text2bTop = document.querySelector('#section-2b .split-top');
  const text2bBottom = document.querySelector('#section-2b .split-bottom');
  const text3Top = document.querySelector('#section-3 .split-top');
  const text3Bottom = document.querySelector('#section-3 .split-bottom');
  const text7Top = document.querySelector('#section-7 .split-top');
  const text7Bottom = document.querySelector('#section-7 .split-bottom');

  if (text1) gsap.set(text1, { opacity: 1, y: 0 });
  if (text2) gsap.set(text2, { opacity: 0, y: 25 });
  if (text2bTop) gsap.set(text2bTop, { opacity: 0, y: -20 });
  if (text2bBottom) gsap.set(text2bBottom, { opacity: 0, y: 20 });
  if (text3Top) gsap.set(text3Top, { opacity: 0, y: -20 });
  if (text3Bottom) gsap.set(text3Bottom, { opacity: 0, y: 20 });
  if (text7Top) gsap.set(text7Top, { opacity: 0, y: -20 });
  if (text7Bottom) gsap.set(text7Bottom, { opacity: 0, y: 20 });

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

  // 1. HERO -> FEED (Time 0.0 - 0.6)
  if (text1) mainTimeline.to(text1, { opacity: 0, y: -25, duration: 0.3, ease: 'power2.in' }, 0.1);
  if (text2) mainTimeline.to(text2, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.25);
  if (text2) mainTimeline.to(text2, { opacity: 0, y: -25, duration: 0.3, ease: 'power2.in' }, 0.55);

  // 2. DROW POPOUT (Time 0.6 - 1.4)
  mainTimeline.to(screenAnim, { frame: 5, ease: "none", duration: 0.1, onUpdate: updateScreenShader }, 0.6);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(3px)', duration: 0.3, ease: 'power2.inOut' }, 0.7);
  mainTimeline.to('#drow-popup', { scale: isMobile ? 0.44 : 0.50, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }, 0.7);
  mainTimeline.fromTo('#drow-text', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.7);
  mainTimeline.fromTo('#logo-strip', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.7);

  // Drow Popout Retracts Back In
  mainTimeline.to('#drow-popup', { scale: 0.2, opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.15);
  mainTimeline.to('#drow-text', { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, 1.15);
  mainTimeline.to('#logo-strip', { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' }, 1.15);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(0px)', duration: 0.3, ease: 'power2.inOut' }, 1.15);

  // 3. DDAY POPOUT (Time 1.5 - 2.4)
  mainTimeline.to(screenAnim, { frame: 225, ease: "none", duration: 0.3, onUpdate: updateScreenShader }, 1.5);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(3px)', duration: 0.3, ease: 'power2.inOut' }, 1.6);
  mainTimeline.to('#dday-popup', { scale: isMobile ? 0.52 : 0.58, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }, 1.6);
  mainTimeline.fromTo('#dday-text', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1.6);
  mainTimeline.fromTo('#logo-strip-2', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1.6);

  // Dday Popout Retracts Back In
  mainTimeline.to('#dday-popup', { scale: 0.2, opacity: 0, duration: 0.3, ease: 'power2.in' }, 2.1);
  mainTimeline.to('#dday-text', { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, 2.1);
  mainTimeline.to('#logo-strip-2', { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' }, 2.1);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(0px)', duration: 0.3, ease: 'power2.inOut' }, 2.1);

  // 4. SHOE CARD POPOUT (Time 2.5 - 3.8)
  mainTimeline.to(screenAnim, { frame: seqUrls.length, ease: "none", duration: 0.2, onUpdate: updateScreenShader }, 2.5);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(4px)', duration: 0.35, ease: 'power2.inOut' }, 2.6);
  mainTimeline.to('#popup-image', { scale: isMobile ? 0.95 : 1.1, opacity: 1, duration: 0.4, ease: 'back.out(1.2)' }, 2.6);

  // Shoe Card Retracts Back In
  mainTimeline.to('#popup-image', { scale: 0.2, opacity: 0, duration: 0.35, ease: 'power2.in' }, 3.35);
  mainTimeline.to('#webgl-canvas', { filter: 'blur(0px)', duration: 0.35, ease: 'power2.inOut' }, 3.35);

  // 5. SECTION 2B: DISCOVER & SWIPE (Time 3.9 - 5.1)
  if (text2bTop) mainTimeline.to(text2bTop, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 3.9);
  if (text2bBottom) mainTimeline.to(text2bBottom, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 3.9);
  if (text2bTop) mainTimeline.to(text2bTop, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, 4.7);
  if (text2bBottom) mainTimeline.to(text2bBottom, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.in' }, 4.7);

  // 6. SECTION 3: SEARCH (Time 5.2 - 6.7)
  mainTimeline.to(screenAnim, {
    frame: seqUrls.length + secondSeqUrls.length,
    ease: "none",
    duration: 0.8,
    onUpdate: updateScreenShader
  }, 5.2);
  if (text3Top) mainTimeline.to(text3Top, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 5.2);
  if (text3Bottom) mainTimeline.to(text3Bottom, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 5.2);
  if (text3Top) mainTimeline.to(text3Top, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, 6.3);
  if (text3Bottom) mainTimeline.to(text3Bottom, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.in' }, 6.3);

  // 7. SECTIONS 4, 5, 6: FEATURES SHOWCASE (Time 6.8 - 8.5)
  mainTimeline.to(screenAnim, {
    frame: allSeqUrls.length,
    ease: "none",
    duration: 1.4,
    onUpdate: updateScreenShader
  }, 6.8);
  mainTimeline.to(phoneGroup.rotation, { y: Math.PI * 3, duration: 1.4, ease: 'power1.inOut' }, 6.9);

  // 8. SECTION 7: PRICE ALERTS & COMPARE (Time 8.7 - 11.2)
  if (text7Top) mainTimeline.to(text7Top, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 8.7);
  if (text7Bottom) mainTimeline.to(text7Bottom, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 8.7);

  // Popout 1 & 2: Pop out in center & retract back in
  mainTimeline.to(['#popout-1', '#popout-2'], { scale: isMobile ? 0.88 : 1.0, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }, 9.0);
  mainTimeline.to(['#popout-1', '#popout-2'], { scale: 0.2, opacity: 0, duration: 0.35, ease: 'power2.in' }, 9.5);

  // Compare & Alert Popouts: Pop out in center & retract back in
  mainTimeline.to(['#cmp-popout', '#alert-popout'], { scale: isMobile ? 0.88 : 1.0, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }, 10.0);
  mainTimeline.to(['#cmp-popout', '#alert-popout'], { scale: 0.2, opacity: 0, duration: 0.35, ease: 'power2.in' }, 10.5);

  if (text7Top) mainTimeline.to(text7Top, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' }, 10.9);
  if (text7Bottom) mainTimeline.to(text7Bottom, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.in' }, 10.9);

  // 9. TRANSITION INTO COUNTDOWN FOOTER (Time 11.2 - 12.4)
  mainTimeline.to('#webgl-canvas', { y: "-100vh", duration: 1.2, ease: 'none' }, 11.2);
}

// 6. Interaction Logic for Hover (formerly Dragging)
let previousMousePosition = { x: window.innerWidth / 2 };
let targetRotation = 0;
let currentRotation = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.isExclusionZoneHovered = false;

window.addEventListener('pointermove', (e) => {
  // Always track the delta so there are no massive jumps when entering the section
  const deltaX = e.clientX - previousMousePosition.x;
  previousMousePosition.x = e.clientX;

  // --- Raycast GLB Hitbox Detection ---
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(phoneGroup.children, true);

  let isHoveringGLB = false;
  if (intersects.length > 0) {
    for (let i = 0; i < intersects.length; i++) {
      let obj = intersects[i].object;
      let visible = true;
      let curr = obj;
      while (curr) {
        if (!curr.visible) { visible = false; break; }
        curr = curr.parent;
      }
      if (visible && obj.material.opacity > 0.05) {
        isHoveringGLB = true;
        break;
      }
    }
  }

  // --- DOM Pop-out Hitbox Detection ---
  let isHoveringPopout = false;
  // Included alert/cmp popouts and other DOM elements that should exclude the bunny
  const popouts = ['#drow-popup', '#dday-popup', '#popup-image', '#popout-1', '#popout-2', '#alert-popout', '#cmp-popout', '.countdown-page'];
  for (let selector of popouts) {
    const el = document.querySelector(selector);
    if (el) {
      const style = window.getComputedStyle(el);
      const opacity = parseFloat(style.opacity);
      // countdown page doesn't use opacity to hide, so we check if it's visible in viewport
      if (opacity > 0.1 || selector === '.countdown-page') {
        const rect = el.getBoundingClientRect();
        // Skip elements completely off-screen
        if (rect.top >= window.innerHeight || rect.bottom <= 0) continue;
        
        if (e.clientX >= rect.left - 25 && e.clientX <= rect.right + 25 &&
          e.clientY >= rect.top - 25 && e.clientY <= rect.bottom + 25) {
          isHoveringPopout = true;
          break;
        }
      }
    }
  }

  window.isExclusionZoneHovered = isHoveringGLB || isHoveringPopout;

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

// 7. Resize Handler — uses visualViewport on mobile for pixel-accurate canvas sizing.
// window.innerHeight includes browser chrome (address bars, gesture handles) on some
// mobile browsers, causing the canvas to be sized incorrectly and the GLB to appear
// off-centre. visualViewport.height is the true rendered rectangle height.
let lastWidth = window.innerWidth;

function handleResize() {
  // On mobile, prefer visualViewport which excludes browser chrome.
  // Fall back to window dimensions on desktop or where API isn't available.
  const vvp = window.visualViewport;
  const isMobileBreakpoint = window.innerWidth <= 768;

  const currentWidth  = isMobileBreakpoint && vvp ? Math.round(vvp.width)  : window.innerWidth;
  const currentHeight = isMobileBreakpoint && vvp ? Math.round(vvp.height) : window.innerHeight;

  // For desktop: still skip vertical-only changes caused by URL bar jitter.
  if (!isMobileBreakpoint && currentWidth === lastWidth && Math.abs(currentHeight - sizes.height) < 120) {
    return;
  }

  lastWidth = currentWidth;
  sizes.width  = currentWidth;
  sizes.height = currentHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Re-project phone edges after canvas resize
  updatePhoneEdgeVars();

  ScrollTrigger.refresh();
}

window.addEventListener('resize', handleResize);

// visualViewport fires when the address bar appears/hides on mobile — window.resize
// often doesn't fire for those sub-threshold changes, so this is the reliable source.
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handleResize);
}

// 7b. Dynamic Phone Edge Projection
// Projects the 3D phone's bounding box top/bottom into screen-space pixel Y values
// and exposes them as CSS custom properties so text can be anchored strictly above/below.
// Left-side text (desktop) = top text (mobile). Right-side text = bottom text.
function updatePhoneEdgeVars() {
  if (!phoneGroup || phoneGroup.children.length === 0) return;

  // Force matrix updates so projection is accurate after any resize
  phoneGroup.updateWorldMatrix(true, true);

  // Compute world-space bounding box of the phone group
  const box = new THREE.Box3().setFromObject(phoneGroup);

  // Project the top-center and bottom-center points of the bounding box
  const topPoint    = new THREE.Vector3(
    (box.min.x + box.max.x) / 2,
    box.max.y,
    (box.min.z + box.max.z) / 2
  );
  const bottomPoint = new THREE.Vector3(
    (box.min.x + box.max.x) / 2,
    box.min.y,
    (box.min.z + box.max.z) / 2
  );

  // Project from 3D world space → NDC [-1, 1] → screen pixel Y
  topPoint.project(camera);
  bottomPoint.project(camera);

  // NDC Y: +1 = top of screen, -1 = bottom of screen
  // Convert to CSS pixel: pixelY = (1 - ndcY) / 2 * viewportHeight
  const vh = sizes.height;
  const topPx    = Math.round((1 - topPoint.y)    / 2 * vh);
  const bottomPx = Math.round((1 - bottomPoint.y) / 2 * vh);

  // Clamp to sane range to avoid text going fully off-screen
  const safeTopPx    = Math.max(0,  Math.min(topPx,    vh * 0.45));
  const safeBottomPx = Math.max(vh * 0.55, Math.min(bottomPx, vh));

  document.documentElement.style.setProperty('--phone-top-edge',    `${safeTopPx}px`);
  document.documentElement.style.setProperty('--phone-bottom-edge', `${safeBottomPx}px`);
}


// 8. Animation Loop
const clock = new THREE.Clock();
let lastTimelineProgress = 0;
let animationFrameId = null;
let isCanvasVisible = true;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    isCanvasVisible = entry.isIntersecting;
    if (isCanvasVisible) {
      if (!animationFrameId) {
        tick();
      }
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  });
}, { threshold: 0.05 });

if (canvas) {
  observer.observe(canvas);
}

const tick = () => {
  if (!isCanvasVisible) return;

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

  // Check global popout state
  let isAnyPopoutVisible = false;
  const popouts = ['#drow-popup', '#dday-popup', '#popup-image', '#popout-1', '#popout-2', '#cmp-popout', '#alert-popout'];
  for (let selector of popouts) {
    const el = document.querySelector(selector);
    if (el) {
      const opacity = parseFloat(window.getComputedStyle(el).opacity);
      if (opacity > 0.01) {
        isAnyPopoutVisible = true;
        break;
      }
    }
  }
  window.isPopoutPlaying = isAnyPopoutVisible;

  renderer.render(scene, camera);
  animationFrameId = window.requestAnimationFrame(tick);
};

tick();

// Init Tinder-style swipeable card feature
initTinderCards();

// --- 100-Day App Release Countdown Timer ---
(function initCountdownTimer() {
  const targetDate = new Date("Nov 14, 2026 18:10:00").getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      const daysEl = document.getElementById("timer-days");
      const hoursEl = document.getElementById("timer-hours");
      const minutesEl = document.getElementById("timer-minutes");
      const secondsEl = document.getElementById("timer-seconds");

      if (daysEl) daysEl.innerText = "00";
      if (hoursEl) hoursEl.innerText = "00";
      if (minutesEl) minutesEl.innerText = "00";
      if (secondsEl) secondsEl.innerText = "00";
      clearInterval(timerInterval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');

    const daysEl = document.getElementById("timer-days");
    const hoursEl = document.getElementById("timer-hours");
    const minutesEl = document.getElementById("timer-minutes");
    const secondsEl = document.getElementById("timer-seconds");

    if (daysEl) daysEl.innerText = pad(days);
    if (hoursEl) hoursEl.innerText = pad(hours);
    if (minutesEl) minutesEl.innerText = pad(minutes);
    if (secondsEl) secondsEl.innerText = pad(seconds);
  }

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
})();

// --- Privacy Modal Logic (Unlocked Scrolling with Top Nav Scroll Fade) ---
(function initPrivacyGate() {
  const privacyNav = document.getElementById('privacy-nav');
  const privacyModal = document.getElementById('privacy-modal');
  const privacyModalClose = document.getElementById('privacy-modal-close');
  const privacyModalAccept = document.getElementById('privacy-modal-accept');
  const footerPrivacyLink = document.getElementById('footer-privacy-link');
  const footerPrivacyBtn = document.getElementById('footer-privacy-btn');

  // Handle top privacy nav fade-out on scroll (only visible on top screen)
  const handlePrivacyNavScroll = () => {
    if (!privacyNav) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const fadeDistance = 180; // Fade out completely over the first 180px of scroll
    if (scrollY <= 0) {
      privacyNav.style.opacity = '1';
      privacyNav.style.pointerEvents = 'auto';
    } else if (scrollY < fadeDistance) {
      const opacity = 1 - (scrollY / fadeDistance);
      privacyNav.style.opacity = opacity.toString();
      privacyNav.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
    } else {
      privacyNav.style.opacity = '0';
      privacyNav.style.pointerEvents = 'none';
    }
  };

  window.addEventListener('scroll', handlePrivacyNavScroll, { passive: true });
  if (typeof lenis !== 'undefined' && lenis) {
    lenis.on('scroll', handlePrivacyNavScroll);
  }
  handlePrivacyNavScroll();

  const openModal = (e) => {
    if (e) e.preventDefault();
    if (privacyModal) {
      privacyModal.style.display = 'flex';
      setTimeout(() => {
        privacyModal.style.opacity = '1';
        if (privacyModal.querySelector('div')) {
          privacyModal.querySelector('div').style.transform = 'translateY(0)';
        }
      }, 10);
    }
  };

  const closeModal = () => {
    if (privacyModal) {
      privacyModal.style.opacity = '0';
      if (privacyModal.querySelector('div')) {
        privacyModal.querySelector('div').style.transform = 'translateY(20px)';
      }
      setTimeout(() => {
        privacyModal.style.display = 'none';
      }, 300);
    }
  };

  if (privacyNav) privacyNav.addEventListener('click', openModal);
  if (privacyModalClose) privacyModalClose.addEventListener('click', closeModal);
  if (privacyModalAccept) privacyModalAccept.addEventListener('click', closeModal);
  if (footerPrivacyLink) footerPrivacyLink.addEventListener('click', openModal);
  if (footerPrivacyBtn) footerPrivacyBtn.addEventListener('click', openModal);
})();

// --- 6-Dot Left Section Navigation Tracking & Smooth Glide ---
(function initSectionNav() {
  const dots = Array.from(document.querySelectorAll('.section-nav .nav-dot'));
  const glideDot = document.getElementById('nav-glide-dot');
  const navContainer = document.getElementById('section-nav');
  if (dots.length === 0 || !glideDot || !navContainer) return;

  const updateGlideDot = () => {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    const scrollRatio = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    // ── Position: glide continuously along the track ──────────────────────────
    const firstDotY = dots[0].offsetTop + dots[0].offsetHeight / 2;
    const lastDotY = dots[dots.length - 1].offsetTop + dots[dots.length - 1].offsetHeight / 2;
    const targetY = firstDotY + scrollRatio * (lastDotY - firstDotY);
    glideDot.style.top = `${targetY}px`;

    // ── Morph: orb ↔ thin line based on distance from nearest node ───────────
    // exactIndex: 0.0 at dot 0, 1.0 at dot 1, 2.0 at dot 2 … 5.0 at dot 5
    const exactIndex = scrollRatio * (dots.length - 1);
    const nearestIndex = Math.round(exactIndex);
    const distFromNearest = Math.abs(exactIndex - nearestIndex); // 0 = at node, 0.5 = midway

    // morphT: 0 = fully at node (orb), 1 = traveling between nodes (thin line)
    // Collapses fully into a line within 0.25 scroll-steps of leaving a node
    const morphT = Math.min(distFromNearest / 0.25, 1.0);

    // Smooth easing so collapse/expansion feel organic
    const eased = morphT < 0.5
      ? 2 * morphT * morphT
      : 1 - Math.pow(-2 * morphT + 2, 2) / 2;

    // Interpolate width: 14px (orb) → 3px (line)
    const w = 14 - (14 - 3) * eased;
    // Interpolate height: 14px (orb) → 10px (line segment)
    const h = 14 - (14 - 10) * eased;
    // Interpolate border-radius: 7px (circle) → 2px (pill/line cap)
    const r = 7 - (7 - 2) * eased;
    // Interpolate border: 2px white (orb) → 0px (line — pure green, no white border)
    const borderW = Math.round((1 - eased) * 2);

    glideDot.style.width = `${w}px`;
    glideDot.style.height = `${h}px`;
    glideDot.style.borderRadius = `${r}px`;
    glideDot.style.border = borderW > 0 ? `${borderW}px solid #ffffff` : 'none';

    // Glow: bright halo at node, fades while traveling as a line
    const auraSize = Math.round((1 - eased) * 4);
    const glowSize = Math.round((1 - eased) * 14);
    const auraAlpha = ((1 - eased) * 0.25).toFixed(2);
    const glowAlpha = (0.25 + (1 - eased) * 0.4).toFixed(2);
    glideDot.style.boxShadow = `0 0 0 ${auraSize}px rgba(10,98,1,${auraAlpha}), 0 0 ${glowSize}px rgba(10,98,1,${glowAlpha})`;

    // ── Node highlight: dot lights up only when orb is resting over it ────────
    dots.forEach((dot, index) => {
      if (index === nearestIndex && morphT < 0.25) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  };

  // Synchronize on scroll
  window.addEventListener('scroll', updateGlideDot, { passive: true });
  if (typeof lenis !== 'undefined' && lenis) {
    lenis.on('scroll', updateGlideDot);
  }
  // Initial positioning after layout calculation
  setTimeout(updateGlideDot, 100);

  // Click dot to jump directly to section target
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const targetScrollY = (index / 5) * maxScroll;
      
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.scrollTo(targetScrollY, { duration: 1.2 });
      } else {
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    });
  });
})();
