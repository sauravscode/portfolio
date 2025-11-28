// ========================================
// APPLICATION LOGIC
// ========================================

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Render all content sections
 */
function render() {
    renderExperience();
    renderProjects();
    renderPhotos();
    renderBooks();
}

/**
 * Render experience section
 */
function renderExperience() {
    const container = document.getElementById('exp-inject');
    if (!container) return;

    container.innerHTML = expData.map(exp => `
        <div class="exp-row">
            <div class="exp-meta">
                <div>${sanitizeHTML(exp.time)}</div>
                <div>// ${sanitizeHTML(exp.role)}</div>
            </div>
            <div class="exp-content">
                <span class="exp-company">${sanitizeHTML(exp.company)}</span>
                <p>${sanitizeHTML(exp.desc)}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Render projects grid
 */
function renderProjects() {
    const container = document.getElementById('proj-inject');
    if (!container) return;

    container.innerHTML = projData.map((proj, index) => `
        <div class="project-card">
            <div>
                <div class="p-header">
                    <div class="p-id">0${index + 1}</div>
                    <div class="p-stack">
                        ${proj.stack.map(tech =>
        `<span class="tag">${sanitizeHTML(tech)}</span>`
    ).join(' ')}
                    </div>
                </div>
                <h3 class="p-title">${sanitizeHTML(proj.title)}</h3>
                <p class="p-desc">${sanitizeHTML(proj.desc)}</p>
            </div>
            <div class="p-footer">
                <span class="p-status">STATUS: DEPLOYED</span>
                <button class="btn" onclick="openModal(${proj.id})" aria-label="View details for ${sanitizeHTML(proj.title)}">Inspect</button>
            </div>
        </div>
    `).join('');
}

/**
 * Render photography gallery
 */
function renderPhotos() {
    const container = document.getElementById('photo-inject');
    if (!container) return;

    container.innerHTML = photoData.map(photo => {
        const safeUrl = sanitizeHTML(photo.url);
        const safeAlt = sanitizeHTML(photo.alt);
        const safeTitle = sanitizeHTML(photo.title);
        const safeLocation = sanitizeHTML(photo.location);

        return `
            <div class="photo-frame" 
                 onclick="viewPhoto('${safeUrl}', '${safeAlt}')" 
                 role="button" 
                 tabindex="0"
                 onkeypress="if(event.key==='Enter') viewPhoto('${safeUrl}', '${safeAlt}')"
                 aria-label="View photo: ${safeTitle}, ${safeLocation}">
                <img src="${safeUrl}" 
                     alt="${safeAlt}" 
                     loading="lazy">
                <div class="photo-meta">
                    <span>${safeTitle}</span>
                    <span>${safeLocation}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render books tables
 */
function renderBooks() {
    const readingContainer = document.getElementById('books-reading');
    const finishedContainer = document.getElementById('books-finished');

    if (!readingContainer || !finishedContainer) return;

    const createRow = (book, status, color) => `
        <tr>
            <td>
                <b>${sanitizeHTML(book.title)}</b><br>
                <span style="font-size:0.85em; color:#666">by ${sanitizeHTML(book.author)}</span>
            </td>
            <td>
                <span class="status-dot" style="background:${color}" aria-hidden="true"></span>${status}
            </td>
        </tr>
    `;

    readingContainer.innerHTML = booksReading
        .map(book => createRow(book, "READING", "#00f0ff"))
        .join('');

    finishedContainer.innerHTML = booksDone
        .map(book => createRow(book, "ARCHIVED", "#888"))
        .join('');
}

/**
 * Toggle mobile navigation menu
 */
function toggleMenu() {
    const navList = document.getElementById('nav-list');
    const toggle = document.querySelector('.mobile-toggle');

    if (navList) {
        const isOpen = navList.classList.toggle('mobile-open');

        // Update button text
        if (toggle) {
            toggle.textContent = isOpen ? 'MENU [-]' : 'MENU [+]';
            toggle.setAttribute('aria-expanded', isOpen);
        }
    }
}

/**
 * Navigate to different pages with smooth loading transition
 * @param {string} pageId - ID of page to navigate to
 */
function route(pageId) {
    // Validate pageId
    const validPages = ['home', 'experience', 'projects', 'books', 'photography'];
    if (!validPages.includes(pageId)) {
        console.error(`Invalid page ID: ${pageId}`);
        return;
    }

    // Add loading state
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        currentPage.classList.add('page-loading');
    }

    // Smooth transition after brief delay
    setTimeout(() => {
        // Remove active class from all pages and nav items
        document.querySelectorAll('.page').forEach(page =>
            page.classList.remove('active', 'page-loading')
        );
        document.querySelectorAll('.nav-item').forEach(nav =>
            nav.classList.remove('active')
        );

        // Add active class to target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');

            // Update page title
            updatePageTitle(pageId);
        }

        // Update active nav item
        updateActiveNavItem(pageId);

        // Close mobile menu if open
        const navList = document.getElementById('nav-list');
        const toggle = document.querySelector('.mobile-toggle');
        if (navList && navList.classList.contains('mobile-open')) {
            navList.classList.remove('mobile-open');
            if (toggle) {
                toggle.textContent = 'MENU [+]';
                toggle.setAttribute('aria-expanded', 'false');
            }
        }

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

/**
 * Update page title based on current page
 * @param {string} pageId - Current page ID
 */
function updatePageTitle(pageId) {
    const titles = {
        'home': 'Saurav Sudhar | Software Engineer',
        'experience': 'Experience | Saurav Sudhar',
        'projects': 'Projects | Saurav Sudhar',
        'books': 'Books | Saurav Sudhar',
        'photography': 'Photography | Saurav Sudhar'
    };

    document.title = titles[pageId] || titles['home'];
}

/**
 * Update active navigation item
 * @param {string} pageId - Current page ID
 */
function updateActiveNavItem(pageId) {
    const navMapping = {
        'home': 'index',
        'experience': 'logs',
        'projects': 'systems',
        'books': 'data',
        'photography': 'visuals'
    };

    const targetText = navMapping[pageId];
    if (!targetText) return;

    document.querySelectorAll('.nav-item').forEach(item => {
        const itemText = item.textContent.toLowerCase();
        if (itemText.includes(targetText)) {
            item.classList.add('active');
        }
    });
}

/**
 * Open project modal
 * @param {number} projectId - ID of project to display
 */
function openModal(projectId) {
    const project = projData.find(p => p.id === projectId);
    if (!project) {
        console.error(`Project not found: ${projectId}`);
        return;
    }

    // Populate modal content
    const titleElement = document.getElementById('m-title');
    const descElement = document.getElementById('m-desc');
    const tagsElement = document.getElementById('m-tags');
    const linkElement = document.getElementById('m-link');

    if (titleElement) titleElement.textContent = project.title;
    if (descElement) descElement.textContent = project.full;

    if (tagsElement) {
        tagsElement.innerHTML = project.stack
            .map(tech => `<span class="tag">${sanitizeHTML(tech)}</span>`)
            .join('');
    }

    // Handle GitHub link
    if (linkElement) {
        if (project.github) {
            linkElement.href = project.github;
            linkElement.style.display = 'inline-flex';
        } else {
            linkElement.style.display = 'none';
        }
    }

    // Show modal
    const overlay = document.getElementById('project-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on close button for accessibility
        const closeButton = overlay.querySelector('.modal-close');
        if (closeButton) {
            setTimeout(() => closeButton.focus(), 100);
        }
    }
}

/**
 * Close project modal
 */
function closeModal() {
    const overlay = document.getElementById('project-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Open photo in lightbox
 * @param {string} url - URL of photo to display
 * @param {string} alt - Alt text for photo
 */
function viewPhoto(url, alt = '') {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lb-img');

    if (lightbox && img) {
        img.src = url;
        img.alt = alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on close button for accessibility
        const closeButton = lightbox.querySelector('.lightbox-close');
        if (closeButton) {
            setTimeout(() => closeButton.focus(), 100);
        }
    }
}

/**
 * Close photo lightbox
 */
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Handle keyboard navigation for modal/lightbox
 */
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeLightbox();
    }
}

/**
 * Handle clicks outside modal to close
 */
function handleOverlayClick(e) {
    const projectOverlay = document.getElementById('project-overlay');
    const lightbox = document.getElementById('lightbox');

    // Close project modal if clicking on overlay background
    if (e.target === projectOverlay) {
        closeModal();
    }

    // Close lightbox if clicking on overlay background
    if (e.target === lightbox) {
        closeLightbox();
    }
}

/**
 * Add keyboard support for navigation items
 */
function initKeyboardNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
}

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Handle browser back/forward navigation
 */
function initHistoryNavigation() {
    // This is a basic implementation - can be enhanced with proper URL routing
    window.addEventListener('popstate', () => {
        // For now, just go to home
        route('home');
    });
}

/**
 * Lazy load images when they come into viewport
 */
function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Performance monitoring (optional - for development)
 */
function logPerformance() {
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page Load Time: ${pageLoadTime}ms`);
        });
    }
}

/**
 * Error boundary for graceful error handling
 */
window.addEventListener('error', (event) => {
    console.error('Application Error:', event.error);
    // Could send to error tracking service here
});

/**
 * Initialize application
 */
function init() {
    // Render all content
    render();

    // Initialize features
    initKeyboardNavigation();
    initSmoothScroll();
    initHistoryNavigation();

    // Add event listeners
    document.addEventListener('keydown', handleEscapeKey);
    document.getElementById('project-overlay')?.addEventListener('click', handleOverlayClick);
    document.getElementById('lightbox')?.addEventListener('click', handleOverlayClick);

    // Optional: Performance logging in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        logPerformance();
    }

    console.log('Portfolio initialized successfully');
}

/**
 * Run initialization when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}