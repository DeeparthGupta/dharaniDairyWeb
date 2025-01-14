// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive elements
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const logoContainer = document.querySelector('.logo-container');
    const topNav = document.querySelector('.top-nav');

    // Menu Toggle Functionality
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
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
            link.addEventListener('click', (e) => {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // Logo and brand text scroll to home functionality
    if (logoContainer) {
        const logo = logoContainer.querySelector('.nav-logo');
        const brandText = logoContainer.querySelector('.brand-text');        
        
        const scrollToHome = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const homeSection = document.querySelector('#home-section');
            if (homeSection) {
                homeSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        };

        // Prevent unwanted scroll behavior on logo container
        logoContainer.addEventListener('click', (e) => {
            if (e.target === logoContainer) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Add click event listeners for logo and brand text
        if (logo) {
            logo.addEventListener('click', scrollToHome, true);
        }
        if (brandText) {
            brandText.addEventListener('click', scrollToHome, true);
        }
    }

    // Prevent unwanted scroll behavior in nav area
    if (topNav) {
        topNav.addEventListener('click', function(e) {
            if (e.target === this || e.target.classList.contains('nav-container')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
    }

    // Handle smooth scrolling for navigation menu links
    const navMenuLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navMenuLinks.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.stopPropagation();
            const href = this.getAttribute('href');
            if (href && href !== '#') {
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
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
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
});

// Debounce function for handling resize events
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

// Handle resize events
window.addEventListener('resize', debounce(() => {
    // Update scroll margins when window is resized
    const setScrollMargins = () => {
        const navHeight = document.querySelector('.top-nav')?.offsetHeight || 0;
        document.querySelectorAll('section').forEach(section => {
            section.style.scrollMarginTop = navHeight + 'px';
        });
    };
    setScrollMargins();
    
    // Handle mobile menu on resize
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth > 768) {
        navLinks?.classList.remove('active');
        menuToggle?.classList.remove('active');
    }
}, 250));