// js/admin.js - PANEL DE ADMINISTRACIÓN PROFESIONAL CON IMGBB

class AdminPanel {
    constructor() {
        this.products = [];
        this.isLoggedIn = false;
        this.currentImageBase64 = null;
        this.editingProductId = null;
        this.currentFile = null;
        this.sessionTimer = null;
        this.isUploading = false;
        
        // Constantes de configuración
        this.ADMIN_PASSWORD = 'felipe2024';
        this.ADMIN_TOKEN = 'felipe-admin-2024';
        this.MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
        this.STORAGE_KEY = 'felipeSneakersProducts';
        
        // ✅ TU API KEY DE IMGBB (VERIFICADA)
        this.IMGBB_API_KEY = '9be3ab98a2798b1fe8d3daf02a158137';
        
        this.init();
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    init() {
        console.log('🔐 Iniciando panel de administración...');
        console.log('✅ API Key configurada:', this.IMGBB_API_KEY.substring(0, 8) + '...');
        
        this.checkLogin();
        this.setupEventListeners();
        
        if (this.isLoggedIn) {
            this.showAdminPanel();
            this.loadProducts();
            this.renderProducts();
            this.populateFeaturedSelect();
            this.updateStats();
            this.startSessionTimer();
            this.setupCacheClearing();
            this.setupResetFormButton();
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
        
        // Mostrar animación de entrada
        const sections = document.querySelectorAll('.preload');
        sections.forEach((section, index) => {
            section.style.animationDelay = `${index * 0.1}s`;
        });
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
            this.updateStats();
            this.startSessionTimer();
            this.setupCacheClearing();
            this.setupResetFormButton();
            this.showNotification('✅ Bienvenido al panel de administración', 'success');
            
            // Track login
            console.log('👤 Admin logged in at:', new Date().toLocaleString());
        } else {
            this.showNotification('❌ Contraseña incorrecta', 'error');
            document.getElementById('admin-password').value = '';
            document.getElementById('admin-password').focus();
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('adminToken');
            this.isLoggedIn = false;
            this.stopSessionTimer();
            this.showLoginScreen();
            document.getElementById('admin-password').value = '';
            this.showNotification('👋 Sesión cerrada correctamente', 'success');
            
            // Track logout
            console.log('👤 Admin logged out at:', new Date().toLocaleString());
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
            if (file) {
                this.currentFile = file;
                this.previewImage(file);
            }
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

        // Drag and drop para imágenes
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.getElementById('product-image');

        if (uploadArea && fileInput) {
            // Prevenir comportamientos por defecto
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Efectos visuales
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, unhighlight, false);
            });

            function highlight() {
                uploadArea.classList.add('highlight');
            }

            function unhighlight() {
                uploadArea.classList.remove('highlight');
            }

            // Manejar drop
            uploadArea.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                        this.currentFile = file;
                        this.previewImage(file);
                        fileInput.files = files;
                        this.showNotification('📸 Imagen cargada por drag & drop', 'success');
                    } else {
                        this.showNotification('❌ Solo se permiten archivos de imagen', 'error');
                    }
                }
            },bind(this));
        }
    }

    setupCacheClearing() {
        const clearCacheBtn = document.getElementById('clear-cache');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (confirm('¿Estás seguro de limpiar el caché del navegador?\nEsto no afectará los productos guardados.')) {
                    this.showNotification('🔄 Limpiando caché...', 'info');
                    
                    // Limpiar caché del navegador
                    if ('caches' in window) {
                        caches.keys().then(function(names) {
                            for (let name of names) caches.delete(name);
                        });
                    }
                    
                    setTimeout(() => {
                        this.showNotification('✅ Caché limpiado correctamente', 'success');
                        setTimeout(() => location.reload(), 1000);
                    }, 1500);
                }
            });
        }
    }

    setupResetFormButton() {
        const resetBtn = document.getElementById('reset-form-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
                this.showNotification('✅ Formulario limpiado', 'success');
            });
        }
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
                
                // Estadísticas de imágenes
                const publicImages = this.products.filter(p => p.image && p.image.startsWith('https://')).length;
                const localImages = this.products.filter(p => p.image && p.image.startsWith('data:image/')).length;
                console.log(`📊 Imágenes públicas: ${publicImages}, Locales: ${localImages}`);
                
                return this.products;
            } else {
                this.products = [];
                console.log('ℹ️ No hay productos guardados. Iniciando desde cero.');
                return this.products;
            }
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            this.showNotification('❌ Error al cargar productos. El almacenamiento podría estar corrupto.', 'error');
            this.products = [];
            return this.products;
        }
    }

    saveProducts() {
        try {
            const dataStr = JSON.stringify(this.products);
            const dataSize = new Blob([dataStr]).size;
            
            console.log(`💾 Guardando ${this.products.length} productos (${(dataSize / 1024).toFixed(2)} KB)`);
            
            localStorage.setItem(this.STORAGE_KEY, dataStr);
            
            // Actualizar estadísticas
            this.updateStats();
            
            this.showNotification(`✅ ${this.products.length} productos guardados correctamente`, 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Error al guardar productos:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.showNotification('❌ Almacenamiento lleno. Considera eliminar productos antiguos o usar imágenes externas.', 'error');
            } else {
                this.showNotification('❌ Error al guardar productos', 'error');
            }
            return false;
        }
    }

    // ============================================
    // SUBIDA DE IMÁGENES A IMGBB
    // ============================================

    async uploadToImgBB(file) {
        // Validar archivo
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Archivo no válido. Debe ser una imagen.');
        }

        if (file.size > this.MAX_IMAGE_SIZE) {
            throw new Error(`La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo 2MB.`);
        }

        console.log('📤 Iniciando subida a ImgBB...');
        console.log('📁 Archivo:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2), 'KB');
        
        const formData = new FormData();
        formData.append('image', file);
        
        // Mostrar estado de carga
        const loadingElement = document.querySelector('.image-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        try {
            this.showNotification('📤 Subiendo imagen a servidor...', 'info');
            this.isUploading = true;
            
            // URL de la API de ImgBB con tu API key
            const apiUrl = `https://api.imgbb.com/1/upload?key=${this.IMGBB_API_KEY}`;
            console.log('🌐 Enviando a ImgBB...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                timeout: 30000
            });
            
            console.log('📥 Respuesta recibida:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Respuesta de ImgBB:', data);
            
            if (data.success && data.data && data.data.url) {
                const imageUrl = data.data.url;
                console.log('✅ Imagen subida exitosamente:', imageUrl);
                console.log('🔗 URL de la imagen:', imageUrl);
                console.log('🖼️ URL del thumbnail:', data.data.thumb?.url);
                console.log('📏 Tamaño procesado:', data.data.size);
                
                // Retornar la URL directa de la imagen
                const directUrl = data.data.url;
                this.showNotification('✅ Imagen subida correctamente a ImgBB', 'success');
                return directUrl;
                
            } else {
                console.error('❌ Respuesta inesperada de ImgBB:', data);
                throw new Error(data.error?.message || 'Error desconocido de ImgBB');
            }
            
        } catch (error) {
            console.error('❌ Error crítico subiendo imagen a ImgBB:', error);
            
            // Usar servicio alternativo (Cloudinary demo)
            this.showNotification(`⚠️ Error con ImgBB: ${error.message}. Usando servicio alternativo.`, 'warning');
            return await this.uploadToCloudinary(file);
            
        } finally {
            this.isUploading = false;
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }

    async uploadToCloudinary(file) {
        try {
            console.log('🔄 Intentando subir a Cloudinary (demo)...');
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'ml_default');
            
            const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.secure_url) {
                console.log('✅ Imagen subida a Cloudinary:', data.secure_url);
                return data.secure_url;
            } else {
                throw new Error('No se pudo obtener URL de Cloudinary');
            }
            
        } catch (error) {
            console.error('❌ Error con Cloudinary:', error);
            
            // Convertir a Base64 como último recurso
            console.log('🔄 Convirtiendo imagen a Base64...');
            return await this.convertToBase64(file);
        }
    }

    convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('🔄 Imagen convertida a Base64');
                resolve(e.target.result);
            };
            reader.onerror = () => {
                console.error('❌ Error al convertir a Base64');
                reject(new Error('Error al procesar imagen'));
            };
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // AGREGAR/EDITAR PRODUCTOS
    // ============================================

    async addProduct() {
        // Validar que no haya una subida en proceso
        if (this.isUploading) {
            this.showNotification('⏳ Espera a que termine la subida de la imagen actual', 'warning');
            return;
        }

        // Validar imagen
        if (!this.currentFile) {
            this.showNotification('📸 Por favor selecciona una imagen', 'error');
            return;
        }

        // Obtener datos del formulario
        const productData = this.getFormData();
        
        // Validar datos
        if (!this.validateProductData(productData)) {
            return;
        }

        try {
            // Deshabilitar botón mientras se procesa
            const submitBtn = document.querySelector('#product-form button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="bx bx-loader-circle bx-spin"></i> Procesando...';
            submitBtn.disabled = true;

            // Subir imagen a ImgBB
            const imageUrl = await this.uploadToImgBB(this.currentFile);
            
            // Determinar tipo de imagen
            const isPublicImage = imageUrl.startsWith('https://');
            const isBase64 = imageUrl.startsWith('data:image/');
            
            console.log('🎯 Tipo de imagen:', 
                isPublicImage ? 'Pública (ImgBB/Cloudinary)' : 
                isBase64 ? 'Base64 (Temporal)' : 'Desconocido');

            // Crear producto
            const product = {
                id: this.editingProductId || Date.now(),
                ...productData,
                image: imageUrl,
                createdAt: this.editingProductId ? 
                    this.products.find(p => p.id === this.editingProductId)?.createdAt || new Date().toISOString() : 
                    new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                imageType: isPublicImage ? 'public' : (isBase64 ? 'base64' : 'unknown'),
                imageStatus: isPublicImage ? 'uploaded' : 'temporary'
            };

            // Si estamos editando, eliminar el producto anterior
            if (this.editingProductId) {
                const oldIndex = this.products.findIndex(p => p.id === this.editingProductId);
                if (oldIndex > -1) {
                    this.products.splice(oldIndex, 1);
                    console.log('✏️ Producto actualizado:', product.name);
                }
            } else {
                console.log('➕ Nuevo producto agregado:', product.name);
            }

            // Agregar producto (ordenar por fecha)
            this.products.unshift(product);
            
            // Guardar y actualizar UI
            if (this.saveProducts()) {
                this.renderProducts();
                this.populateFeaturedSelect();
                this.resetForm();
                
                if (isPublicImage) {
                    this.showNotification(`✅ "${product.name}" agregado con imagen pública (ImgBB)`, 'success');
                } else if (isBase64) {
                    this.showNotification(`⚠️ "${product.name}" agregado con imagen temporal (solo visible localmente)`, 'warning');
                } else {
                    this.showNotification(`✅ "${product.name}" agregado correctamente`, 'info');
                }
                
                this.editingProductId = null;
            }

        } catch (error) {
            console.error('❌ Error al agregar producto:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
            
        } finally {
            // Restaurar botón
            const submitBtn = document.querySelector('#product-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = originalText || '<i class="bx bx-plus"></i> Agregar Producto';
                submitBtn.disabled = false;
            }
        }
    }

    getFormData() {
        return {
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            brand: document.getElementById('product-brand').value,
            badge: document.getElementById('product-badge').value,
            whatsappMessage: document.getElementById('product-message').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            sizes: document.getElementById('product-sizes').value.trim()
        };
    }

    validateProductData(data) {
        const errors = [];
        
        if (!data.name) errors.push('Nombre del producto');
        if (!data.category) errors.push('Categoría');
        if (!data.brand) errors.push('Marca');
        if (!data.whatsappMessage) errors.push('Mensaje de WhatsApp');
        if (!data.badge) errors.push('Etiqueta');
        
        if (errors.length > 0) {
            this.showNotification(`❌ Campos requeridos: ${errors.join(', ')}`, 'error');
            return false;
        }
        
        if (data.name.length < 3) {
            this.showNotification('❌ El nombre debe tener al menos 3 caracteres', 'error');
            return false;
        }
        
        if (data.whatsappMessage.length < 10) {
            this.showNotification('❌ El mensaje de WhatsApp es muy corto', 'error');
            return false;
        }
        
        return true;
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showNotification('❌ Producto no encontrado', 'error');
            return;
        }

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
        
        preview.innerHTML = `
            <img src="${product.image}" alt="Vista previa" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
            <div class="image-status mt-1">
                ${product.image.startsWith('data:image/') ? 
                    '<span class="product-warning">⚠️ Imagen local</span>' : 
                    '<span class="product-success">✅ Imagen pública</span>'
                }
            </div>
        `;
        
        // Cambiar texto del botón
        const submitBtn = document.querySelector('#product-form button[type="submit"]');
        submitBtn.innerHTML = '<i class="bx bx-save"></i> Guardar Cambios';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
        
        // Mostrar advertencia si es imagen local
        if (product.image.startsWith('data:image/')) {
            this.showNotification('⚠️ Este producto tiene imagen local. Considera subir una nueva imagen para que otros la vean.', 'warning');
        }
        
        // Scroll al formulario
        document.getElementById('product-form').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        this.showNotification('✏️ Editando producto. Modifica los campos y guarda.', 'info');
    }

    deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showNotification('❌ Producto no encontrado', 'error');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar "${product.name}"?\nEsta acción no se puede deshacer.`)) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProducts();
            this.populateFeaturedSelect();
            this.showNotification(`🗑️ "${product.name}" eliminado correctamente`, 'success');
            
            // Log detallado
            console.log(`🗑️ Producto eliminado: ${product.name} (ID: ${productId})`);
        }
    }

    // ============================================
    // GESTIÓN DE IMÁGENES
    // ============================================

    previewImage(file) {
        const preview = document.getElementById('image-preview');
        const uploadArea = document.querySelector('.upload-area');
        
        // Validaciones
        if (file.size > this.MAX_IMAGE_SIZE) {
            this.showNotification(`⚠️ La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo 2MB`, 'error');
            document.getElementById('product-image').value = '';
            preview.innerHTML = '<span class="placeholder-text">Vista previa aparecerá aquí</span>';
            if (uploadArea) uploadArea.classList.remove('has-image');
            this.currentImageBase64 = null;
            this.currentFile = null;
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showNotification('⚠️ El archivo debe ser una imagen (JPG, PNG, WebP)', 'error');
            document.getElementById('product-image').value = '';
            preview.innerHTML = '<span class="placeholder-text">Vista previa aparecerá aquí</span>';
            if (uploadArea) uploadArea.classList.remove('has-image');
            this.currentImageBase64 = null;
            this.currentFile = null;
            return;
        }

        // Mostrar loader
        preview.innerHTML = `
            <div class="image-loading">
                <i class='bx bx-loader-circle bx-spin'></i>
                <span>Cargando vista previa...</span>
            </div>
        `;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const base64Image = e.target.result;
            this.currentImageBase64 = base64Image;
            
            preview.innerHTML = `
                <img src="${base64Image}" alt="Vista previa" 
                     style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                <div class="image-info mt-1">
                    <small class="text-muted">
                        ${file.name} • ${(file.size / 1024).toFixed(0)} KB
                    </small>
                </div>
            `;
            
            if (uploadArea) uploadArea.classList.add('has-image');
            this.showNotification('✅ Imagen cargada correctamente', 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('❌ Error al cargar la imagen', 'error');
            preview.innerHTML = '<span class="placeholder-text">Error al cargar imagen</span>';
            if (uploadArea) uploadArea.classList.remove('has-image');
            this.currentImageBase64 = null;
            this.currentFile = null;
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
                <div class="empty-state full-width fade-in">
                    <div class="empty-icon">
                        <i class='bx bx-package'></i>
                    </div>
                    <h3>No hay productos</h3>
                    <p class="text-muted">Agrega tu primer producto usando el formulario de arriba.</p>
                    <button class="btn btn-primary mt-2" onclick="document.getElementById('product-form').scrollIntoView()">
                        <i class='bx bx-plus'></i> Agregar Primer Producto
                    </button>
                </div>
            `;
            this.updateStats();
            return;
        }

        // Ordenar por fecha de creación (más recientes primero)
        const sortedProducts = [...this.products].sort((a, b) => {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Renderizar con animación escalonada
        grid.innerHTML = '';
        sortedProducts.forEach((product, index) => {
            setTimeout(() => {
                const card = this.createProductCard(product);
                const div = document.createElement('div');
                div.innerHTML = card;
                div.firstChild.style.animationDelay = `${index * 0.05}s`;
                grid.appendChild(div.firstChild);
            }, index * 50);
        });

        this.updateStats();
    }

    createProductCard(product) {
        // Determinar tipo de imagen
        const isPublicImage = product.image.startsWith('https://');
        const isBase64 = product.image.startsWith('data:image/');
        
        let imageStatus = '';
        if (isBase64) {
            imageStatus = '<span class="product-warning" title="Imagen solo visible en este navegador">⚠️ Local</span>';
        } else if (isPublicImage) {
            imageStatus = '<span class="product-success" title="Imagen visible para todos">✅ Pública</span>';
        } else {
            imageStatus = '<span class="product-info" title="Imagen de placeholder">🌐 Externa</span>';
        }
        
        // Formatear fecha
        const date = new Date(product.createdAt);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        return `
            <div class="product-card fade-in" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        class="product-image"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300/667eea/ffffff?text=Imagen+no+disponible';"
                    >
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-meta">
                        <span class="product-badge">${product.badge}</span>
                        ${imageStatus}
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    
                    ${product.description ? `
                        <div class="product-description">${product.description}</div>
                    ` : ''}
                    
                    ${product.sizes ? `
                        <div class="product-sizes">
                            <strong>Tallas:</strong> 
                            <span>${product.sizes}</span>
                        </div>
                    ` : '<div class="product-sizes"><strong>Tallas:</strong> <span class="text-muted">Consultar</span></div>'}
                    
                    <div class="product-category">
                        <span><i class="bx bx-category"></i> ${this.formatCategory(product.category)}</span>
                        <span><i class="bx bx-purchase-tag"></i> ${this.formatBrand(product.brand)}</span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-secondary btn-edit" onclick="admin.editProduct(${product.id})"
                                title="Editar este producto">
                            <i class='bx bx-edit'></i> Editar
                        </button>
                        <button class="btn btn-danger btn-delete" onclick="admin.deleteProduct(${product.id})"
                                title="Eliminar este producto">
                            <i class='bx bx-trash'></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    resetForm() {
        document.getElementById('product-form').reset();
        document.getElementById('image-preview').innerHTML = '<span class="placeholder-text">Vista previa aparecerá aquí</span>';
        
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('has-image');
            uploadArea.classList.remove('highlight');
        }
        
        // Restaurar botón
        const submitBtn = document.querySelector('#product-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="bx bx-plus"></i> Agregar Producto';
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-success');
            submitBtn.disabled = false;
        }
        
        this.currentImageBase64 = null;
        this.currentFile = null;
        this.editingProductId = null;
        
        // Enfocar en el primer campo
        document.getElementById('product-name').focus();
    }

    // ============================================
    // UTILIDADES
    // ============================================

    formatCategory(category) {
        const categories = {
            'destacados': '⭐ Destacados',
            'hombres': '👨 Hombres',
            'mujeres': '👩 Mujeres',
            'nike': '✓ Nike',
            'adidas': '✓ Adidas'
        };
        return categories[category] || category;
    }

    formatBrand(brand) {
        const brands = {
            'nike': 'Nike',
            'adidas': 'Adidas',
            'otra': 'Otra marca'
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
            select.innerHTML += '<option value="" disabled>⚠️ No hay productos en "Destacados"</option>';
        } else {
            featuredProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                
                let text = product.name;
                if (product.image.startsWith('data:image/')) {
                    text += ' (⚠️ Imagen local)';
                }
                
                option.textContent = text;
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
            // Verificar si la imagen es local
            if (product.image.startsWith('data:image/')) {
                this.showNotification(`⚠️ "${product.name}" tiene imagen local. Otros usuarios no la verán en la portada.`, 'warning');
            }
            
            localStorage.setItem('featuredProductId', productId);
            this.showNotification(`⭐ "${product.name}" ahora es el producto destacado en la portada`, 'success');
            
            // Track
            console.log(`⭐ Producto destacado actualizado: ${product.name} (ID: ${productId})`);
        }
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    updateStats() {
        const totalProducts = this.products.length;
        const publicImages = this.products.filter(p => p.image && p.image.startsWith('https://')).length;
        const localImages = this.products.filter(p => p.image && p.image.startsWith('data:image/')).length;
        
        // Contar categorías únicas
        const uniqueCategories = [...new Set(this.products.map(p => p.category))].length;
        
        // Actualizar UI
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        updateElement('total-products', totalProducts);
        updateElement('public-images', publicImages);
        updateElement('local-images', localImages);
        updateElement('categories-count', uniqueCategories);
        
        // Actualizar badge del header
        const productsCountEl = document.getElementById('products-count');
        if (productsCountEl) {
            productsCountEl.innerHTML = `
                <i class='bx bx-package'></i>
                <span>${totalProducts} productos</span>
                ${localImages > 0 ? `<small class="text-warning">(${localImages} locales)</small>` : ''}
            `;
        }
        
        // Mostrar advertencia si hay imágenes locales
        if (localImages > 0 && totalProducts > 0) {
            const percentage = Math.round((localImages/totalProducts)*100);
            if (percentage > 30) {
                this.showNotification(`⚠️ ${localImages} productos (${percentage}%) tienen imágenes locales. Otros usuarios no las verán.`, 'warning');
            }
        }
        
        return { totalProducts, publicImages, localImages, uniqueCategories };
    }

    // ============================================
    // TIMER DE SESIÓN
    // ============================================

    startSessionTimer() {
        let seconds = 0;
        this.sessionTimer = setInterval(() => {
            seconds++;
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            
            let timeString = '';
            if (hours > 0) {
                timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            } else {
                timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
            
            const sessionTimeEl = document.getElementById('session-time');
            if (sessionTimeEl) {
                sessionTimeEl.textContent = timeString;
                
                // Cambiar color después de 30 minutos
                if (seconds > 1800) {
                    sessionTimeEl.style.color = '#f59e0b';
                }
            }
        }, 1000);
    }

    stopSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    // ============================================
    // EXPORTAR/IMPORTAR
    // ============================================

    exportProducts() {
        if (this.products.length === 0) {
            this.showNotification('⚠️ No hay productos para exportar', 'warning');
            return;
        }

        try {
            // Preparar datos para exportación
            const exportData = {
                metadata: {
                    exportedAt: new Date().toISOString(),
                    totalProducts: this.products.length,
                    version: '2.0',
                    system: 'Felipe Sneakers Admin'
                },
                products: this.products.map(p => ({
                    ...p,
                    // No exportar datos temporales
                    _temp: undefined
                }))
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            const date = new Date().toISOString().split('T')[0];
            link.download = `felipe-sneakers-productos-${date}.json`;
            
            // Simular clic
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Liberar memoria
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            
            this.showNotification(`📥 ${this.products.length} productos exportados correctamente`, 'success');
            console.log(`📤 Exportación completada: ${this.products.length} productos`);
            
        } catch (error) {
            console.error('❌ Error al exportar productos:', error);
            this.showNotification('❌ Error al exportar productos', 'error');
        }
    }

    // ============================================
    // NOTIFICACIONES
    // ============================================

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        const iconEl = document.querySelector('.notification-icon');
        
        if (!notification || !messageEl) return;
        
        // Actualizar contenido
        messageEl.textContent = message;
        
        // Actualizar clase según tipo
        notification.className = `notification ${type} show`;
        
        // Actualizar icono
        if (iconEl) {
            const icons = {
                success: 'bx-check-circle',
                error: 'bx-error-circle',
                warning: 'bx-error',
                info: 'bx-info-circle'
            };
            iconEl.className = `bx ${icons[type] || 'bx-info-circle'} notification-icon`;
        }
        
        // Auto-ocultar
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, type === 'error' ? 8000 : 5000);
        
        // Log
        console.log(`📢 Notification [${type}]: ${message}`);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
        }
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let admin = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando panel de administración Felipe Sneakers...');
    console.log('🕐 Fecha:', new Date().toLocaleString());
    console.log('🌐 User Agent:', navigator.userAgent);
    
    try {
        admin = new AdminPanel();
        window.admin = admin; // Hacer disponible globalmente
        
        console.log('✅ Panel de administración inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico inicializando panel:', error);
        alert('Error crítico al cargar el panel. Por favor, recarga la página.');
    }
});

// Exponer funciones útiles para la consola
window.debugAdmin = {
    getProducts: () => admin?.products || [],
    getStats: () => admin?.updateStats() || {},
    clearData: () => {
        if (confirm('¿Eliminar TODOS los productos? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('felipeSneakersProducts');
            localStorage.removeItem('featuredProductId');
            localStorage.removeItem('adminActions');
            location.reload();
        }
    },
    testImgBB: async () => {
        // Probar subida simple a ImgBB
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const url = await admin.uploadToImgBB(file);
                    console.log('✅ URL obtenida:', url);
                    window.open(url, '_blank');
                } catch (error) {
                    console.error('❌ Error:', error);
                }
            }
        };
        fileInput.click();
    }
};