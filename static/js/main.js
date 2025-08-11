/**
 * Main JavaScript file for Rafaela's Portfolio
 * Handles interactive functionality and UI enhancements
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeScrollEffects();
    initializeAnimations();
    initializeFormValidation();
    initializeTooltips();
    initializeImageLazyLoading();
    initializeSearchFunctionality();
    initializeSmoothScrolling();
    initializeThemeHandling();
    
    console.log('Portfolio JavaScript initialized successfully');
});

/**
 * Scroll Effects - Add classes based on scroll position
 */
function initializeScrollEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove backdrop blur on scroll
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll direction
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        });
    }
}

/**
 * Animations - Intersection Observer for fade-in effects
 */
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                
                // Add staggered animation for child elements
                const children = entry.target.querySelectorAll('.card, .project-card');
                children.forEach((child, index) => {
                    setTimeout(() => {
                        child.style.opacity = '1';
                        child.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.row, section, .card');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // Prepare child elements for staggered animation
    const cards = document.querySelectorAll('.card, .project-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
}

/**
 * Form Validation - Enhanced client-side validation
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Clear previous error states
            const errorElements = form.querySelectorAll('.error-message');
            errorElements.forEach(el => el.remove());
            
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            inputs.forEach(input => {
                input.classList.remove('is-invalid');
                
                if (!input.value.trim()) {
                    showFieldError(input, 'Este campo é obrigatório');
                    isValid = false;
                }
                
                // Email validation
                if (input.type === 'email' && input.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        showFieldError(input, 'Por favor, insira um email válido');
                        isValid = false;
                    }
                }
                
                // URL validation
                if (input.type === 'url' && input.value) {
                    try {
                        new URL(input.value);
                    } catch {
                        showFieldError(input, 'Por favor, insira uma URL válida');
                        isValid = false;
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Scroll to first error
                const firstError = form.querySelector('.is-invalid');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';
                }
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validateField(this);
                }
            });
        });
    });
}

function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-danger small mt-1';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function validateField(field) {
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.remove('is-invalid', 'is-valid');
    
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }
    
    if (field.type === 'email' && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            showFieldError(field, 'Email inválido');
            return false;
        }
    }
    
    if (field.type === 'url' && field.value) {
        try {
            new URL(field.value);
        } catch {
            showFieldError(field, 'URL inválida');
            return false;
        }
    }
    
    field.classList.add('is-valid');
    return true;
}

/**
 * Tooltips - Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Image Lazy Loading - Optimize image loading
 */
function initializeImageLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

/**
 * Search Functionality - Filter projects
 */
function initializeSearchFunctionality() {
    const searchInput = document.querySelector('#project-search');
    if (!searchInput) return;
    
    const projectCards = document.querySelectorAll('.project-card');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        projectCards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.querySelector('.card-text').textContent.toLowerCase();
            const technologies = card.querySelector('.technologies');
            const techText = technologies ? technologies.textContent.toLowerCase() : '';
            
            const matches = title.includes(searchTerm) || 
                          description.includes(searchTerm) || 
                          techText.includes(searchTerm);
            
            if (matches) {
                card.closest('.col-lg-4, .col-md-6').style.display = 'block';
                card.style.opacity = '1';
            } else {
                card.closest('.col-lg-4, .col-md-6').style.display = 'none';
                card.style.opacity = '0.5';
            }
        });
        
        // Update results count
        const visibleCards = Array.from(projectCards).filter(card => 
            card.closest('.col-lg-4, .col-md-6').style.display !== 'none'
        );
        
        const resultsText = document.querySelector('#search-results');
        if (resultsText) {
            resultsText.textContent = `${visibleCards.length} projeto(s) encontrado(s)`;
        }
    });
}

/**
 * Smooth Scrolling - Enhance anchor link behavior
 */
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Theme Handling - Prepare for potential dark mode
 */
function initializeThemeHandling() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Theme toggle functionality (if toggle exists)
    const themeToggle = document.querySelector('#theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update toggle button
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
    }
}

/**
 * Like Button Functionality
 */
function initializeLikeButtons() {
    const likeButtons = document.querySelectorAll('.like-btn');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add loading state
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Curtindo...';
            
            // The actual AJAX call is handled in the template
            // This just handles the UI feedback
            setTimeout(() => {
                this.disabled = false;
                // Original text will be updated by the AJAX response
            }, 1000);
        });
    });
}

/**
 * Image Upload Preview
 */
function initializeImageUploadPreview() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('O arquivo deve ter no máximo 5MB');
                this.value = '';
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem');
                this.value = '';
                return;
            }
            
            // Create preview
            const reader = new FileReader();
            reader.onload = function(e) {
                let preview = input.parentNode.querySelector('.image-preview');
                if (!preview) {
                    preview = document.createElement('div');
                    preview.className = 'image-preview mt-2';
                    input.parentNode.appendChild(preview);
                }
                
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" 
                         class="img-fluid rounded border" style="max-height: 200px;">
                    <small class="text-muted d-block mt-1">Preview da imagem</small>
                `;
            };
            reader.readAsDataURL(file);
        });
    });
}

/**
 * Auto-save Draft Functionality
 */
function initializeAutoSave() {
    const forms = document.querySelectorAll('form[data-autosave]');
    
    forms.forEach(form => {
        const formId = form.id || 'form-' + Date.now();
        let autoSaveTimer;
        
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    saveFormDraft(formId, form);
                }, 2000);
            });
        });
        
        // Load saved draft on page load
        loadFormDraft(formId, form);
    });
}

function saveFormDraft(formId, form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(`draft-${formId}`, JSON.stringify(data));
    
    // Show save indicator
    showSaveIndicator('Rascunho salvo automaticamente');
}

function loadFormDraft(formId, form) {
    const savedData = localStorage.getItem(`draft-${formId}`);
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.type !== 'file') {
                input.value = data[key];
            }
        });
        
        showSaveIndicator('Rascunho carregado', 'info');
    } catch (e) {
        console.error('Error loading draft:', e);
    }
}

function showSaveIndicator(message, type = 'success') {
    // Remove existing indicator
    const existing = document.querySelector('.save-indicator');
    if (existing) existing.remove();
    
    const indicator = document.createElement('div');
    indicator.className = `save-indicator alert alert-${type} position-fixed`;
    indicator.style.cssText = 'top: 20px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease;';
    indicator.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => indicator.remove(), 300);
    }, 3000);
}

/**
 * Keyboard Shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('#project-search');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                bootstrap.Modal.getInstance(openModal).hide();
            }
        }
    });
}

/**
 * Progress Indicators
 */
function initializeProgressIndicators() {
    // Reading progress for long content
    const content = document.querySelector('.project-content, .about-content');
    if (!content) return;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const contentRect = content.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.pageYOffset;
        
        const progress = (scrolled / documentHeight) * 100;
        progressBar.style.width = Math.min(progress, 100) + '%';
    });
}

// Initialize additional features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeLikeButtons();
    initializeImageUploadPreview();
    initializeAutoSave();
    initializeKeyboardShortcuts();
    initializeProgressIndicators();
});

// Utility Functions
const utils = {
    // Debounce function for performance
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Format date strings
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Copy text to clipboard
    copyToClipboard: function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showSaveIndicator('Link copiado!', 'info');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSaveIndicator('Link copiado!', 'info');
        });
    }
};

// Export utilities for use in other scripts
window.portfolioUtils = utils;

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
