// js/main.js - SISTEMA LIMPIO DESDE CERO SIN PRECIOS

// ============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================

let products = [];
let isAdmin = false;

// Configuración de WhatsApp
const WHATSAPP_CONFIG = {
    number: '573205769399',
    defaultMessage: 'Hola, estoy interesado en sus zapatillas'
};

// ============================================
// GESTIÓN DE AUTENTICACIÓN
// ============================================

function checkAdmin() {
    const adminToken = localStorage.getItem('adminToken');
    const adminLink = document.getElementById('admin-link-item');
    
    isAdmin = adminToken === 'felipe-admin-2024';
    
    if (adminLink) {
        adminLink.style.display = isAdmin ? 'block' : 'none';
    }
    
    return isAdmin;
}

// ============================================
// GESTIÓN DE PRODUCTOS
// ============================================

/**
 * Cargar productos desde localStorage
 * Si no hay productos, inicializa con array vacío
 */
function loadProducts() {
    try {
        const savedProducts = localStorage.getItem('felipeSneakersProducts');
        
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            console.log(`✅ ${products.length} productos cargados`);
        } else {
            products = [];
            console.log('ℹ️ No hay productos. La tienda está vacía.');
        }
        
        updateHomeProduct();
        return products;
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        products = [];
        return products;
    }
}

/**
 * Guardar productos en localStorage
 */
function saveProducts() {
    try {
        localStorage.setItem('felipeSneakersProducts', JSON.stringify(products));
        console.log('✅ Productos guardados');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar productos:', error);
        return false;
    }
}

/**
 * Actualizar producto destacado en la página principal
 */
function updateHomeProduct() {
    // Solo ejecutar si estamos en la página principal
    if (!isHomePage()) return;
    
    const featuredProductId = localStorage.getItem('featuredProductId');
    let featuredProduct = null;

    // Intentar obtener el producto destacado configurado
    if (featuredProductId) {
        featuredProduct = products.find(p => p.id === parseInt(featuredProductId));
    }

    // Si no hay producto destacado configurado, usar el primero de destacados
    if (!featuredProduct && products.length > 0) {
        featuredProduct = products.find(p => p.category === "destacados");
    }

    // Si aún no hay producto, usar el primero disponible
    if (!featuredProduct && products.length > 0) {
        featuredProduct = products[0];
    }

    // Actualizar elementos del DOM
    if (featuredProduct) {
        updateHomeElements(featuredProduct);
    } else {
        setDefaultHomeElements();
    }
}

/**
 * Actualizar elementos de la sección home con un producto
 */
function updateHomeElements(product) {
    const elements = {
        img: document.getElementById('home-product-img'),
        badge: document.getElementById('home-product-badge'),
        title: document.getElementById('home-product-title'),
        desc: document.getElementById('home-product-desc'),
        link: document.getElementById('home-product-link')
    };

    if (elements.img) {
        elements.img.src = product.image;
        elements.img.alt = product.name;
        elements.img.onerror = () => {
            elements.img.src = 'images/placeholder.png';
        };
    }
    
    if (elements.badge) {
        elements.badge.textContent = product.badge;
    }
    
    if (elements.title) {
        elements.title.innerHTML = product.name.replace(/\s+/g, ' <br>');
    }
    
    if (elements.desc) {
        elements.desc.textContent = product.description || `Descubre ${product.name} - Calidad premium`;
    }
    
    if (elements.link) {
        const message = product.whatsappMessage || `Hola, estoy interesado en ${product.name}`;
        elements.link.href = createWhatsAppLink(message);
    }
}

/**
 * Establecer elementos por defecto cuando no hay productos
 */
function setDefaultHomeElements() {
    const elements = {
        img: document.getElementById('home-product-img'),
        badge: document.getElementById('home-product-badge'),
        title: document.getElementById('home-product-title'),
        desc: document.getElementById('home-product-desc'),
        link: document.getElementById('home-product-link')
    };

    if (elements.img) {
        elements.img.src = 'images/placeholder.png';
        elements.img.alt = 'Próximamente';
    }
    
    if (elements.badge) {
        elements.badge.textContent = 'Próximamente';
    }
    
    if (elements.title) {
        elements.title.innerHTML = 'FELIPE SNEAKERS<br>PRÓXIMAMENTE';
    }
    
    if (elements.desc) {
        elements.desc.textContent = 'Estamos preparando productos increíbles para ti';
    }
    
    if (elements.link) {
        elements.link.href = createWhatsAppLink(WHATSAPP_CONFIG.defaultMessage);
    }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Crear enlace de WhatsApp
 */
function createWhatsAppLink(message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_CONFIG.number}?text=${encodedMessage}`;
}

/**
 * Verificar si estamos en la página principal
 */
function isHomePage() {
    const currentPage = window.location.pathname.split('/').pop();
    return currentPage === 'index.html' || currentPage === '';
}

/**
 * Obtener nombre de la página actual
 */
function getCurrentPage() {
    const path = window.location.pathname.split('/').pop();
    return path || 'index.html';
}

// ============================================
// RENDERIZADO DE PRODUCTOS
// ============================================

/**
 * Crear HTML de un producto
 */
function createProductElement(product) {
    const whatsappLink = createWhatsAppLink(product.whatsappMessage);
    
    return `
        <article class="sneaker" data-product-id="${product.id}">
            <div class="sneaker__sale">${product.badge}</div>
            <img 
                src="${product.image}" 
                alt="${product.name}" 
                class="sneaker__img"
                loading="lazy"
                onerror="this.src='images/placeholder.png'"
            />
            <span class="sneaker__name">${product.name}</span>
            <div class="sneaker__details">
                ${product.description ? `<p class="sneaker__description">${product.description}</p>` : ''}
                ${product.sizes ? `<p class="sneaker__sizes"><strong>Tallas:</strong> ${product.sizes}</p>` : ''}
            </div>
            <a href="${whatsappLink}" class="button-light" target="_blank" rel="noopener noreferrer">
                Consultar Disponibilidad <i class="bx bx-right-arrow-alt button-icon"></i>
            </a>
        </article>
    `;
}

/**
 * Mostrar mensaje cuando no hay productos
 */
function getEmptyStateHTML(category = '') {
    const messages = {
        'destacados': {
            icon: 'bx-star',
            title: 'No hay productos destacados',
            message: 'Agrega productos desde el panel de administración y márcalos como destacados.'
        },
        'nike': {
            icon: 'bx-package',
            title: 'No hay productos Nike',
            message: 'Agrega productos Nike desde el panel de administración.'
        },
        'adidas': {
            icon: 'bx-package',
            title: 'No hay productos Adidas',
            message: 'Agrega productos Adidas desde el panel de administración.'
        },
        'mujeres': {
            icon: 'bx-female',
            title: 'No hay productos para mujeres',
            message: 'Agrega productos para mujeres desde el panel de administración.'
        },
        'hombres': {
            icon: 'bx-male',
            title: 'No hay productos para hombres',
            message: 'Agrega productos para hombres desde el panel de administración.'
        },
        'default': {
            icon: 'bx-package',
            title: 'No hay productos disponibles',
            message: 'Próximamente tendremos productos increíbles para ti.'
        }
    };

    const state = messages[category] || messages['default'];
    
    return `
        <div class="no-products">
            <i class='bx ${state.icon}'></i>
            <h3>${state.title}</h3>
            <p>${state.message}</p>
            ${isAdmin ? '<a href="admin.html" class="button" style="margin-top: 1rem;">Ir al Panel de Administración</a>' : ''}
        </div>
    `;
}

/**
 * Cargar productos por categoría
 */
function loadProductsByCategory(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Contenedor '${containerId}' no encontrado`);
        return;
    }

    const filteredProducts = products.filter(product => product.category === category);
    
    if (filteredProducts.length === 0) {
        container.innerHTML = getEmptyStateHTML(category);
        console.log(`ℹ️ No hay productos en categoría: ${category}`);
        return;
    }

    container.innerHTML = filteredProducts.map(product => createProductElement(product)).join('');
    console.log(`✅ ${category}: ${filteredProducts.length} productos cargados`);
}

/**
 * Cargar productos por marca con límite opcional
 */
function loadProductsByBrand(brand, containerId, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Contenedor '${containerId}' no encontrado`);
        return;
    }

    let filteredProducts = products.filter(product => product.brand === brand);
    
    // Aplicar límite si se especifica
    if (limit && filteredProducts.length > limit) {
        filteredProducts = filteredProducts.slice(0, limit);
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = getEmptyStateHTML(brand);
        console.log(`ℹ️ No hay productos de marca: ${brand}`);
        return;
    }

    container.innerHTML = filteredProducts.map(product => createProductElement(product)).join('');
    console.log(`✅ ${brand}: ${filteredProducts.length} productos cargados`);
}

// ============================================
// INICIALIZACIÓN DE PÁGINAS
// ============================================

/**
 * Inicializar contenido según la página actual
 */
function initializePageContent() {
    const currentPage = getCurrentPage();
    console.log(`📄 Página actual: ${currentPage}`);
    
    const pageInitializers = {
        'index.html': initializeHomePage,
        '': initializeHomePage,
        'mujeres.html': () => loadProductsByCategory('mujeres', 'women-products'),
        'hombres.html': () => loadProductsByCategory('hombres', 'men-products'),
        'nike.html': () => loadProductsByBrand('nike', 'nike-products'),
        'adidas.html': () => loadProductsByBrand('adidas', 'adidas-products')
    };

    const initializer = pageInitializers[currentPage];
    if (initializer) {
        initializer();
    }
}

/**
 * Inicializar página principal
 */
function initializeHomePage() {
    // Cargar productos destacados
    if (document.getElementById('featured-products')) {
        loadProductsByCategory('destacados', 'featured-products');
    }
    
    // Cargar productos Nike (máximo 4)
    if (document.getElementById('nike-products')) {
        loadProductsByBrand('nike', 'nike-products', 4);
    }
    
    // Cargar productos Adidas (máximo 4)
    if (document.getElementById('adidas-products')) {
        loadProductsByBrand('adidas', 'adidas-products', 4);
    }
}

// ============================================
// CONFIGURACIÓN DE FORMULARIOS
// ============================================

/**
 * Configurar formulario de newsletter
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletter-form');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput.value.trim();
        
        if (!email) return;

        // Mostrar mensaje de éxito
        alert(`¡Gracias por suscribirte! Te contactaremos pronto con novedades exclusivas.`);
        emailInput.value = '';
        
        // Opcional: Abrir WhatsApp con mensaje
        const message = `¡Hola! Me acabo de suscribir al newsletter con el correo: ${email}. Quiero recibir información sobre nuevos productos.`;
        window.open(createWhatsAppLink(message), '_blank');
    });
}

// ============================================
// CONFIGURACIÓN DE MENÚ MÓVIL
// ============================================

function setupMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav__link');

    if (!toggle || !navMenu) return;

    // Toggle menú
    toggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        const icon = toggle.querySelector('i');
        
        if (navMenu.classList.contains('show')) {
            icon.classList.replace('bx-menu', 'bx-x');
        } else {
            icon.classList.replace('bx-x', 'bx-menu');
        }
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('show');
            const icon = toggle.querySelector('i');
            icon.classList.replace('bx-x', 'bx-menu');
        });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
            navMenu.classList.remove('show');
            const icon = toggle.querySelector('i');
            if (icon) icon.classList.replace('bx-x', 'bx-menu');
        }
    });
}

// ============================================
// EFECTOS DE SCROLL
// ============================================

function setupScrollEffects() {
    // Header con efecto scroll
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY >= 200) {
            header?.classList.add('scroll-header');
        } else {
            header?.classList.remove('scroll-header');
        }
    });

    // Activar enlaces según la sección visible
    const sections = document.querySelectorAll('.section[id]');
    if (sections.length === 0) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav__menu a[href*=${sectionId}]`);

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink?.classList.add('active');
            } else {
                navLink?.classList.remove('active');
            }
        });
    });
}

// ============================================
// OPTIMIZACIÓN DE IMÁGENES
// ============================================

function setupLazyLoading() {
    // Observador para carga diferida de imágenes
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

function initializePage() {
    console.log('🚀 Inicializando Felipe Sneakers...');
    
    // Verificar autenticación
    checkAdmin();
    
    // Cargar productos
    loadProducts();
    
    // Inicializar contenido según página
    initializePageContent();
    
    // Configurar formularios
    setupNewsletterForm();
    
    // Configurar menú móvil
    setupMobileMenu();
    
    // Configurar efectos de scroll
    setupScrollEffects();
    
    // Configurar carga diferida de imágenes
    setupLazyLoading();
    
    console.log('✅ Página inicializada correctamente');
}

// ============================================
// EVENTOS DEL DOCUMENTO
// ============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializePage);

// Log cuando la página se carga completamente
window.addEventListener('load', () => {
    console.log('✅ Recursos de página cargados completamente');
});