// Interactive features for Mushroom Radar landing page

document.addEventListener('DOMContentLoaded', function() {
    // Dashboard button functionality
    const ctaButton = document.querySelector('.cta-button');
    const mushrooms = document.querySelectorAll('.mushroom');
    
    // Add click handler for dashboard button
    ctaButton.addEventListener('click', function() {
        // Add a loading state
        const originalText = this.textContent;
        this.textContent = 'Loading...';
        this.style.background = 'linear-gradient(135deg, #558b2f 0%, #689f38 100%)';
        
        // Simulate navigation (replace with actual routing in real app)
        setTimeout(() => {
            alert('Dashboard feature coming soon! This would navigate to the main application.');
            this.textContent = originalText;
            this.style.background = 'linear-gradient(135deg, #689f38 0%, #8bc34a 100%)';
        }, 1500);
    });
    
    // Add interactive hover effects for mushrooms
    mushrooms.forEach((mushroom, index) => {
        mushroom.addEventListener('mouseenter', function() {
            // Create ripple effect
            this.style.transform = 'scale(1.2)';
            this.style.filter = 'drop-shadow(0 0 30px rgba(139, 195, 74, 0.6))';
            
            // Add rotation based on index
            const rotation = (index % 2 === 0) ? '5deg' : '-5deg';
            setTimeout(() => {
                this.style.transform += ` rotate(${rotation})`;
            }, 100);
        });
        
        mushroom.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.filter = 'drop-shadow(0 0 15px rgba(139, 195, 74, 0.2))';
        });
        
        // Add click effect
        mushroom.addEventListener('click', function() {
            // Temporary growth animation
            this.style.transition = 'transform 0.1s ease';
            this.style.transform = 'scale(1.3)';
            
            setTimeout(() => {
                this.style.transition = 'transform 0.3s ease';
                this.style.transform = 'scale(1)';
            }, 100);
            
            // Add some fun feedback
            console.log(`🍄 Mushroom ${index + 1} discovered!`);
        });
    });
    
    // Add interactive phone image
    const phoneImage = document.querySelector('.phone-image');
    if (phoneImage) {
        phoneImage.addEventListener('click', function() {
            // Add a subtle click effect
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            console.log('📱 Phone mockup clicked - showing app preview!');
        });
    }
    
    // Add parallax effect on mouse move
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        // Apply subtle parallax to mushrooms
        mushrooms.forEach((mushroom, index) => {
            const speed = (index + 1) * 0.02;
            const x = (mouseX - 0.5) * speed * 100;
            const y = (mouseY - 0.5) * speed * 100;
            
            mushroom.style.transform += ` translate(${x}px, ${y}px)`;
        });
        
        // Apply parallax to phone
        const phone = document.querySelector('.phone-image');
        if (phone) {
            const x = (mouseX - 0.5) * 5;
            const y = (mouseY - 0.5) * 5;
            const currentTransform = phone.style.transform.replace(/translate\([^)]*\)/g, '');
            phone.style.transform = `${currentTransform} translate(${x}px, ${y}px)`;
        }
    });
    
    // Add typing effect to headline (optional enhancement)
    function typeWriter(element, text, speed = 100) {
        element.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.headline, .description, .cta-button');
    animatedElements.forEach(el => observer.observe(el));
    
    // Add smooth scrolling for any future navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Console welcome message
    console.log(`
    🍄 Welcome to Mushroom Radar! 🍄
    
    This landing page showcases:
    • Modern CSS animations and effects
    • Responsive design
    • Interactive elements
    • Smooth user experience
    
    Ready for deployment to Netlify!
    `);
});

// Performance optimization: Reduce animations on low-end devices
if (navigator.hardwareConcurrency <= 2) {
    document.documentElement.style.setProperty('--animation-duration', '0.5s');
}

// Add service worker registration for PWA features (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}
