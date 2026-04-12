/**
 * Navigation — menu toggle, smooth scrolling, scroll animations, active link.
 */

import { CONFIG } from './state.js';

export function initNavigation() {
    var nav = document.getElementById('nav');
    var navToggle = document.getElementById('nav-toggle');
    var navMenu = document.getElementById('nav-menu');

    function updateNavScrolledState() {
        if (window.pageYOffset > CONFIG.scrollOffset) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNavScrolledState);
    window.addEventListener('resize', updateNavScrolledState);
    updateNavScrolledState();

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
    }

    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            navMenu.classList.remove('open');
            if (navToggle) navToggle.classList.remove('open');
        });
    });

    document.addEventListener('click', function (e) {
        if (navMenu.classList.contains('open') &&
            !navMenu.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navMenu.classList.remove('open');
            navToggle.classList.remove('open');
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var headerOffset = nav.offsetHeight;
                var elementPosition = target.getBoundingClientRect().top;
                var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
}

export function initScrollAnimations() {
    var animatedElements = document.querySelectorAll('.animate-on-scroll');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: CONFIG.animationThreshold,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(function (el) { observer.observe(el); });
}

export function initActiveNavigation() {
    var sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function () {
        var current = '';
        sections.forEach(function (section) {
            if (window.pageYOffset >= section.offsetTop - 200) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}
