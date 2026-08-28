document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.scroll-text-section');
    const screens = document.querySelectorAll('.phone-screen');
    const bgPops = document.querySelectorAll('.floating-behind');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetIndex = entry.target.dataset.index;
          
          // Toggle phone screens
          screens.forEach((screen, index) => {
            if(index == targetIndex) {
              screen.classList.add('screen-active');
              screen.classList.remove('screen-hidden');
            } else {
              screen.classList.remove('screen-active');
              screen.classList.add('screen-hidden');
            }
          });

          // Toggle background popouts for State 3 (index 3)
          if(targetIndex == 3) {
            bgPops.forEach(pop => {
                pop.classList.add('screen-active');
                pop.classList.remove('screen-hidden');
            });
          } else {
            bgPops.forEach(pop => {
                pop.classList.remove('screen-active');
                pop.classList.add('screen-hidden');
            });
          }
        }
      });
    }, { threshold: 0.5 });
    
    sections.forEach(sec => observer.observe(sec));

    const progressBar = document.getElementById('progress-bar');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');

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

        if(daysEl) {
            daysEl.innerText = days.toString().padStart(2, '0');
            hoursEl.innerText = hours.toString().padStart(2, '0');
            minsEl.innerText = minutes.toString().padStart(2, '0');
            secsEl.innerText = seconds.toString().padStart(2, '0');
        }
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
});
