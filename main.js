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
let phoneGroup = new THREE.Group();
let extraPhones = [];
scene.add(phoneGroup);

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

function setupScrollAnimations() {
  // We have 6 sections. 
  // Hero (0) -> Section 2 (1) -> Section 3 (2) -> Section 4 (3) -> Section 5 (4) -> Section 6 (5)
  const isMobile = window.innerWidth < 768;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1, // Smooth scrubbing
    }
  });

  // --- SIZE EDITING: Modify the 'scale' values in the timelines below (x, y, z must be equal) ---

  // Section 2: Minimizes, moves to left side, turned to right, full phone visible
  timeline.to(phoneGroup.position, { x: isMobile ? 0 : -1.5, y: 0, z: 0, ease: 'power1.inOut' }, 0)
    .to(phoneGroup.scale, { x: 18.5, y: 18.5, z: 18.5, ease: 'power1.inOut' }, 0) // was 3.5
    .to(phoneGroup.rotation, { x: 0, y: Math.PI + Math.PI / 6, z: 0, ease: 'power1.inOut' }, 0);

  // Section 3: Zooms back in to center, top 40% seen
  timeline.to(phoneGroup.position, { x: 0, y: -2.2, z: 0, ease: 'power1.inOut' }, 1)
    .to(phoneGroup.scale, { x: 36.5, y: 36.5, z: 36.5, ease: 'power1.inOut' }, 1) // was 7.5
    .to(phoneGroup.rotation, { x: 0, y: Math.PI, z: 0, ease: 'power1.inOut' }, 1);

  // Section 4: 360-Degree Spinning Spiral Staircase (Carousel)
  // Scale down so all 5 phones fit on screen, and shift Y slightly to center vertically
  timeline.to(phoneGroup.position, { x: 0, y: -0.6, z: 0, ease: 'power1.inOut' }, 2)
    .to(phoneGroup.scale, { x: 7.0, y: 7.0, z: 7.0, ease: 'power1.inOut' }, 2)
    .to(phoneGroup.rotation, { x: 0, y: Math.PI, z: 0, ease: 'power1.inOut' }, 2); 

  const radius = 0.143; // Brought phones 35% closer (was 0.22)

  // Move the main phone (index 0) to the rim of the circle
  const mainPhone = phoneGroup.children[0];
  timeline.to(mainPhone.position, {
    x: Math.sin(0) * radius,
    y: 0, 
    z: -Math.cos(0) * radius,
    ease: 'power1.inOut'
  }, 2);
  timeline.to(mainPhone.rotation, {
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
    
    // Show them and start at center, animate scale from 0 to 1 for smoothness
    timeline.set(phone, { visible: true }, startTime);
    timeline.set(phone.scale, { x: 0.001, y: 0.001, z: 0.001 }, startTime); 
    timeline.set(phone.position, { x: 0, y: 0, z: 0 }, startTime); 
    timeline.set(phone.rotation, { x: 0, y: 0, z: 0 }, startTime);
    
    timeline.to(phone.scale, {
      x: 1, y: 1, z: 1,
      ease: 'power2.out'
    }, startTime);
    
    timeline.to(phone.position, {
      x: Math.sin(angle) * radius,
      y: index * 0.08, // step up to form spiral stair
      z: -Math.cos(angle) * radius,
      ease: 'power2.out'
    }, startTime);
    
    timeline.to(phone.rotation, {
      y: -angle, // face outward
      ease: 'power1.inOut'
    }, startTime);

    // After half of the circle spin (spin is 2.5 to 3.0), flatten the stairs into a complete circle
    // So starting at 2.75, bring all phones to y = 0
    timeline.to(phone.position, {
      y: 0,
      ease: 'power1.inOut',
      duration: 0.25
    }, 2.75);
  });

  // After they reach their perfect positions, spin the whole group 360 degrees!
  // This happens from time 2.5 to 3.0
  timeline.to(phoneGroup.rotation, { x: 0, y: Math.PI * 3, z: 0, ease: 'power1.inOut' }, 2.5);

  // Section 5: Extra phones go up and disappear, main phone back to normal center
  // Restored y: -0.2 so the phone fits normally like before and isn't cut off
  timeline.to(phoneGroup.position, { x: isMobile ? 0 : -1.5, y: -0.2, z: 0, ease: 'power1.inOut' }, 3)
    .to(phoneGroup.scale, { x: 18.0, y: 18.0, z: 18.0, ease: 'power1.inOut' }, 3)
    // Keep the Math.PI * 3 rotation so it doesn't spin backwards!
    .to(phoneGroup.rotation, { x: 0, y: Math.PI * 3, z: 0, ease: 'power1.inOut' }, 3);

  // Return main phone to local center
  timeline.to(mainPhone.position, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 3);
  timeline.to(mainPhone.rotation, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 3);

  extraPhones.forEach((phone, i) => {
    // Fly up gracefully and out of screen, while scaling down
    timeline.to(phone.position, {
      y: 1.5, // fly high up
      x: Math.sin(-i * Math.PI) * 0.5, // spread them slightly as they fly up
      ease: 'power2.inOut'
    }, 3);
    timeline.to(phone.scale, {
      x: 0.001, y: 0.001, z: 0.001,
      ease: 'power2.inOut'
    }, 3);
    // Hide them after they shrink
    timeline.set(phone, { visible: false }, 4);
  });

  // Section 6: Moves to left, turned a bit to right (final motion)
  timeline.to(phoneGroup.position, { x: isMobile ? 0 : -1.5, y: 0, z: 0, ease: 'power1.inOut' }, 4)
    .to(phoneGroup.scale, { x: 18.5, y: 18.5, z: 18.5, ease: 'power1.inOut' }, 4)
    // Keep continuous rotation direction
    .to(phoneGroup.rotation, { x: 0, y: (Math.PI * 3) + Math.PI / 6, z: 0, ease: 'power1.inOut' }, 4);

  // Grab specific text wrappers
  const text2 = document.querySelector('#section-2 .content-wrapper');
  const text3Left = document.querySelector('#section-3 .split-left');
  const text3Right = document.querySelector('#section-3 .split-right');
  const text4 = document.querySelector('#section-4 .content-wrapper');
  const text5 = document.querySelector('#section-5 .content-wrapper');

  // Link text fading perfectly to the 3D model's timeline
  // The phone animations happen from time T to T+0.5
  // We fade OUT old text from T to T+0.25
  // We fade IN new text from T+0.25 to T+0.5

  // Time 0: Phone moves left. Text 2 fades in.
  timeline.to(text2, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 0.25);

  // Time 1: Phone moves center. Text 2 out, Text 3 in.
  timeline.to(text2, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 1.0);
  timeline.to([text3Left, text3Right], { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 1.25);

  // Time 2: Phone moves right. Text 3 out, Text 4 in.
  timeline.to([text3Left, text3Right], { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 2.0);
  timeline.to(text4, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 2.25);

  // Time 3: Phone moves center. Text 4 out, Text 5 in.
  timeline.to(text4, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 3.0);
  timeline.to(text5, { opacity: 1, duration: 0.25, ease: 'power1.inOut' }, 3.25);

  // Time 4: Phone moves left. Text 5 out.
  timeline.to(text5, { opacity: 0, duration: 0.25, ease: 'power1.inOut' }, 4.0);

  // About Us (Footer) - keeps the phone mostly there but faded slightly or just statically there
  timeline.to(phoneGroup.position, { y: 1.0, ease: 'power1.inOut' }, 5)
    .to(phoneGroup.rotation, { y: Math.PI + Math.PI / 4, ease: 'power1.inOut' }, 5);
}

// 6. Resize Handler
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 7. Animation Loop
const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Very subtle floating animation (optional, only if ScrollTrigger isn't aggressively pinning it)
  // if(phoneGroup) {
  //   phoneGroup.position.y += Math.sin(elapsedTime) * 0.001;
  // }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
