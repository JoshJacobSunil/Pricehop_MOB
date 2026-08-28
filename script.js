document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for the sticky phone screens
    const sections = document.querySelectorAll('.scroll-text-section');
    const screens = document.querySelectorAll('.phone-screen');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Get the index of the section currently in view
          const targetIndex = entry.target.dataset.index;
          
          // Hide all screens, show the target screen
          screens.forEach((screen, index) => {
            if(index == targetIndex) {
              screen.classList.add('screen-active');
              screen.classList.remove('screen-hidden');
            } else {
              screen.classList.remove('screen-active');
              screen.classList.add('screen-hidden');
            }
          });
        }
      });
    }, { threshold: 0.5 }); // Triggers when section is 50% visible
    
    sections.forEach(sec => observer.observe(sec));


    // 2. Scroll Progress Bar
    const progressBar = document.getElementById('progress-bar');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });


    // 3. Simple Countdown Timer Logic (Mockup for visual purposes)
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');

    // Set launch date to 14 days from now for demo
    let launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 14);

    function updateCountdown() {
        const now = new Date();
        const diff = launchDate - now;

        if(diff <= 0) return;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.innerText = days.toString().padStart(2, '0');
        hoursEl.innerText = hours.toString().padStart(2, '0');
        minsEl.innerText = minutes.toString().padStart(2, '0');
        secsEl.innerText = seconds.toString().padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
});
