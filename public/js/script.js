// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive elements
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const logoContainer = document.querySelector('.logo-container');
    const topNav = document.querySelector('.top-nav');
    const promoButton = document.getElementById('promo-button');
    const navMenuLinks = document.querySelectorAll('.nav-links a[href^="#"]');

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
        fetch(window.location.origin + '/config')
            .then(response => {
                if(!response.ok){
                        throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(config => {
                const backendUrl = config.backendUrl || '/submit-form'; // Fallback to relative URL
                setupFormSubmission(contactForm, backendUrl);
            })
            .catch(error => {
                console.error('Config loading error:', error);
                // Fallback to relative URL if config fails
                setupFormSubmission(contactForm, '/submit-form');
            }); 
	}
	
	function setupFormSubmission(form, submitUrl) {
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			console.log('Form submission started');
	
			const formData = {
				name: document.getElementById('name').value,
				email: document.getElementById('email').value,
				phone: document.getElementById('phone').value,
				message: document.getElementById('message').value
			};
	
			fetch(submitUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData)
			})
			.then(async response => {
                console.log('Response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });
    
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (!response.ok) {
                        throw { 
                            status: response.status, 
                            message: data.error || 'Unknown error',
                            data 
                        };
                    }
                    return data;
                } else {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw { 
                        status: response.status,
                        message: 'Invalid server response',
                        responseText: text
                    };
                }
            })
			.then(data => {
				console.log('Success:', data);
				document.getElementById('form-response').textContent = data.message;
				form.reset();
			})
			.catch(error => {
                console.error('Detailed error:', {
                    status: error.status,
                    message: error.message,
                    data: error.data,
                    responseText: error.responseText,
                    stack: error.stack
                });
                
                document.getElementById('form-response').textContent = 
                    error.message || 'Error submitting form. Please try again.';
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