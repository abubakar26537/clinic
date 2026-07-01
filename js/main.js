// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const navWrap = document.querySelector('.nav-wrap');
  if (toggle && navWrap) {
    toggle.addEventListener('click', () => {
      navWrap.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', navWrap.classList.contains('menu-open'));
    });
    navWrap.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => navWrap.classList.remove('menu-open'));
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    q && q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Simple scroll-reveal
  const revealEls = document.querySelectorAll('.service-card, .doctor-card, .testimonial-card, .feature-item, .info-card, .stat');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.transition = 'opacity .5s ease, transform .5s ease';
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      io.observe(el);
    });
  }

  // Appointment / contact form (front-end only demo submit)
  const apptForm = document.getElementById('appointment-form');
  if (apptForm) {
    apptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = apptForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Request sent ✓';
      btn.disabled = true;
      setTimeout(() => {
        alert('Thank you! Our front desk will call you within one business day to confirm your appointment.');
        apptForm.reset();
        btn.textContent = original;
        btn.disabled = false;
      }, 900);
    });
  }
});
