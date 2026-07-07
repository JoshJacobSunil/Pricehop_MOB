import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImage from './src/assets/hero.png';
import ip1Image from './src/assets/ip1.png';
import ip2Image from './src/assets/ip2.png';
import ip3Image from './src/assets/ip3.png';
import ip4Image from './src/assets/ip4.png';

gsap.registerPlugin(ScrollTrigger);

// 1. Scene Setup
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

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
  screenTexture.flipY = false; // GLTF models usually need flipY = false for textures
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const extraTextures = [
    textureLoader.load(ip1Image),
    textureLoader.load(ip2Image),
    textureLoader.load(ip3Image),
    textureLoader.load(ip4Image),
  ];
  extraTextures.forEach(t => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; });

  model.traverse((child) => {
    if (child.isMesh) {
      // Remove apple logo completely
      const name = child.name.toLowerCase();
      const matName = child.material.name.toLowerCase();
      if (name.includes('logo') || matName.includes('logo') || name.includes('apple') || matName.includes('apple')) {
        child.visible = false;
      }

      if (child.material.name.includes('Screen') || child.material.name === '17ProMax_Screen') {
        child.material = new THREE.MeshBasicMaterial({
          map: screenTexture
        });
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
      scrub: 1, // Smooth scrubbing
    }
  });

  // --- SIZE EDITING: Modify the 'scale' values in the timelines below (x, y, z must be equal) ---

  // Section 2: Minimizes, moves to left side, turned to right, full phone visible
  mainTimeline.to(phoneGroup.position, { x: isMobile ? 0 : -1.5, y: 0, z: 0, ease: 'power1.inOut' }, 0)
    .to(phoneGroup.scale, { x: 18.5, y: 18.5, z: 18.5, ease: 'power1.inOut' }, 0) // was 3.5
    .to(phoneGroup.rotation, { x: 0, y: Math.PI + Math.PI / 6, z: 0, ease: 'power1.inOut' }, 0);

  // Section 3: Zooms back in to center, top 40% seen
  mainTimeline.to(phoneGroup.position, { x: 0, y: -2.2, z: 0, ease: 'power1.inOut' }, 1)
    .to(phoneGroup.scale, { x: 36.5, y: 36.5, z: 36.5, ease: 'power1.inOut' }, 1) // was 7.5
    .to(phoneGroup.rotation, { x: 0, y: Math.PI, z: 0, ease: 'power1.inOut' }, 1);

  // Section 4: 360-Degree Spinning Circle (Carousel)
  // Scale down so all 5 phones fit on screen, and shift Y slightly to center vertically
  mainTimeline.to(phoneGroup.position, { x: 0, y: -0.9, z: 0, ease: 'power1.inOut' }, 2)
    .to(phoneGroup.scale, { x: 11.7, y: 11.7, z: 11.7, ease: 'power1.inOut' }, 2);

  const radius = 0.143; // Brought phones 35% closer (was 0.22)

  // Move the main phone (index 0) to the rim of the circle
  const mainPhone = phoneGroup.children[0];
  mainTimeline.to(mainPhone.position, {
    x: Math.sin(0) * radius,
    y: 0,
    z: -Math.cos(0) * radius,
    ease: 'power1.inOut'
  }, 2);
  mainTimeline.to(mainPhone.rotation, {
    y: 0,
    ease: 'power1.inOut'
  }, 2);

  // Position the 4 extra phones around the rest of the circle
  extraPhones.forEach((phone, i) => {
    const index = i + 1; // 1 to 4
    // Negative angle to make them appear to the right since rotation is anticlockwise
    const angle = -index * (Math.PI * 2 / 5);

    // Stagger their emergence slightly so they appear from behind each other gracefully
    const startTime = 2 + (i * 0.1);

    // Show them and scale up directly in their target positions to avoid overlap with main phone
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

  // After they reach their perfect positions, spin the whole group exactly 360 degrees
  // Starts earlier at 2.2 and takes longer (duration 0.8) to make it slower
  mainTimeline.to(phoneGroup.rotation, { x: 0, y: Math.PI * 3, z: 0, duration: 0.8, ease: 'power1.inOut' }, 2.2);

  // Auto-snap the interactive group rotation when scrolling past the circle section
  // This ensures the main phone aligns perfectly before they fly away.
  mainTimeline.call(() => {
    targetRotation = Math.round(targetRotation / (Math.PI * 2)) * (Math.PI * 2);
  }, null, 2.9);

  // Section 5: Extra phones go up and disappear, main phone back to normal center
  // Lowered y to -1.0 so it moves center-down and the top is completely visible
  mainTimeline.to(phoneGroup.position, { x: 0, y: -1.5, z: 0, ease: 'power1.inOut' }, 3)
    .to(phoneGroup.scale, { x: 18.0, y: 18.0, z: 18.0, ease: 'power1.inOut' }, 3);

  // Return main phone to local center
  mainTimeline.to(mainPhone.position, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 3);
  mainTimeline.to(mainPhone.rotation, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 3);

  extraPhones.forEach((phone, i) => {
    // Fly up gracefully and out of screen, while scaling down
    mainTimeline.to(phone.position, {
      y: 1.5, // fly high up
      x: Math.sin(-i * Math.PI) * 0.5, // spread them slightly as they fly up
      ease: 'power2.inOut'
    }, 3);
    mainTimeline.to(phone.scale, {
      x: 0.001, y: 0.001, z: 0.001,
      ease: 'power2.inOut'
    }, 3);
    // Hide them after they shrink
    mainTimeline.set(phone, { visible: false }, 4);
  });

  // Section 6: Moves to left center, turns/tilts slightly
  mainTimeline.to(phoneGroup.position, { x: window.innerWidth < 768 ? 0 : -1.5, y: -1.5, z: 0, ease: 'power1.inOut' }, 4)
    .to(phoneGroup.rotation, { x: 0, y: (Math.PI * 3) + Math.PI / 12, z: -0.05, ease: 'power1.inOut' }, 4);

  // Grab specific text wrappers
  const text2 = document.querySelector('#section-2 .content-wrapper');
  const text3Left = document.querySelector('#section-3 .split-left');
  const text3Right = document.querySelector('#section-3 .split-right');
  const text4 = document.querySelector('#section-4 .content-wrapper');
  const text5 = document.querySelector('#section-5 .content-wrapper');
  const text6 = document.querySelector('#section-6 .content-wrapper');

  // Link text fading perfectly to the 3D model's timeline
  // The phone animations happen from time T to T+0.5
  // We fade OUT old text from T to T+0.25
  // We fade IN new text from T+0.25 to T+0.5

  // Time 0: Phone moves left. Text 2 fades in.
  mainTimeline.to(text2, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 0.25);

  // Time 1: Phone moves center. Text 2 out, Text 3 in.
  mainTimeline.to(text2, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 1.0);
  mainTimeline.to([text3Left, text3Right], { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 1.25);

  // Time 2: Phone moves right. Text 3 out, Text 4 in.
  mainTimeline.to([text3Left, text3Right], { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 2.0);
  mainTimeline.to(text4, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 2.25);

  // Time 3: Phone moves center. Text 4 out, Text 5 in.
  mainTimeline.to(text4, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 3.0);
  mainTimeline.to(text5, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 3.25);

  // Time 4: Phone moves left. Text 5 out, Text 6 in.
  mainTimeline.to(text5, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 4.0);
  mainTimeline.to(text6, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 4.25);

  // Time 5: Footer. Text 6 out. (Phone animation stops completely here)
  mainTimeline.to(text6, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 5.0);
}

// 6. Interaction Logic for Dragging
let isDragging = false;
let previousMousePosition = { x: 0 };
let targetRotation = 0;
let currentRotation = 0;

window.addEventListener('pointerdown', (e) => {
  if (mainTimeline) {
    const t = mainTimeline.time();
    // Allow drag only during the circle animation (Time 2.0 to 3.0)
    if (t >= 2.0 && t < 3.0) {
      isDragging = true;
      previousMousePosition.x = e.clientX;
    }
  }
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

window.addEventListener('pointercancel', () => {
  isDragging = false;
});

window.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - previousMousePosition.x;
    previousMousePosition.x = e.clientX;
    targetRotation += deltaX * 0.005; // Drag sensitivity
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
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

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
