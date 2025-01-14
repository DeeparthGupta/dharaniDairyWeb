// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Menu Toggle Functionality
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const logoContainer = document.querySelector('.logo-container');

if(logoContainer){
	const logo = document.querySelector('.nav-logo');
	const brandText = document.querySelector('.brand-text');		
	
	const scrollToHome = (e) => {
		e.preventDefault();
		const homeSection = document.querySelector('#home-section');
		if(homeSection){
			homeSection.scrollIntoView({
				behavior:'smooth',
				block: 'start'
			});
		}
	};

	//Add click event listeners
	if(logo){
		logo.addEventListener('click', scrollToHome);
	}

	if(brandText){
		brandText.addEventListener('click', scrollToHome);
	}
}


if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });

      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
          if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
              navLinks.classList.remove('active');
              menuToggle.classList.remove('active');
          }
      });

      // Close menu when clicking a link
      const links = navLinks.querySelectorAll('a');
      links.forEach(link => {
          link.addEventListener('click', () => {
              navLinks.classList.remove('active');
              menuToggle.classList.remove('active');
          });
      });
  }

  // Set scroll margin for all sections based on nav height
  const setScrollMargins = () => {
      const navHeight = document.querySelector('.top-nav')?.offsetHeight || 0;
      document.querySelectorAll('section').forEach(section => {
          section.style.scrollMarginTop = navHeight + 'px';
      });
  };

  // Set initial scroll margins
  setScrollMargins();

  // CTA Button Scroll Functionality
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
      ctaButton.addEventListener('click', function() {
          const targetSection = document.querySelector('#' + this.dataset.scrollTo);
          if (targetSection) {
              targetSection.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
              });
          }
      });
  }

  // Contact Form Handling
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
          e.preventDefault();

          // Get form values
          const formData = {
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              phone: document.getElementById('phone').value,
              message: document.getElementById('message').value
          };

          // Send data to backend
          fetch('/submit-form', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData)
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.text();
          })
          .then(data => {
              document.getElementById('form-response').textContent = data;
              contactForm.reset();
          })
          .catch(error => {
              console.error('Error:', error);
              document.getElementById('form-response').textContent = 
                  'An error has occurred. Please try again later.';
          });
      });
  }

  // Handle smooth scrolling for all navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (href !== '#') {
              e.preventDefault();
              const target = document.querySelector(href);
              if (target) {
                  target.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                  });
              }
          }
      });
  });
});

// Scroll-based navigation highlighting using Intersection Observer
const observerOptions = {
  root: null,
  rootMargin: '-80px 0px 0px 0px', // Adjust based on nav height
  threshold: [0.1, 0.5]
};

const handleIntersect = (entries) => {
  entries.forEach(entry => {
      // Animation handling
      if (entry.isIntersecting) {
          entry.target.classList.add('visible');
      }

      // Navigation highlighting
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          document.querySelectorAll('.nav-links a').forEach(link => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${entry.target.id}`) {
                  link.classList.add('active');
              }
          });
      }
  });
};

// Create and start observing
const observer = new IntersectionObserver(handleIntersect, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
  observer.observe(section);
});

// Handle resize events
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
};

window.addEventListener('resize', debounce(() => {
  // Update scroll margins when window is resized
  setScrollMargins();
  
  // Handle mobile menu on resize
  const navLinks = document.querySelector('.nav-links');
  const menuToggle = document.querySelector('.menu-toggle');
  
  if (window.innerWidth > 768) {
      navLinks?.classList.remove('active');
      menuToggle?.classList.remove('active');
  }
}, 250));