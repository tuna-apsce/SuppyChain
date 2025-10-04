/**
 * Main Application Logic for AgriTrace
 */

class AgriTraceApp {
    constructor() {
        this.blockchainService = new BlockchainService();
        this.ipfsService = new IPFSService();
        this.qrScanner = new QRScanner();
        this.qrGenerator = new QRCodeGenerator();
        
        this.currentUser = null;
        this.isInitialized = false;
        
        // Initialize app
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing AgriTrace...');
            
            // Initialize IPFS service
            await this.ipfsService.initialize();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check for batch ID in URL
            await this.checkUrlParams();
            
            this.isInitialized = true;
            console.log('AgriTrace initialized successfully');
        } catch (error) {
            console.error('Error initializing AgriTrace:', error);
            AgriTraceUtils.showToast('Failed to initialize application', 'error');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Wallet connection
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => this.connectWallet());
        }

        // QR Scanner
        const scanQRBtn = document.getElementById('scanQRBtn');
        if (scanQRBtn) {
            scanQRBtn.addEventListener('click', () => this.openQRScanner());
        }

        // QR Scanner modal events
        const qrScannerModal = document.getElementById('qrScannerModal');
        if (qrScannerModal) {
            qrScannerModal.addEventListener('hidden.bs.modal', () => {
                this.qrScanner.stop();
            });
        }

        // View product button
        const viewProductBtn = document.getElementById('viewProductBtn');
        if (viewProductBtn) {
            viewProductBtn.addEventListener('click', () => this.viewProductDetails());
        }

        // Account change events
        window.addEventListener('accountChanged', (event) => {
            this.handleAccountChange(event.detail.account);
        });

        // QR scan success events
        window.addEventListener('qrScanSuccess', (event) => {
            this.handleQRScanSuccess(event.detail.data);
        });

        // QR scan error events
        window.addEventListener('qrScanError', (event) => {
            this.handleQRScanError(event.detail.error);
        });

        // Learn more button
        const learnMoreBtn = document.getElementById('learnMoreBtn');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', () => {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    /**
     * Check URL parameters for batch ID
     */
    async checkUrlParams() {
        const batchId = AgriTraceUtils.getQueryParam('batch');
        if (batchId) {
            console.log('Batch ID found in URL, loading product history...');
            // Delay loading to ensure app is fully initialized
            setTimeout(() => {
                this.loadProductHistory(batchId);
            }, 1000);
        }
    }

    /**
     * Connect wallet
     */
    async connectWallet() {
        try {
            const connectBtn = document.getElementById('connectWalletBtn');
            if (connectBtn) {
                connectBtn.innerHTML = '<span class="loading-spinner"></span> Connecting...';
                connectBtn.disabled = true;
            }

            const account = await this.blockchainService.connectWallet();
            
            // Update UI
            this.updateWalletConnectionUI(account);
            
            // Check network health
            const networkHealth = await this.blockchainService.checkNetworkHealth();
            console.log('Network health:', networkHealth);
            
            // Get user information
            await this.loadUserInfo();
            
            AgriTraceUtils.showToast('Wallet connected successfully', 'success');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            
            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.message.includes('missing trie node') || 
                error.message.includes('Internal JSON-RPC error')) {
                errorMessage = 'Network connection issue. Please try refreshing the page or check your internet connection.';
            } else if (error.message.includes('User rejected')) {
                errorMessage = 'Connection was rejected. Please try again and approve the connection in MetaMask.';
            } else if (error.message.includes('MetaMask is not installed')) {
                errorMessage = 'Please install MetaMask browser extension to continue.';
            }
            
            AgriTraceUtils.showToast(errorMessage, 'error');
            
            // Reset button
            const connectBtn = document.getElementById('connectWalletBtn');
            if (connectBtn) {
                connectBtn.innerHTML = '<i class="fas fa-wallet me-1"></i>Connect Wallet';
                connectBtn.disabled = false;
            }
        }
    }

    /**
     * Update wallet connection UI
     */
    updateWalletConnectionUI(account) {
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn && account) {
            const shortAddress = AgriTraceUtils.formatAddress(account);
            connectBtn.innerHTML = `<i class="fas fa-wallet me-1"></i>${shortAddress}`;
            connectBtn.disabled = false;
        }
    }

    /**
     * Load user information
     */
    async loadUserInfo() {
        try {
            if (!this.blockchainService.isConnected()) {
                return;
            }

            this.currentUser = await this.blockchainService.getCurrentUser();
            console.log('Current user:', this.currentUser);
            
            if (this.currentUser) {
                // Update navigation based on user role
                this.updateNavigationForUser();
                console.log('User is registered and loaded successfully');
            } else {
                // User not registered yet - this is normal
                console.log('User not registered yet, showing registration options');
                this.showRegistrationPrompt();
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            
            // Handle specific error cases
            if (error.message.includes('Network connection issue')) {
                AgriTraceUtils.showToast('Network connection issue. Please try refreshing the page.', 'warning');
            } else {
                // User might not be registered yet - this is normal
                console.log('User not registered yet, showing registration options');
                this.showRegistrationPrompt();
            }
        }
    }

    /**
     * Show registration prompt for unregistered users
     */
    showRegistrationPrompt() {
        console.log('Showing registration prompt...');
        
        // Remove any existing registration prompt
        const existingPrompt = document.querySelector('.registration-prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        // Create a simple registration prompt
        const registrationDiv = document.createElement('div');
        registrationDiv.className = 'alert alert-info mt-3 registration-prompt';
        registrationDiv.id = 'registrationPrompt';
        registrationDiv.innerHTML = `
            <h6><i class="fas fa-user-plus me-2"></i>Welcome to AgriTrace!</h6>
            <p>You need to register to use the system. Please choose your role:</p>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-success btn-sm" onclick="app.registerUser('FARMER')">
                    <i class="fas fa-seedling me-1"></i>Farmer
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="app.registerUser('PROCESSOR')">
                    <i class="fas fa-industry me-1"></i>Processor
                </button>
                <button class="btn btn-outline-warning btn-sm" onclick="app.registerUser('TRANSPORTER')">
                    <i class="fas fa-truck me-1"></i>Transporter
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="app.registerUser('WAREHOUSE')">
                    <i class="fas fa-warehouse me-1"></i>Warehouse
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="app.registerUser('RETAILER')">
                    <i class="fas fa-store me-1"></i>Retailer
                </button>
            </div>
            <div class="mt-2">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    After registration, you'll need admin approval to access full features.
                </small>
                <div class="mt-2">
                    <a href="register.html" class="btn btn-primary btn-sm">
                        <i class="fas fa-external-link-alt me-1"></i>Go to Registration Page
                    </a>
                </div>
            </div>
        `;
        
        // Try multiple insertion strategies
        let inserted = false;
        
        // Strategy 1: Insert after hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && !inserted) {
            heroSection.insertAdjacentElement('afterend', registrationDiv);
            inserted = true;
            console.log('Registration prompt inserted after hero section');
        }
        
        // Strategy 2: Insert at top of main content
        const mainContent = document.querySelector('.container');
        if (mainContent && !inserted) {
            mainContent.insertAdjacentElement('afterbegin', registrationDiv);
            inserted = true;
            console.log('Registration prompt inserted at top of main content');
        }
        
        // Strategy 3: Insert after navbar
        const navbar = document.querySelector('nav');
        if (navbar && !inserted) {
            navbar.insertAdjacentElement('afterend', registrationDiv);
            inserted = true;
            console.log('Registration prompt inserted after navbar');
        }
        
        // Strategy 4: Insert at top of body
        if (!inserted) {
            document.body.insertAdjacentElement('afterbegin', registrationDiv);
            inserted = true;
            console.log('Registration prompt inserted at top of body');
        }
        
        // Show toast notification
        AgriTraceUtils.showToast('Please register to use the system', 'info');
    }

    /**
     * Register user with selected role
     */
    async registerUser(role) {
        try {
            console.log(`Registering user with role: ${role}`);
            
            const companyName = prompt(`Please enter your company name for role: ${role}`);
            if (!companyName || companyName.trim() === '') {
                AgriTraceUtils.showToast('Company name is required', 'warning');
                return;
            }

            console.log(`Registering with company: ${companyName}`);
            AgriTraceUtils.showToast('Sending registration transaction...', 'info');

            const tx = await this.blockchainService.registerUser(role, companyName.trim());
            console.log('Registration transaction:', tx);
            
            AgriTraceUtils.showToast('Registration successful! Please wait for admin verification.', 'success');
            
            // Remove registration prompt
            const registrationPrompt = document.getElementById('registrationPrompt');
            if (registrationPrompt) {
                registrationPrompt.remove();
            }
            
            // Wait a bit for transaction to be mined, then reload user info
            setTimeout(async () => {
                console.log('Reloading user info after registration...');
                await this.loadUserInfo();
            }, 2000);
            
        } catch (error) {
            console.error('Error registering user:', error);
            AgriTraceUtils.showToast(`Registration failed: ${error.message}`, 'error');
        }
    }

    /**
     * Update navigation based on user role
     */
    updateNavigationForUser() {
        if (!this.currentUser) return;

        const nav = document.querySelector('#navbarNav .navbar-nav');
        if (!nav) return;

        // Add dashboard link based on role
        const role = this.currentUser.role.toLowerCase();
        const dashboardLink = nav.querySelector(`[href*="${role}"]`);
        
        if (!dashboardLink) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a class="nav-link" href="dashboard/${role}.html">
                    <i class="fas fa-tachometer-alt me-1"></i>
                    ${AgriTraceUtils.getRoleDisplayName(this.currentUser.role)} Dashboard
                </a>
            `;
            nav.insertBefore(li, nav.firstChild);
        }

        // Add admin dashboard if user is admin
        this.addAdminDashboardIfNeeded(nav);
    }

    /**
     * Add admin dashboard link if user is admin
     */
    async addAdminDashboardIfNeeded(nav) {
        try {
            const isAdmin = await this.blockchainService.isAdmin();
            const adminLink = nav.querySelector('[href="dashboard/admin.html"]');
            
            if (isAdmin && !adminLink) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `
                    <a class="nav-link" href="dashboard/admin.html">
                        <i class="fas fa-users-cog me-1"></i>Admin Dashboard
                    </a>
                `;
                nav.insertBefore(li, nav.firstChild);
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }

    /**
     * Handle account change
     */
    async handleAccountChange(account) {
        console.log('Account changed to:', account);
        
        if (account) {
            // Clear current user data to force reload
            this.currentUser = null;
            
            // Update wallet connection UI
            this.updateWalletConnectionUI(account);
            
            // Load user info for new account
            await this.loadUserInfo();
        } else {
            this.currentUser = null;
            this.updateWalletConnectionUI(null);
            AgriTraceUtils.showToast('Wallet disconnected', 'warning');
        }
    }

    /**
     * Open QR scanner modal
     */
    async openQRScanner() {
        try {
            // Check camera availability
            let isAvailable = false;
            try {
                isAvailable = await this.qrScanner.isCameraAvailable();
            } catch (error) {
                console.warn('Error checking camera availability:', error);
                // Fallback: try to check if QrScanner library is available
                if (typeof QrScanner !== 'undefined' && QrScanner.hasCamera) {
                    isAvailable = await QrScanner.hasCamera();
                } else {
                    console.warn('QrScanner library not available');
                    isAvailable = true; // Assume camera is available and let it fail gracefully
                }
            }
            
            if (!isAvailable) {
                // Check if it's HTTPS issue
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    // Show options dialog
                    const useFileUpload = confirm('Camera requires HTTPS or localhost.\n\nClick OK to use file upload instead of camera.\nClick Cancel to see HTTPS setup instructions.');
                    
                    if (useFileUpload) {
                        this.openQRFileUpload();
                        return;
                    } else {
                        const message = 'To use camera, please:\n\n1. Use https://supplychain.test instead of http://supplychain.test\n2. Or access via localhost: http://localhost/supplychain\n\nThis is a browser security requirement for camera access.';
                        alert(message);
                        return;
                    }
                }
                
                // Don't return, try to proceed anyway
                AgriTraceUtils.showToast('Camera may not be available, but trying to scan...', 'warning');
            }

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('qrScannerModal'));
            modal.show();

            // Initialize scanner with video element
            const video = document.getElementById('scannerVideo');
            if (!video) {
                throw new Error('Video element with id "scannerVideo" not found');
            }
            
            try {
                await this.qrScanner.init('scannerVideo');
            } catch (initError) {
                console.error('Error initializing QR scanner:', initError);
                AgriTraceUtils.showToast('Error initializing camera: ' + initError.message, 'error');
                return;
            }
            
            try {
                await this.qrScanner.start();
            } catch (startError) {
                console.error('Error starting QR scanner:', startError);
                AgriTraceUtils.showToast('Error starting camera: ' + startError.message, 'error');
                return;
            }
            
            // Set up success callback
            this.qrScanner.onScanSuccess = (data) => {
                this.handleQRScanSuccess(data);
                modal.hide();
            };

        } catch (error) {
            console.error('Error opening QR scanner:', error);
            AgriTraceUtils.showToast('Failed to open camera', 'error');
        }
    }

    /**
     * Open QR file upload modal (fallback for HTTP)
     */
    openQRFileUpload() {
        try {
            // Create file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.processQRImage(file);
                }
            });
            
            // Trigger file selection
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
            
        } catch (error) {
            console.error('Error opening file upload:', error);
            AgriTraceUtils.showToast('Error opening file upload', 'error');
        }
    }

    /**
     * Process QR image from file
     */
    async processQRImage(file) {
        try {
            AgriTraceUtils.showToast('Processing QR code image...', 'info');
            
            // Create image element
            const img = new Image();
            img.onload = () => {
                // Use QrScanner to decode from image
                if (typeof QrScanner !== 'undefined') {
                    QrScanner.scanImage(img)
                        .then(result => {
                            console.log('QR code detected from image:', result);
                            this.handleQRScanSuccess(result);
                            AgriTraceUtils.showToast('QR code detected successfully!', 'success');
                        })
                        .catch(error => {
                            console.error('Error scanning QR from image:', error);
                            AgriTraceUtils.showToast('No QR code found in image', 'error');
                        });
                } else {
                    AgriTraceUtils.showToast('QR scanner library not available', 'error');
                }
            };
            
            img.onerror = () => {
                AgriTraceUtils.showToast('Error loading image', 'error');
            };
            
            // Load image
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Error processing QR image:', error);
            AgriTraceUtils.showToast('Error processing image', 'error');
        }
    }

    /**
     * Validate QR code data format
     */
    validateQRCodeData(qrData) {
        try {
            // Check if it's a URL with batch parameter
            if (typeof qrData === 'string') {
                // Check if it's a product URL
                if (qrData.includes('index.html?batch=')) {
                    return true;
                }
                // Check if it's just a batch ID
                if (qrData.match(/^[A-Z]+-\d{4}-\d{3}$/)) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error validating QR code data:', error);
            return false;
        }
    }

    /**
     * Handle QR scan success
     */
    handleQRScanSuccess(data) {
        try {
            // Extract data from QR result
            const qrData = data.data || data;
            
            // Validate QR code data format
            if (!this.validateQRCodeData(qrData)) {
                AgriTraceUtils.showToast('Invalid QR code format', 'warning');
                return;
            }

            // Extract batch ID from QR data
            let batchId = qrData;
            if (qrData.includes('index.html?batch=')) {
                const url = new URL(qrData);
                batchId = url.searchParams.get('batch');
            }
            
            // Show result
            const resultDiv = document.getElementById('scannerResult');
            const batchIdSpan = document.getElementById('scannedBatchId');
            
            if (resultDiv && batchIdSpan) {
                batchIdSpan.textContent = batchId;
                resultDiv.classList.remove('d-none');
            }
            
            // Store batch ID for product viewing
            this.currentBatchId = batchId;
            
            AgriTraceUtils.showToast('QR code scanned successfully', 'success');
            
            // Auto-load product history
            setTimeout(() => {
                this.loadProductHistory(batchId);
            }, 1000);
        } catch (error) {
            console.error('Error handling QR scan success:', error);
            AgriTraceUtils.showToast('Error processing QR code', 'error');
        }
    }

    /**
     * Handle QR scan error
     */
    handleQRScanError(error) {
        console.error('QR scan error:', error);
        AgriTraceUtils.showToast(`QR scan error: ${error}`, 'error');
    }

    /**
     * View product details
     */
    async viewProductDetails() {
        if (!this.currentBatchId) {
            AgriTraceUtils.showToast('No product selected', 'warning');
            return;
        }

        await this.loadProductHistory(this.currentBatchId);
    }

    /**
     * Load product history
     */
    async loadProductHistory(batchId) {
        try {
            console.log('Loading product history for:', batchId);
            
            // Ensure blockchain service is initialized
            if (!this.blockchainService.isConnected()) {
                console.log('Blockchain service not connected, attempting to connect...');
                try {
                    await this.blockchainService.connectWallet();
                } catch (connectError) {
                    console.warn('Could not connect wallet, trying to initialize without wallet...');
                    // Try to initialize without wallet connection for read-only operations
                    await this.blockchainService.initializeWeb3WithFallback();
                    await this.blockchainService.loadContract();
                }
            }
            
            // Ensure product history modal exists
            let modalElement = document.getElementById('productHistoryModal');
            if (!modalElement) {
                // Create modal if it doesn't exist
                const modalHtml = `
                    <div class="modal fade" id="productHistoryModal" tabindex="-1">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Product History - ${batchId}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div id="productHistoryContent">
                                        <div class="text-center">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            <p class="mt-2">Loading product information...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                modalElement = document.getElementById('productHistoryModal');
            }
            
            // Show product history modal
            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Show loading state
            this.showProductLoading(true);

            // Load product data from blockchain
            const productHistory = await this.blockchainService.getProductHistory(batchId);
            
            // Display product information
            this.displayProductHistory(productHistory);
            
        } catch (error) {
            console.error('Error loading product history:', error);
            this.showProductError(error.message);
        }
    }

    /**
     * Retry product load
     */
    async retryProductLoad() {
        if (this.currentBatchId) {
            console.log('Retrying product load for batch:', this.currentBatchId);
            
            // Hide error and show loading
            this.showProductLoading(true);
            
            // Retry loading
            await this.loadProductHistory(this.currentBatchId);
        } else {
            AgriTraceUtils.showToast('No batch ID available for retry', 'error');
        }
    }

    /**
     * Show product loading state
     */
    showProductLoading(show) {
        const loadingDiv = document.getElementById('productLoading');
        const contentDiv = document.getElementById('productContent');
        const errorDiv = document.getElementById('productError');

        if (loadingDiv) loadingDiv.classList.toggle('d-none', !show);
        if (contentDiv) contentDiv.classList.toggle('d-none', show);
        if (errorDiv) errorDiv.classList.add('d-none');
    }

    /**
     * Show product error
     */
    showProductError(message) {
        const loadingDiv = document.getElementById('productLoading');
        const contentDiv = document.getElementById('productContent');
        const errorDiv = document.getElementById('productError');
        const errorMessage = document.getElementById('productErrorMessage');

        if (loadingDiv) loadingDiv.classList.add('d-none');
        if (contentDiv) contentDiv.classList.add('d-none');
        if (errorDiv) errorDiv.classList.remove('d-none');
        if (errorMessage) errorMessage.textContent = message;
    }

    /**
     * Display product history
     */
    displayProductHistory(productHistory) {
        try {
            const { product, events } = productHistory;
            
            // Hide loading state
            this.showProductLoading(false);
            
            // Get content container
            const contentDiv = document.getElementById('productContent');
            if (!contentDiv) return;

            // Create product display HTML
            const productHtml = this.createProductDisplayHTML(product, events);
            contentDiv.innerHTML = productHtml;

            // Load additional data from IPFS if needed
            this.loadAdditionalProductData(product, events);

        } catch (error) {
            console.error('Error displaying product history:', error);
            this.showProductError('Failed to display product information');
        }
    }

    /**
     * Create product display HTML
     */
    createProductDisplayHTML(product, events) {
        const isExpired = new Date() > new Date(product.expiryDate);
        const statusClass = isExpired ? 'badge-expired' : 'badge-active';
        const statusText = isExpired ? 'Expired' : 'Active';

        return `
            <div class="product-info">
                <!-- Product Header -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h3 class="mb-2">${AgriTraceUtils.sanitizeHtml(product.productName)}</h3>
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <span class="badge badge-dashboard badge-${product.category.toLowerCase()}">${AgriTraceUtils.sanitizeHtml(product.category)}</span>
                            <span class="badge-status ${statusClass}">${statusText}</span>
                            <span class="text-muted">Batch: ${AgriTraceUtils.sanitizeHtml(product.batchId)}</span>
                        </div>
                        <div class="row">
                            <div class="col-sm-6">
                                <p><strong>Origin:</strong> ${AgriTraceUtils.sanitizeHtml(product.origin)}</p>
                                <p><strong>Quantity:</strong> ${AgriTraceUtils.formatNumber(product.quantity)} ${AgriTraceUtils.sanitizeHtml(product.unit)}</p>
                            </div>
                            <div class="col-sm-6">
                                <p><strong>Harvest Date:</strong> ${AgriTraceUtils.formatDate(product.harvestDate)}</p>
                                <p><strong>Expiry Date:</strong> ${AgriTraceUtils.formatDate(product.expiryDate)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="qr-code-display">
                            <div class="qr-code-container" style="width: 150px; height: 150px; border: 1px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                                <div id="productQRCode" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                                    <div class="text-muted">Loading QR Code...</div>
                                </div>
                            </div>
                            <p class="mt-2 mb-0"><small>Scan to view product details</small></p>
                        </div>
                    </div>
                </div>

                <!-- Supply Chain Timeline -->
                <div class="supply-chain-timeline">
                    <h4 class="mb-4">
                        <i class="fas fa-route me-2"></i>Supply Chain Timeline
                        <span class="badge bg-primary ms-2">${events.length} Events</span>
                    </h4>
                    <div class="timeline">
                        ${events.map(event => this.createEventHTML(event)).join('')}
                    </div>
                </div>

                <!-- Additional Information -->
                <div class="row mt-5">
                    <div class="col-md-6">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-info-circle me-2"></i>Product Information</h5>
                            <div class="product-details">
                                <p><strong>Product ID:</strong> ${product.productId}</p>
                                <p><strong>Farmer:</strong> ${AgriTraceUtils.formatAddress(product.farmer)}</p>
                                <p><strong>Current Owner:</strong> ${AgriTraceUtils.formatAddress(product.currentOwner)}</p>
                                <p><strong>Created:</strong> ${AgriTraceUtils.formatDate(product.createdAt)}</p>
                                ${product.ipfsHash ? `<p><strong>Documents:</strong> <a href="#" class="view-documents" data-hash="${product.ipfsHash}">View Documents</a></p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="dashboard-card">
                            <h5><i class="fas fa-chart-line me-2"></i>Quality Metrics</h5>
                            <div class="quality-metrics">
                                <div class="metric">
                                    <span class="metric-label">Supply Chain Events</span>
                                    <div class="progress-dashboard">
                                        <div class="progress-bar-dashboard" style="width: ${Math.min((events.length / 8) * 100, 100)}%"></div>
                                    </div>
                                    <span class="metric-value">${events.length}</span>
                                </div>
                                <div class="metric mt-3">
                                    <span class="metric-label">Days in Supply Chain</span>
                                    <div class="progress-dashboard">
                                        <div class="progress-bar-dashboard" style="width: ${this.calculateSupplyChainDays(product, events)}%"></div>
                                    </div>
                                    <span class="metric-value">${this.getSupplyChainDays(product, events)} days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create event HTML
     */
    createEventHTML(event) {
        const eventIcon = this.getEventIcon(event.eventType);
        const eventColor = this.getEventColor(event.eventType);

        return `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-date">${AgriTraceUtils.formatDate(event.timestamp)}</div>
                    <div class="timeline-title">
                        <i class="fas ${eventIcon} me-2" style="color: ${eventColor}"></i>
                        ${AgriTraceUtils.getEventTypeDisplayName(event.eventType)}
                    </div>
                    <div class="timeline-description">
                        <p class="mb-1"><strong>Location:</strong> ${AgriTraceUtils.sanitizeHtml(event.location)}</p>
                        <p class="mb-1"><strong>Actor:</strong> ${AgriTraceUtils.formatAddress(event.actor)}</p>
                        ${event.notes ? `<p class="mb-0"><strong>Notes:</strong> ${AgriTraceUtils.sanitizeHtml(event.notes)}</p>` : ''}
                        ${event.ipfsHash ? `<p class="mb-0"><a href="#" class="view-event-docs" data-hash="${event.ipfsHash}">View Event Documents</a></p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get event icon
     */
    getEventIcon(eventType) {
        const icons = {
            HARVEST: 'fa-seedling',
            PROCESSING: 'fa-industry',
            TRANSPORT_START: 'fa-truck',
            TRANSPORT_END: 'fa-truck-loading',
            WAREHOUSE_IN: 'fa-warehouse',
            WAREHOUSE_OUT: 'fa-warehouse',
            RETAIL_RECEIVE: 'fa-store',
            SALE: 'fa-shopping-cart'
        };
        return icons[eventType] || 'fa-circle';
    }

    /**
     * Get event color
     */
    getEventColor(eventType) {
        const colors = {
            HARVEST: '#28a745',
            PROCESSING: '#007bff',
            TRANSPORT_START: '#fd7e14',
            TRANSPORT_END: '#fd7e14',
            WAREHOUSE_IN: '#6f42c1',
            WAREHOUSE_OUT: '#6f42c1',
            RETAIL_RECEIVE: '#20c997',
            SALE: '#dc3545'
        };
        return colors[eventType] || '#6c757d';
    }

    /**
     * Calculate supply chain days percentage
     */
    calculateSupplyChainDays(product, events) {
        const totalDays = this.getSupplyChainDays(product, events);
        const maxExpectedDays = 365; // Maximum expected days in supply chain
        return Math.min((totalDays / maxExpectedDays) * 100, 100);
    }

    /**
     * Get supply chain days
     */
    getSupplyChainDays(product, events) {
        if (events.length === 0) return 0;
        
        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];
        const diffMs = lastEvent.timestamp - firstEvent.timestamp;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    /**
     * Load additional product data from IPFS
     */
    async loadAdditionalProductData(product, events) {
        try {
            // Generate QR code for product
            await this.generateProductQR(product.batchId);

            // Load product documents if available
            if (product.ipfsHash) {
                await this.loadProductDocuments(product.ipfsHash);
            }

            // Load event documents
            for (const event of events) {
                if (event.ipfsHash) {
                    await this.loadEventDocuments(event.eventId, event.ipfsHash);
                }
            }

            // Set up document view event listeners
            this.setupDocumentViewListeners();

        } catch (error) {
            console.error('Error loading additional product data:', error);
        }
    }

    /**
     * Generate QR code for product
     */
    async generateProductQR(batchId) {
        try {
            console.log('Generating QR code for product:', batchId);
            const qrDataURL = await this.qrGenerator.generateProductQR(batchId);
            console.log('QR code generated, dataURL length:', qrDataURL ? qrDataURL.length : 'N/A');
            
            const qrContainer = document.getElementById('productQRCode');
            if (qrContainer && qrDataURL) {
                // Clear loading text and add QR code image
                qrContainer.innerHTML = '';
                const img = document.createElement('img');
                img.src = qrDataURL;
                img.alt = 'Product QR Code';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.borderRadius = '4px';
                
                qrContainer.appendChild(img);
                console.log('QR code image added to container');
            } else {
                console.error('QR container not found or no dataURL');
            }
        } catch (error) {
            console.error('Error generating product QR:', error);
        }
    }

    /**
     * Load product documents
     */
    async loadProductDocuments(ipfsHash) {
        try {
            const documents = await this.ipfsService.getJSON(ipfsHash);
            console.log('Product documents loaded:', documents);
        } catch (error) {
            console.error('Error loading product documents:', error);
        }
    }

    /**
     * Load event documents
     */
    async loadEventDocuments(eventId, ipfsHash) {
        try {
            const documents = await this.ipfsService.getJSON(ipfsHash);
            console.log(`Event ${eventId} documents loaded:`, documents);
        } catch (error) {
            console.error('Error loading event documents:', error);
        }
    }

    /**
     * Set up document view event listeners
     */
    setupDocumentViewListeners() {
        // Remove existing event listeners first to prevent duplicates
        const existingProductLinks = document.querySelectorAll('.view-documents');
        const existingEventLinks = document.querySelectorAll('.view-event-docs');
        
        // Clone and replace elements to remove all event listeners
        existingProductLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        existingEventLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });

        // Add new event listeners
        const productDocLinks = document.querySelectorAll('.view-documents');
        productDocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const hash = e.target.getAttribute('data-hash');
                this.viewDocuments(hash, 'Product Documents');
            });
        });

        const eventDocLinks = document.querySelectorAll('.view-event-docs');
        eventDocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const hash = e.target.getAttribute('data-hash');
                this.viewDocuments(hash, 'Event Documents');
            });
        });
    }

    /**
     * View documents
     */
    async viewDocuments(ipfsHash, title) {
        try {
            AgriTraceUtils.showToast('Loading documents...', 'info');
            
            const documents = await this.ipfsService.getJSON(ipfsHash);
            
            // Create modal for document viewing
            this.createDocumentModal(title, documents);
            
        } catch (error) {
            console.error('Error viewing documents:', error);
            AgriTraceUtils.showToast('Failed to load documents', 'error');
        }
    }

    /**
     * Create document modal
     */
    createDocumentModal(title, metadata) {
        try {
            console.log(`${title}:`, metadata);
            
            // Handle both old and new metadata formats
            let files = [];
            if (metadata.files) {
                // New format (from processor dashboard)
                files = metadata.files;
            } else if (metadata.documents) {
                // Old format (from farmer dashboard)
                files = metadata.documents.map(doc => ({
                    filename: doc.fileName,
                    size: doc.fileSize,
                    type: doc.fileType,
                    hash: doc.fileHash
                }));
            }
            
            if (!files || files.length === 0) {
                AgriTraceUtils.showToast('No documents found', 'info');
                return;
            }

            // Create modal to show documents
            const documentsHtml = files.map(file => {
                const fileSize = (file.size / 1024).toFixed(2) + ' KB';
                const fileIcon = this.getFileIcon(file.type);
                
                return `
                    <div class="document-item border rounded p-3 mb-3">
                        <div class="d-flex align-items-center">
                            <div class="document-icon me-3">
                                <i class="${fileIcon} fa-2x text-primary"></i>
                            </div>
                            <div class="document-info flex-grow-1">
                                <h6 class="mb-1">${AgriTraceUtils.sanitizeHtml(file.filename)}</h6>
                                <p class="mb-1 text-muted small">Size: ${fileSize} | Type: ${file.type}</p>
                                <p class="mb-0 small text-muted">Hash: <code>${file.hash}</code></p>
                            </div>
                            <div class="document-actions">
                                <a href="${this.ipfsService.getIPFSUrl(file.hash)}" target="_blank" class="btn btn-outline-primary btn-sm">
                                    <i class="fas fa-external-link-alt me-1"></i>View
                                </a>
                                <button class="btn btn-outline-success btn-sm ms-1" onclick="downloadFromIPFS('${file.hash}', '${file.filename}')">
                                    <i class="fas fa-download me-1"></i>Download
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const modalHtml = `
                <div class="modal fade" id="appDocumentsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-file-alt me-2"></i>${title}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${metadata.qualityChecks ? `
                                    <div class="mb-3">
                                        <h6 class="text-primary">Quality Checks:</h6>
                                        <ul>
                                            ${metadata.qualityChecks.map(check => `<li>${check}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${metadata.weather ? `
                                    <div class="mb-3">
                                        <h6 class="text-primary">Weather Conditions:</h6>
                                        <p>${metadata.weather}</p>
                                    </div>
                                ` : ''}
                                
                                ${metadata.method ? `
                                    <div class="mb-3">
                                        <h6 class="text-primary">Harvest Method:</h6>
                                        <p>${metadata.method}</p>
                                    </div>
                                ` : ''}
                                
                                <div class="mb-3">
                                    <h6 class="text-primary">Event Documents</h6>
                                    <p class="text-muted small">Uploaded on: ${metadata.uploadDate ? new Date(metadata.uploadDate).toLocaleString() : 'Unknown'}</p>
                                </div>
                                
                                <div class="documents-list">
                                    ${documentsHtml}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('appDocumentsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('appDocumentsModal'));
            modal.show();
            
            AgriTraceUtils.showToast('Documents loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error creating document modal:', error);
            AgriTraceUtils.showToast('Failed to display documents', 'error');
        }
    }

    /**
     * Get file icon based on file type
     */
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fas fa-image';
        if (fileType.includes('pdf')) return 'fas fa-file-pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (fileType.includes('text')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }
}

/**
 * Retry product load (global function)
 */
async function retryProductLoad() {
    if (window.agriTraceApp && window.agriTraceApp.currentBatchId) {
        await window.agriTraceApp.retryProductLoad();
    } else {
        AgriTraceUtils.showToast('No product to retry', 'error');
    }
}

/**
 * Download file from IPFS
 */
function downloadFromIPFS(hash, filename) {
    const ipfsService = new IPFSService();
    const url = ipfsService.getIPFSUrl(hash);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.agriTraceApp = new AgriTraceApp();
});

// Export for global access
window.AgriTraceApp = AgriTraceApp;
