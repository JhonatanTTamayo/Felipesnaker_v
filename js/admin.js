// js/admin.js - SISTEMA DE ADMINISTRACIÓN MODIFICADO PARA CATÁLOGO SIN PRECIOS

class AdminPanel {
    constructor() {
        this.products = [];
        this.isLoggedIn = false;
        this.currentImageBase64 = null;
        this.editingProductId = null;
        
        // Constantes
        this.ADMIN_PASSWORD = 'felipe2024';
        this.ADMIN_TOKEN = 'felipe-admin-2024';
        this.MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
        this.STORAGE_KEY = 'felipeSneakersProducts';
        
        this.init();
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    init() {
        console.log('🔐 Iniciando panel de administración...');
        this.checkLogin();
        this.setupEventListeners();
        
        if (this.isLoggedIn) {
            this.showAdminPanel();
            this.loadProducts();
            this.renderProducts();
            this.populateFeaturedSelect();
            this.showStats();
        } else {
            this.showLoginScreen();
        }
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    checkLogin() {
        const adminToken = localStorage.getItem('adminToken');
        this.isLoggedIn = adminToken === this.ADMIN_TOKEN;
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
    }

    handleLogin() {
        const password = document.getElementById('admin-password').value;
        
        if (password === this.ADMIN_PASSWORD) {
            localStorage.setItem('adminToken', this.ADMIN_TOKEN);
            this.isLoggedIn = true;
            this.showAdminPanel();
            this.loadProducts();
            this.renderProducts();
            this.populateFeaturedSelect();
            this.showStats();
            this.showNotification('✅ Bienvenido al panel de administración', 'success');
        } else {
            this.showNotification('❌ Contraseña incorrecta', 'error');
            document.getElementById('admin-password').value = '';
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('adminToken');
            this.isLoggedIn = false;
            this.showLoginScreen();
            document.getElementById('admin-password').value = '';
            this.showNotification('👋 Sesión cerrada correctamente', 'success');
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Login
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Formulario de producto
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Imagen
        document.getElementById('product-image').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.previewImage(file);
        });

        // Botones de acción
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveProducts();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportProducts();
        });

        document.getElementById('update-featured-btn').addEventListener('click', () => {
            this.updateFeaturedProduct();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('notification-close').addEventListener('click', () => {
            this.hideNotification();
        });

        // Auto-generar mensaje de WhatsApp
        document.getElementById('product-name').addEventListener('input', (e) => {
            this.generateWhatsAppMessage(e.target.value);
        });
    }

    // ============================================
    // GESTIÓN DE PRODUCTOS
    // ============================================

    loadProducts() {
        try {
            const savedProducts = localStorage.getItem(this.STORAGE_KEY);
            if (savedProducts) {
                this.products = JSON.parse(savedProducts);
                console.log(`✅ ${this.products.length} productos cargados`);
            } else {
                this.products = [];
                console.log('ℹ️ No hay productos guardados. Iniciando desde cero.');
            }
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            this.products = [];
            this.showNotification('Error al cargar productos', 'error');
        }
    }

    saveProducts() {
        try {
            const dataStr = JSON.stringify(this.products);
            const dataSize = new Blob([dataStr]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB límite de localStorage

            if (dataSize > maxSize) {
                this.showNotification('⚠️ Almacenamiento casi lleno. Considera usar imágenes más pequeñas.', 'warning');
            }

            localStorage.setItem(this.STORAGE_KEY, dataStr);
            console.log(`✅ ${this.products.length} productos guardados`);
            this.showNotification(`✅ ${this.products.length} productos guardados correctamente`, 'success');
            this.showStats();
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                this.showNotification('❌ Almacenamiento lleno. Reduce el tamaño de las imágenes.', 'error');
            } else {
                this.showNotification('❌ Error al guardar productos', 'error');
            }
            console.error('Error al guardar:', e);
            return false;
        }
    }

    addProduct() {
        // Validar imagen
        if (!this.currentImageBase64) {
            this.showNotification('📸 Por favor selecciona una imagen', 'error');
            return;
        }

        // Obtener datos del formulario
        const productData = this.getFormData();
        
        // Validar datos
        if (!this.validateProductData(productData)) {
            return;
        }

        // Crear producto
        const product = {
            id: this.editingProductId || Date.now(),
            ...productData,
            image: this.currentImageBase64,
            createdAt: this.editingProductId ? 
                this.products.find(p => p.id === this.editingProductId).createdAt : 
                new Date().toISOString()
        };

        // Si estamos editando, eliminar el producto anterior
        if (this.editingProductId) {
            this.products = this.products.filter(p => p.id !== this.editingProductId);
            console.log('✏️ Producto actualizado');
        } else {
            console.log('➕ Nuevo producto agregado');
        }

        // Agregar producto
        this.products.push(product);
        
        // Guardar y actualizar UI
        if (this.saveProducts()) {
            this.renderProducts();
            this.populateFeaturedSelect();
            this.resetForm();
            this.showNotification(`✅ "${product.name}" ${this.editingProductId ? 'actualizado' : 'agregado'} correctamente`, 'success');
            this.editingProductId = null;
        }
    }

    getFormData() {
        return {
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            brand: document.getElementById('product-brand').value,
            badge: document.getElementById('product-badge').value,
            whatsappMessage: document.getElementById('product-message').value.trim(),
            // Nuevos campos para el catálogo
            description: document.getElementById('product-description').value.trim(),
            sizes: document.getElementById('product-sizes').value.trim()
        };
    }

    validateProductData(data) {
        if (!data.name) {
            this.showNotification('📝 Ingresa el nombre del producto', 'error');
            return false;
        }
        
        if (!data.category) {
            this.showNotification('📂 Selecciona una categoría', 'error');
            return false;
        }
        
        if (!data.brand) {
            this.showNotification('🏷️ Selecciona una marca', 'error');
            return false;
        }
        
        if (!data.whatsappMessage) {
            this.showNotification('💬 Ingresa el mensaje de WhatsApp', 'error');
            return false;
        }
        
        return true;
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.editingProductId = productId;
        
        // Llenar formulario
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-brand').value = product.brand;
        document.getElementById('product-badge').value = product.badge;
        document.getElementById('product-message').value = product.whatsappMessage;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-sizes').value = product.sizes || '';
        
        // Mostrar imagen existente
        const preview = document.getElementById('image-preview');
        const uploadArea = document.getElementById('upload-area');
        preview.innerHTML = `<img src="${product.image}" alt="Vista previa">`;
        uploadArea.classList.add('has-image');
        this.currentImageBase64 = product.image;
        
        // Scroll al formulario
        document.getElementById('product-form').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        this.showNotification('✏️ Editando producto. Modifica los campos y guarda.', 'warning');
    }

    deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProducts();
            this.populateFeaturedSelect();
            this.showNotification(`🗑️ "${product.name}" eliminado correctamente`, 'success');
        }
    }

    // ============================================
    // GESTIÓN DE IMÁGENES
    // ============================================

    previewImage(file) {
        const preview = document.getElementById('image-preview');
        const uploadArea = document.getElementById('upload-area');
        
        // Validar tamaño
        if (file.size > this.MAX_IMAGE_SIZE) {
            this.showNotification('⚠️ La imagen es muy grande. Máximo 2MB', 'error');
            document.getElementById('product-image').value = '';
            preview.innerHTML = '<span>Vista previa aparecerá aquí</span>';
            uploadArea.classList.remove('has-image');
            this.currentImageBase64 = null;
            return;
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            this.showNotification('⚠️ El archivo debe ser una imagen', 'error');
            document.getElementById('product-image').value = '';
            preview.innerHTML = '<span>Vista previa aparecerá aquí</span>';
            uploadArea.classList.remove('has-image');
            this.currentImageBase64 = null;
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const base64Image = e.target.result;
            this.currentImageBase64 = base64Image;
            preview.innerHTML = `<img src="${base64Image}" alt="Vista previa">`;
            uploadArea.classList.add('has-image');
            this.showNotification('✅ Imagen cargada correctamente', 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('❌ Error al cargar la imagen', 'error');
            preview.innerHTML = '<span>Error al cargar imagen</span>';
            uploadArea.classList.remove('has-image');
            this.currentImageBase64 = null;
        };
        
        reader.readAsDataURL(file);
    }

    // ============================================
    // UI Y RENDERIZADO
    // ============================================

    renderProducts() {
        const grid = document.getElementById('products-grid');
        
        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state full-width">
                    <i class='bx bx-package'></i>
                    <h3>No hay productos</h3>
                    <p>Agrega tu primer producto usando el formulario de arriba.</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha de creación (más recientes primero)
        const sortedProducts = [...this.products].sort((a, b) => {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        grid.innerHTML = sortedProducts.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        return `
            <div class="product-card" data-product-id="${product.id}">
                <img 
                    src="${product.image}" 
                    alt="${product.name}" 
                    class="product-image"
                    loading="lazy"
                    onerror="this.src='images/placeholder.png'"
                >
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-meta">
                        <span class="product-badge">${product.badge}</span>
                    </div>
                    <div class="product-description">${product.description || ''}</div>
                    <div class="product-sizes"><strong>Tallas:</strong> ${product.sizes || 'Consultar'}</div>
                    <div class="product-category">
                        <strong>Categoría:</strong> ${this.formatCategory(product.category)} | 
                        <strong>Marca:</strong> ${this.formatBrand(product.brand)}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-secondary btn-edit" onclick="admin.editProduct(${product.id})">
                            <i class='bx bx-edit'></i> Editar
                        </button>
                        <button class="btn btn-danger btn-delete" onclick="admin.deleteProduct(${product.id})">
                            <i class='bx bx-trash'></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    resetForm() {
        document.getElementById('product-form').reset();
        document.getElementById('image-preview').innerHTML = '<span>Vista previa aparecerá aquí</span>';
        document.getElementById('upload-area').classList.remove('has-image');
        this.currentImageBase64 = null;
        this.editingProductId = null;
    }

    // ============================================
    // UTILIDADES
    // ============================================

    formatCategory(category) {
        const categories = {
            'destacados': 'Destacados',
            'hombres': 'Hombres',
            'mujeres': 'Mujeres',
            'nike': 'Nike',
            'adidas': 'Adidas'
        };
        return categories[category] || category;
    }

    formatBrand(brand) {
        const brands = {
            'nike': 'Nike',
            'adidas': 'Adidas',
            'otra': 'Otra'
        };
        return brands[brand] || brand;
    }

    generateWhatsAppMessage(productName) {
        if (productName.trim()) {
            const message = `Hola, estoy interesado en ${productName}. ¿Podrían darme más información sobre tallas disponibles y formas de pago?`;
            document.getElementById('product-message').value = message;
        }
    }

    // ============================================
    // PRODUCTO DESTACADO
    // ============================================

    populateFeaturedSelect() {
        const select = document.getElementById('featured-product');
        select.innerHTML = '<option value="">Seleccionar producto destacado</option>';
        
        // Filtrar solo productos destacados
        const featuredProducts = this.products.filter(p => p.category === 'destacados');
        
        if (featuredProducts.length === 0) {
            select.innerHTML += '<option value="" disabled>No hay productos en "Destacados"</option>';
        } else {
            featuredProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                select.appendChild(option);
            });
        }
        
        // Seleccionar el actual si existe
        const currentFeatured = localStorage.getItem('featuredProductId');
        if (currentFeatured) {
            select.value = currentFeatured;
        }
    }

    updateFeaturedProduct() {
        const select = document.getElementById('featured-product');
        const productId = parseInt(select.value);
        
        if (!productId) {
            this.showNotification('⚠️ Selecciona un producto para destacar', 'error');
            return;
        }

        const product = this.products.find(p => p.id === productId);
        if (product) {
            localStorage.setItem('featuredProductId', productId);
            this.showNotification(`⭐ "${product.name}" ahora es el producto destacado en inicio`, 'success');
        }
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    showStats() {
        const totalProducts = this.products.length;
        const byCategory = this.products.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});
        
        const byBrand = this.products.reduce((acc, p) => {
            acc[p.brand] = (acc[p.brand] || 0) + 1;
            return acc;
        }, {});

        console.log('📊 Estadísticas:');
        console.log(`   Total: ${totalProducts} productos`);
        console.log('   Por categoría:', byCategory);
        console.log('   Por marca:', byBrand);
    }

    // ============================================
    // EXPORTAR/IMPORTAR
    // ============================================

    exportProducts() {
        if (this.products.length === 0) {
            this.showNotification('⚠️ No hay productos para exportar', 'warning');
            return;
        }

        const dataStr = JSON.stringify(this.products, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        const date = new Date().toISOString().split('T')[0];
        link.download = `felipe-sneakers-productos-${date}.json`;
        link.click();
        
        this.showNotification(`📥 ${this.products.length} productos exportados correctamente`, 'success');
    }

    // ============================================
    // NOTIFICACIONES
    // ============================================

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        
        messageEl.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

let admin;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando panel de administración...');
    admin = new AdminPanel();
});