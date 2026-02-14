import React from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import Aurora from './js/Aurora.js';

// Main landing page JavaScript

// Smooth scrolling for navigation links
const navLinks = document.querySelectorAll('a[href^="#"]');

navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navigation
const header = document.querySelector('.header');
let lastScrollTop = 0;

window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
        header.style.background = 'rgba(10, 10, 10, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'transparent';
        header.style.backdropFilter = 'none';
    }

    lastScrollTop = scrollTop;
});

// Add hover effects to background elements
const bgElements = document.querySelectorAll('.bg-element');

bgElements.forEach((element, index) => {
    element.addEventListener('mouseenter', function () {
        this.style.borderColor = 'rgba(139, 195, 74, 0.3)';
        this.style.transform = 'scale(1.1)';
    });

    element.addEventListener('mouseleave', function () {
        this.style.borderColor = 'rgba(139, 195, 74, 0.1)';
        this.style.transform = 'scale(1)';
    });
});

// Parallax effect for background elements
window.addEventListener('mousemove', function (e) {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    bgElements.forEach((element, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX - 0.5) * speed * 50;
        const y = (mouseY - 0.5) * speed * 50;

        element.style.transform += ` translate(${x}px, ${y}px)`;
    });
});

// Add intersection observer for animations
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

// Observe sections
const sections = document.querySelectorAll('.section');
sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Console welcome message
console.log(`
    🌟 Welcome to GINKGOLABS! 🌟
    
    Radically reimagining the future of intelligence
    with innovative AI technologies.
    
    Visit our products:
    • Mushroom Radar - Neural networks meet nature's networks
    
    Built with modern web technologies for optimal performance.
    `);

const container = document.getElementById('aurora-background');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
        React.createElement(
            React.StrictMode,
            null,
            React.createElement(Aurora, {
                colorStops: ['#C9972A', '#7cff67', '#802699'],
                blend: 0.8,
                amplitude: 0.5,
                speed: 2
            })
        )
    );
}

// Mobile Menu Functionality
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const body = document.body;

if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function () {
        mobileMenuBtn.classList.toggle('active');
        mobileNav.classList.toggle('open');
        body.classList.toggle('mobile-menu-open');
    });

    // Close menu when clicking on a link
    const mobileNavLinks = mobileNav.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function () {
            mobileMenuBtn.classList.remove('active');
            mobileNav.classList.remove('open');
            body.classList.remove('mobile-menu-open');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenuBtn.classList.remove('active');
            mobileNav.classList.remove('open');
            body.classList.remove('mobile-menu-open');
        }
    });
}

// Add smooth transitions
document.documentElement.style.scrollBehavior = 'smooth';
