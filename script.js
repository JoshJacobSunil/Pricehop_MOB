/**
 * PRICEHOP MOBILE — RAYCAST-INSPIRED INTERACTIONS & ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
    initSpotlightEffect();
    initSimulator();
    initQRModal();
    initWaitlistForm();
    initNavbarScroll();
    initMobileMenu();
    initHeroDemo();
});

/* ================= 1. MOUSE-TRACKING SPOTLIGHT EFFECT ================= */
function initSpotlightEffect() {
    const spotlightCards = document.querySelectorAll('.spotlight-card');

    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

/* ================= 2. INTERACTIVE PHONE SIMULATOR ================= */
function initSimulator() {
    const stepItems = document.querySelectorAll('.step-item');
    const simScreens = document.querySelectorAll('.simulator-screen');
    const simBadge = document.getElementById('sim-badge');
    const simTitle = document.getElementById('sim-title');
    const simDesc = document.getElementById('sim-desc');
    const simulatorContainer = document.querySelector('.simulator-container');

    const stepData = [
        {
            badge: "STEP 1 OF 4",
            title: "Discover & Swipe Deals",
            desc: "Smart recommendation algorithm learns what you love."
        },
        {
            badge: "STEP 2 OF 4",
            title: "Compare Real-Time Stores",
            desc: "Live prices from Amazon, Flipkart, Myntra & 50+ stores."
        },
        {
            badge: "STEP 3 OF 4",
            title: "Set Price Drop Radars",
            desc: "Cloud monitoring alerts you instantly when prices drop."
        },
        {
            badge: "STEP 4 OF 4",
            title: "One-Tap Deal Hop",
            desc: "Direct deep-linking to store checkout with auto coupon codes."
        }
    ];

    let currentStep = 0;
    let autoPlayInterval = null;
    let isHovered = false;

    function activateStep(index) {
        currentStep = index;

        // Update Stepper List
        stepItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Update Simulator Screen in iPhone mockup
        simScreens.forEach((screen, i) => {
            screen.classList.toggle('active', i === index);
        });

        // Update Status Card
        if (simBadge && simTitle && simDesc && stepData[index]) {
            simBadge.textContent = stepData[index].badge;
            simTitle.textContent = stepData[index].title;
            simDesc.textContent = stepData[index].desc;
        }
    }

    // Step Item Click Handlers
    stepItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            activateStep(index);
            resetAutoPlay();
        });
    });

    // Auto-advance loop every 4.5 seconds
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            if (!isHovered) {
                const nextStep = (currentStep + 1) % stepItems.length;
                activateStep(nextStep);
            }
        }, 4500);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    if (simulatorContainer) {
        simulatorContainer.addEventListener('mouseenter', () => { isHovered = true; });
        simulatorContainer.addEventListener('mouseleave', () => { isHovered = false; });
    }

    startAutoPlay();
}

/* ================= 3. QR CODE MODAL ================= */
function initQRModal() {
    const openBtn = document.getElementById('open-qr-btn');
    const closeBtn = document.getElementById('close-qr-btn');
    const modal = document.getElementById('qr-modal');

    if (!modal) return;

    function openModal() {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

/* ================= 4. WAITLIST FORM HANDLING ================= */
function initWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const successMsg = document.getElementById('waitlist-success');
    const emailInput = document.getElementById('waitlist-email');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (email && email.includes('@')) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Joining...</span>';
            }

            // Simulate immediate API response
            setTimeout(() => {
                form.style.display = 'none';
                if (successMsg) {
                    successMsg.classList.add('show');
                }
            }, 600);
        }
    });
}

/* ================= 5. NAVBAR SCROLL ENHANCEMENT ================= */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar-container');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 11, 15, 0.85)';
            navbar.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
        } else {
            navbar.style.background = 'rgba(12, 13, 18, 0.65)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        }
    }, { passive: true });
}

/* ================= 6. MOBILE MENU ================= */
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        const isOpen = navLinks.style.display === 'flex';
        navLinks.style.display = isOpen ? 'none' : 'flex';
        
        if (!isOpen) {
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '20px';
            navLinks.style.right = '20px';
            navLinks.style.flexDirection = 'column';
            navLinks.style.background = '#0E1017';
            navLinks.style.padding = '20px';
            navLinks.style.borderRadius = '16px';
            navLinks.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            navLinks.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8)';
        }
    });

    // Close on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        });
    });
}

/* ================= 7. HERO DEMO SCROLL ================= */
function initHeroDemo() {
    const heroDemoBtn = document.getElementById('hero-demo-btn');
    const simulatorSection = document.getElementById('simulator');

    if (heroDemoBtn && simulatorSection) {
        heroDemoBtn.addEventListener('click', () => {
            simulatorSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}
