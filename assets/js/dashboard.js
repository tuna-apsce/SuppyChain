/**
 * Dashboard functionality for AgriTrace
 */

class DashboardManager {
    constructor() {
        this.blockchainService = new BlockchainService();
        this.ipfsService = new IPFSService();
        this.qrGenerator = new QRCodeGenerator();
        
        this.currentUser = null;
        this.currentSection = 'overview';
        this.userProducts = [];
        this.userEvents = [];
        this.currentQRDataURL = null;
        this.localHarvestEvents = []; // Store harvest events locally
        
        // Initialize dashboard
        this.init();
    }


    /**
     * Initialize dashboard
     */
    async init() {
        try {
            console.log('Initializing dashboard...');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Connect wallet if not already connected
            await this.connectWallet();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            AgriTraceUtils.showToast('Failed to initialize dashboard', 'error');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Allow external links (like Back to Home) to work normally
                if (href && (href.startsWith('../') || href.startsWith('http') || href.startsWith('/'))) {
                    // Don't prevent default for external links
                    return;
                }
                
                // Prevent default only for internal navigation
                e.preventDefault();
                const section = href.substring(1);
                this.showSection(section);
            });
        });

        // Wallet connection
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => this.connectWallet());
        }

        // Quick actions
        const quickActions = [
            'quickCreateProduct',
            'quickAddHarvest',
            'quickViewProducts',
            'quickGenerateQR'
        ];

        quickActions.forEach(actionId => {
            const btn = document.getElementById(actionId);
            if (btn) {
                btn.addEventListener('click', () => this.handleQuickAction(actionId));
            }
        });

        // Create product form
        const createProductForm = document.getElementById('createProductForm');
        if (createProductForm) {
            createProductForm.addEventListener('submit', (e) => this.handleCreateProduct(e));
        }

        // Cancel create product
        const cancelCreateProduct = document.getElementById('cancelCreateProduct');
        if (cancelCreateProduct) {
            cancelCreateProduct.addEventListener('click', () => this.showSection('products'));
        }

        // Create product button
        const createProductBtn = document.getElementById('createProductBtn');
        if (createProductBtn) {
            createProductBtn.addEventListener('click', () => this.showSection('create-product'));
        }

        // Add harvest event button
        const addHarvestEventBtn = document.getElementById('addHarvestEventBtn');
        if (addHarvestEventBtn) {
            addHarvestEventBtn.addEventListener('click', () => this.showAddHarvestModal());
        }

        // Upload certification button
        const uploadCertificationBtn = document.getElementById('uploadCertificationBtn');
        if (uploadCertificationBtn) {
            uploadCertificationBtn.addEventListener('click', () => this.showUploadCertificationModal());
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleUpdateProfile(e));
        }

        // Refresh profile button
        const refreshProfileBtn = document.getElementById('refreshProfileBtn');
        if (refreshProfileBtn) {
            refreshProfileBtn.addEventListener('click', () => this.loadProfileData());
        }

        // Account change events
        window.addEventListener('accountChanged', (event) => {
            this.handleAccountChange(event.detail.account);
        });
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
            
            // Load user information
            await this.loadUserInfo();
            
            AgriTraceUtils.showToast('Wallet connected successfully', 'success');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            AgriTraceUtils.showToast(error.message, 'error');
            
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

            // For admin pages, check if user is admin first
            if (this.isAdminPage()) {
                const isAdmin = await this.blockchainService.isAdmin();
                if (isAdmin) {
                    // Admin doesn't need to be registered, create admin user object
                    this.currentUser = {
                        userAddress: this.blockchainService.getCurrentAccount(),
                        address: this.blockchainService.getCurrentAccount(), // Add this for compatibility
                        role: 'ADMIN',
                        companyName: 'System Administrator',
                        isVerified: true,
                        isActive: true,
                        registrationDate: Date.now()
                    };
                    console.log('Admin user loaded:', this.currentUser);
                    this.updateUserInfoUI();
                    return;
                } else {
                    // Not admin, redirect or show error
                    this.handleNonAdminAccess();
                    return;
                }
            }
            
            // Regular user flow
            this.currentUser = await this.blockchainService.getCurrentUser();
            console.log('Current user:', this.currentUser);
            
            // Update UI with user info
            this.updateUserInfoUI();
            
            // Check if user is registered
            if (!this.currentUser || !this.currentUser.userAddress) {
                // User not registered - no action needed
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            // User might not be registered yet - no action needed
        }
    }

    /**
     * Check if current page is admin page
     */
    isAdminPage() {
        return window.location.pathname.includes('admin.html') || 
               window.location.pathname.includes('admin-approval.html');
    }

    /**
     * Handle non-admin access to admin pages
     */
    handleNonAdminAccess() {
        console.log('Non-admin trying to access admin page');
        
        // Show error message
        if (typeof AgriTraceUtils !== 'undefined') {
            AgriTraceUtils.showToast('Admin access required. Redirecting...', 'error');
        }
        
        // Redirect to admin setup page after delay
        setTimeout(() => {
            window.location.href = '../admin-setup.html';
        }, 2000);
    }

    /**
     * Update user info UI
     */
    updateUserInfoUI() {
        if (!this.currentUser) return;

        // Update user name and role
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userAvatar = document.getElementById('userAvatar');

        if (userName) userName.textContent = this.currentUser.companyName || 'Unknown';
        if (userRole) userRole.textContent = AgriTraceUtils.getRoleDisplayName(this.currentUser.role);
        if (userAvatar) userAvatar.textContent = this.currentUser.role.charAt(0);

        // Update profile form
        this.updateProfileForm();
    }

    /**
     * Update profile form
     */
    updateProfileForm() {
        if (!this.currentUser) return;

        const profileCompanyName = document.getElementById('profileCompanyName');
        const profileRole = document.getElementById('profileRole');
        const profileAddress = document.getElementById('profileAddress');
        const profileStatus = document.getElementById('profileStatus');

        if (profileCompanyName) profileCompanyName.value = this.currentUser.companyName || '';
        if (profileRole) profileRole.value = AgriTraceUtils.getRoleDisplayName(this.currentUser.role);
        if (profileAddress) profileAddress.value = this.currentUser.userAddress || this.currentUser.address || '';
        if (profileStatus) {
            profileStatus.value = this.currentUser.isVerified ? 'Verified' : 'Pending Verification';
            profileStatus.className = `form-control ${this.currentUser.isVerified ? 'text-success' : 'text-warning'}`;
        }
    }

    /**
     * Handle account change
     */
    handleAccountChange(account) {
        if (account) {
            this.updateWalletConnectionUI(account);
            this.loadUserInfo();
        } else {
            this.currentUser = null;
            this.updateWalletConnectionUI(null);
            AgriTraceUtils.showToast('Wallet disconnected', 'warning');
        }
    }

    /**
     * Show section
     */
    showSection(sectionId) {
        try {
            // Update navigation
            const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });

            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.add('d-none');
            });

            // Show selected section
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.remove('d-none');
                this.currentSection = sectionId;

                // Load section-specific data
                this.loadSectionData(sectionId);
            }
        } catch (error) {
            console.error('Error showing section:', error);
            AgriTraceUtils.showToast('Failed to navigate to section', 'error');
        }
    }

    /**
     * Load section-specific data
     */
    async loadSectionData(sectionId) {
        try {
            switch (sectionId) {
                case 'overview':
                    await this.loadOverviewData();
                    break;
                case 'products':
                    await this.loadProductsData();
                    break;
                case 'harvest-events':
                    await this.loadHarvestEventsData();
                    break;
                case 'certifications':
                    await this.loadCertificationsData();
                    break;
                case 'profile':
                    await this.loadProfileData();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${sectionId} data:`, error);
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            if (!this.blockchainService.isConnected()) {
                return;
            }

            // Load overview data
            await this.loadOverviewData();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    /**
     * Load overview data
     */
    async loadOverviewData() {
        try {
            // Load stats
            await this.loadStats();

            // Load recent activity
            await this.loadRecentActivity();

            // Load category stats
            await this.loadCategoryStats();

            // Load account stats if on profile section
            if (this.currentSection === 'profile') {
                await this.loadAccountStats();
            }
        } catch (error) {
            console.error('Error loading overview data:', error);
        }
    }

    /**
     * Load stats
     */
    async loadStats() {
        try {
            if (!this.blockchainService.isConnected()) return;

            // Try to get batch IDs, but handle gracefully if it fails
            let batchIds = [];
            try {
                batchIds = await this.blockchainService.getAllBatchIds();
                console.log('Retrieved batch IDs:', batchIds);
            } catch (error) {
                console.warn('Could not retrieve batch IDs (contract may not have this method or no products exist):', error.message);
                
                // If getAllBatchIds fails, show empty state
                this.userProducts = [];
                this.updateStats([]);
                
                // Show a helpful message
                const statsContainer = document.getElementById('statsContainer');
                if (statsContainer) {
                    const existingAlert = statsContainer.querySelector('.alert-info');
                    if (!existingAlert) {
                        const noProductsMsg = document.createElement('div');
                        noProductsMsg.className = 'alert alert-info';
                        noProductsMsg.innerHTML = `
                            <i class="fas fa-info-circle me-2"></i>
                            No products found. Create your first product to get started!
                        `;
                        statsContainer.appendChild(noProductsMsg);
                    }
                }
                return;
            }

            const userProducts = [];

            // Filter products for current user
            for (const batchId of batchIds) {
                try {
                    const product = await this.blockchainService.getProduct(batchId);
                    if (product.farmer.toLowerCase() === this.blockchainService.getCurrentAccount().toLowerCase()) {
                        userProducts.push(product);
                    }
                } catch (error) {
                    console.warn(`Error loading product ${batchId}:`, error);
                }
            }

            this.userProducts = userProducts;

            // Update stats
            this.updateStats(userProducts);
        } catch (error) {
            console.error('Error loading stats:', error);
            
            // Fallback: show empty state
            this.userProducts = [];
            this.updateStats([]);
        }
    }

    /**
     * Update stats UI
     */
    updateStats(products) {
        try {
            // Total products
            const totalProducts = document.getElementById('totalProducts');
            if (totalProducts) totalProducts.textContent = products.length;

            // Total harvests (events)
            const totalHarvests = document.getElementById('totalHarvests');
            if (totalHarvests) {
                const harvestEvents = products.reduce((count, product) => {
                    // This would need to be calculated from events
                    return count + 1; // Simplified for now
                }, 0);
                totalHarvests.textContent = harvestEvents;
            }

            // Verified products
            const verifiedProducts = document.getElementById('verifiedProducts');
            if (verifiedProducts) {
                const verified = products.filter(product => product.isActive).length;
                verifiedProducts.textContent = verified;
            }

            // Active supply chains
            const activeSupplyChains = document.getElementById('activeSupplyChains');
            if (activeSupplyChains) {
                const active = products.filter(product => {
                    const now = new Date();
                    return new Date(product.expiryDate) > now;
                }).length;
                activeSupplyChains.textContent = active;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        try {
            const recentActivity = document.getElementById('recentActivity');
            if (!recentActivity) return;

            // Simulate recent activity (in real app, this would come from events)
            const activities = [
                {
                    icon: 'fa-plus-circle',
                    color: '#28a745',
                    title: 'Product Created',
                    description: 'Created new batch of Organic Tomatoes',
                    time: '2 hours ago'
                },
                {
                    icon: 'fa-seedling',
                    color: '#20c997',
                    title: 'Harvest Event',
                    description: 'Harvested 500kg of Tomatoes',
                    time: '1 day ago'
                },
                {
                    icon: 'fa-upload',
                    color: '#007bff',
                    title: 'Document Uploaded',
                    description: 'Uploaded organic certification',
                    time: '2 days ago'
                }
            ];

            const activityHtml = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon" style="background-color: ${activity.color}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');

            recentActivity.innerHTML = activityHtml;
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    /**
     * Load category stats
     */
    async loadCategoryStats() {
        try {
            const categoryStats = document.getElementById('categoryStats');
            if (!categoryStats) return;

            // Group products by category
            const categories = {};
            this.userProducts.forEach(product => {
                categories[product.category] = (categories[product.category] || 0) + 1;
            });

            const categoryHtml = Object.entries(categories).map(([category, count]) => `
                <div class="category-item d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <div class="fw-bold">${category}</div>
                        <div class="text-muted small">${count} product${count !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="category-count">
                        <span class="badge bg-primary">${count}</span>
                    </div>
                </div>
            `).join('') || '<p class="text-muted">No products found</p>';

            categoryStats.innerHTML = categoryHtml;
        } catch (error) {
            console.error('Error loading category stats:', error);
        }
    }

    /**
     * Load products data
     */
    async loadProductsData() {
        try {
            const productsTableBody = document.getElementById('productsTableBody');
            if (!productsTableBody) return;

            if (this.userProducts.length === 0) {
                productsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <i class="fas fa-box fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No products found</p>
                            <button class="btn btn-primary" onclick="dashboardManager.showSection('create-product')">
                                <i class="fas fa-plus me-2"></i>Create Your First Product
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            const productsHtml = this.userProducts.map(product => {
                const isExpired = new Date() > new Date(product.expiryDate);
                const statusClass = isExpired ? 'badge-expired' : 'badge-active';
                const statusText = isExpired ? 'Expired' : 'Active';

                return `
                    <tr>
                        <td>
                            <div class="fw-bold">${AgriTraceUtils.sanitizeHtml(product.productName)}</div>
                        </td>
                        <td>
                            <code>${AgriTraceUtils.sanitizeHtml(product.batchId)}</code>
                        </td>
                        <td>
                            <span class="badge badge-dashboard badge-${product.category.toLowerCase()}">
                                ${AgriTraceUtils.sanitizeHtml(product.category)}
                            </span>
                        </td>
                        <td>
                            ${AgriTraceUtils.formatNumber(product.quantity)} ${AgriTraceUtils.sanitizeHtml(product.unit)}
                        </td>
                        <td>
                            ${AgriTraceUtils.formatDate(product.harvestDate)}
                        </td>
                        <td>
                            <span class="badge-status ${statusClass}">${statusText}</span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="dashboardManager.viewProduct('${product.batchId}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-secondary" onclick="dashboardManager.generateProductQR('${product.batchId}')">
                                    <i class="fas fa-qrcode"></i>
                                </button>
                                <button class="btn btn-outline-info" onclick="dashboardManager.editProduct('${product.batchId}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            productsTableBody.innerHTML = productsHtml;
        } catch (error) {
            console.error('Error loading products data:', error);
        }
    }

    /**
     * Load harvest events data
     */
    async loadHarvestEventsData() {
        try {
            const harvestEventsTableBody = document.getElementById('harvestEventsTableBody');
            if (!harvestEventsTableBody) return;

            // For now, show products as harvest events (simplified)
            if (this.userProducts.length === 0) {
                harvestEventsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <i class="fas fa-seedling fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No harvest events found</p>
                            <button class="btn btn-primary" onclick="dashboardManager.showAddHarvestModal()">
                                <i class="fas fa-plus me-2"></i>Add Harvest Event
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            // Try to load actual events from blockchain
            let actualEvents = [];
            try {
                // Get events for all user products
                for (const product of this.userProducts) {
                    const events = await this.blockchainService.getEvents(product.batchId);
                    if (events && events.length > 0) {
                        actualEvents = actualEvents.concat(events);
                    }
                }
            } catch (error) {
                console.warn('Could not load events from blockchain:', error);
            }
            
            // If no events found, show message
            if (actualEvents.length === 0) {
                // No events found
            }

            let eventsHtml = '';

            // Show actual events if available
            if (actualEvents.length > 0) {
                eventsHtml = actualEvents.map(event => {
                    const eventTypeNames = {
                        '0': 'HARVEST',
                        '1': 'PROCESSING', 
                        '2': 'TRANSPORT_START',
                        '3': 'TRANSPORT_END',
                        '4': 'WAREHOUSE_IN',
                        '5': 'WAREHOUSE_OUT',
                        '6': 'RETAIL_RECEIVE',
                        '7': 'SALE'
                    };
                    
                    const eventTypeName = eventTypeNames[event.eventType] || 'UNKNOWN';
                    const eventDate = new Date(event.timestamp * 1000).toLocaleDateString();
                    
                    // Find product name for this batchId
                    const product = this.userProducts.find(p => p.batchId === event.batchId);
                    const productName = product ? product.productName : 'Unknown Product';
                    
                    return `
                        <tr>
                            <td><code>${AgriTraceUtils.sanitizeHtml(event.batchId)}</code></td>
                            <td><span class="badge bg-success">${AgriTraceUtils.sanitizeHtml(productName)}</span></td>
                            <td>${eventDate}</td>
                            <td>${AgriTraceUtils.sanitizeHtml(event.location || 'N/A')}</td>
                            <td>${AgriTraceUtils.formatAddress(event.actor)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardManager.viewEventDetails('${event.batchId}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${event.ipfsHash ? `
                                    <button class="btn btn-sm btn-outline-info" onclick="dashboardManager.viewEventDocuments('${event.ipfsHash}')">
                                        <i class="fas fa-file-alt"></i>
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                // Fallback: Show products as harvest events
                eventsHtml = this.userProducts.map(product => `
                    <tr>
                        <td>
                            <code>${AgriTraceUtils.sanitizeHtml(product.batchId)}</code>
                        </td>
                        <td>
                            <span class="badge bg-success">${AgriTraceUtils.sanitizeHtml(product.productName)}</span>
                        </td>
                        <td>
                            ${AgriTraceUtils.formatDate(product.harvestDate)}
                        </td>
                        <td>
                            ${AgriTraceUtils.sanitizeHtml(product.origin)}
                        </td>
                        <td>
                            ${AgriTraceUtils.formatAddress(product.farmer)}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboardManager.viewEventDetails('${product.batchId}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }

            harvestEventsTableBody.innerHTML = eventsHtml;
        } catch (error) {
            console.error('Error loading harvest events data:', error);
        }
    }

    /**
     * Load certifications data
     */
    async loadCertificationsData() {
        this.loadCertifications();
    }

    /**
     * Load profile data
     */
    async loadProfileData() {
        try {
            await this.loadUserInfo();
            await this.loadAccountStats();
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    /**
     * Load account stats
     */
    async loadAccountStats() {
        try {
            const accountStats = document.getElementById('accountStats');
            if (!accountStats) return;

            const stats = [
                { label: 'Registration Date', value: this.currentUser ? AgriTraceUtils.formatDate(this.currentUser.registrationDate) : 'Unknown' },
                { label: 'Account Status', value: this.currentUser && this.currentUser.isVerified ? 'Verified' : 'Pending' },
                { label: 'Total Products', value: this.userProducts.length },
                { label: 'Active Products', value: this.userProducts.filter(p => p.isActive).length }
            ];

            const statsHtml = stats.map(stat => `
                <div class="account-stat d-flex justify-content-between align-items-center mb-3">
                    <span class="stat-label">${stat.label}</span>
                    <span class="stat-value fw-bold">${stat.value}</span>
                </div>
            `).join('');

            accountStats.innerHTML = statsHtml;
        } catch (error) {
            console.error('Error loading account stats:', error);
        }
    }

    /**
     * Handle quick actions
     */
    handleQuickAction(actionId) {
        switch (actionId) {
            case 'quickCreateProduct':
                this.showSection('create-product');
                break;
            case 'quickAddHarvest':
                this.showAddHarvestModal();
                break;
            case 'quickViewProducts':
                this.showSection('products');
                break;
            case 'quickGenerateQR':
                this.showGenerateQRModal();
                break;
        }
    }

    /**
     * Handle create product form submission
     */
    async handleCreateProduct(event) {
        event.preventDefault();
        
        try {
            // Get form data
            const formData = new FormData(event.target);
            const productData = {
                productName: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                origin: document.getElementById('productOrigin').value,
                harvestDate: new Date(document.getElementById('harvestDate').value),
                expiryDate: new Date(document.getElementById('expiryDate').value),
                quantity: parseInt(document.getElementById('productQuantity').value),
                unit: document.getElementById('productUnit').value,
                notes: document.getElementById('productNotes').value
            };

            // Generate batch ID if not provided
            let batchId = document.getElementById('batchId').value;
            if (!batchId) {
                batchId = AgriTraceUtils.generateBatchId(productData.productName);
                document.getElementById('batchId').value = batchId;
            }

            // Upload documents to IPFS if any
            let ipfsHash = '';
            const documents = document.getElementById('productDocuments').files;
            if (documents.length > 0) {
                const documentsData = {
                    notes: productData.notes,
                    documents: []
                };

                for (let i = 0; i < documents.length; i++) {
                    const fileHash = await this.ipfsService.uploadFile(documents[i]);
                    documentsData.documents.push({
                        fileName: documents[i].name,
                        fileHash: fileHash,
                        fileSize: documents[i].size,
                        fileType: documents[i].type
                    });
                }

                ipfsHash = await this.ipfsService.uploadJSON(documentsData);
            }

            // Create product on blockchain
            const tx = await this.blockchainService.createProduct({
                ...productData,
                batchId,
                ipfsHash
            });

            AgriTraceUtils.showToast('Product created successfully!', 'success');
            
            // Reset form
            event.target.reset();
            
            // Navigate to products section
            this.showSection('products');
            
            // Reload products data
            await this.loadProductsData();

        } catch (error) {
            console.error('Error creating product:', error);
            AgriTraceUtils.showToast(`Failed to create product: ${error.message}`, 'error');
        }
    }

    /**
     * Handle update profile form submission
     */
    async handleUpdateProfile(event) {
        event.preventDefault();
        
        try {
            // This would typically update user information
            // For now, just show success message
            AgriTraceUtils.showToast('Profile updated successfully!', 'success');
            
            // Reload profile data
            await this.loadProfileData();

        } catch (error) {
            console.error('Error updating profile:', error);
            AgriTraceUtils.showToast(`Failed to update profile: ${error.message}`, 'error');
        }
    }

    /**
     * View product details
     */
    viewProduct(batchId) {
        // Open product in new tab with batch ID
        const url = `../index.html?batch=${encodeURIComponent(batchId)}`;
        window.open(url, '_blank');
    }

    /**
     * View event details
     */
    async viewEventDetails(batchId) {
        try {
            // Get events for this product
            const events = await this.blockchainService.getEvents(batchId);
            
            if (!events || events.length === 0) {
                AgriTraceUtils.showToast('No events found for this product', 'info');
                return;
            }

            // Create modal to show event details
            const eventsHtml = events.map(event => {
                const eventTypeNames = {
                    '0': 'HARVEST',
                    '1': 'PROCESSING', 
                    '2': 'TRANSPORT_START',
                    '3': 'TRANSPORT_END',
                    '4': 'WAREHOUSE_IN',
                    '5': 'WAREHOUSE_OUT',
                    '6': 'RETAIL_RECEIVE',
                    '7': 'SALE'
                };
                
                const eventTypeName = eventTypeNames[event.eventType] || 'UNKNOWN';
                const eventDate = new Date(event.timestamp * 1000).toLocaleString();
                
                return `
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas fa-seedling me-2"></i>${eventTypeName}
                            </h6>
                            <span class="badge bg-primary">${eventDate}</span>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Actor:</strong> ${AgriTraceUtils.formatAddress(event.actor)}</p>
                                    <p><strong>Location:</strong> ${event.location || 'Not specified'}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Event ID:</strong> ${event.eventId}</p>
                                    <p><strong>Batch ID:</strong> ${event.batchId}</p>
                                </div>
                            </div>
                            ${event.notes ? `<p><strong>Notes:</strong> ${event.notes}</p>` : ''}
                            ${event.ipfsHash ? `
                                <div class="mt-2">
                                    <button class="btn btn-sm btn-outline-info" onclick="dashboardManager.viewEventDocuments('${event.ipfsHash}')">
                                        <i class="fas fa-file-alt me-1"></i>View Documents
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            const modalHtml = `
                <div class="modal fade" id="eventDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Event History - ${batchId}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="timeline">
                                    ${eventsHtml}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="dashboardManager.generateProductQR('${batchId}')">
                                    <i class="fas fa-qrcode me-1"></i>Generate QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('eventDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
            modal.show();

        } catch (error) {
            console.error('Error loading event details:', error);
            AgriTraceUtils.showToast('Failed to load event details', 'error');
        }
    }

    /**
     * View event documents from IPFS
     */
    async viewEventDocuments(ipfsHash) {
        try {
            AgriTraceUtils.showToast('Loading documents...', 'info');
            
            const documents = await this.ipfsService.getJSON(ipfsHash);
            
            if (!documents) {
                AgriTraceUtils.showToast('No documents found', 'info');
                return;
            }
            
            if (!documents.documents) {
                AgriTraceUtils.showToast('No documents array found', 'info');
                return;
            }

            // Create modal to show documents
            const documentsHtml = documents.documents.map(doc => `
                <div class="card mb-2">
                    <div class="card-body">
                        <h6 class="card-title">${doc.fileName}</h6>
                        <p class="card-text">
                            <small class="text-muted">
                                Size: ${(doc.fileSize / 1024).toFixed(1)} KB | 
                                Type: ${doc.fileType}
                            </small>
                        </p>
                        <a href="https://gateway.pinata.cloud/ipfs/${doc.fileHash}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-external-link-alt me-1"></i>View Document
                        </a>
                    </div>
                </div>
            `).join('');

            const modalHtml = `
                <div class="modal fade" id="documentsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Event Documents</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${documents.qualityChecks ? `
                                    <div class="mb-3">
                                        <h6>Quality Checks:</h6>
                                        <ul>
                                            ${documents.qualityChecks.map(check => `<li>${check}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${documents.weather ? `
                                    <div class="mb-3">
                                        <h6>Weather Conditions:</h6>
                                        <p>${documents.weather}</p>
                                    </div>
                                ` : ''}
                                
                                ${documents.method ? `
                                    <div class="mb-3">
                                        <h6>Harvest Method:</h6>
                                        <p>${documents.method}</p>
                                    </div>
                                ` : ''}
                                
                                <h6>Uploaded Documents:</h6>
                                ${documentsHtml}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('documentsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('documentsModal'));
            modal.show();

        } catch (error) {
            console.error('Error loading documents:', error);
            AgriTraceUtils.showToast('Failed to load documents', 'error');
        }
    }

    /**
     * Generate QR code for product
     */
    async generateProductQR(batchId) {
        try {
            console.log('Dashboard: Generating QR code for batch:', batchId);
            const qrDataURL = await this.qrGenerator.generateProductQR(batchId);
            console.log('Dashboard: QR dataURL received:', qrDataURL ? 'Valid dataURL' : 'Invalid/undefined');
            console.log('Dashboard: QR dataURL length:', qrDataURL ? qrDataURL.length : 'N/A');
            
            if (!qrDataURL || !qrDataURL.startsWith('data:image/png')) {
                throw new Error('Invalid QR code dataURL generated');
            }
            
            // Create modal to show QR code
            const modalHtml = `
                <div class="modal fade" id="qrModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Product QR Code</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-center">
                                <div class="qr-code-container" style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
                                    <img id="qrCodeImage" src="${qrDataURL}" alt="Product QR Code" class="img-fluid border" 
                                         style="max-width: 300px; max-height: 300px; width: auto; height: auto; display: block;">
                                </div>
                                <p class="mt-3 mb-0"><strong>Batch ID:</strong> ${batchId}</p>
                                <p class="mt-1 mb-0"><small class="text-muted">Scan this QR code to view product details</small></p>
                                <div class="mt-2">
                                    <small class="text-muted">Debug: DataURL length: ${qrDataURL.length} chars</small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="dashboardManager.downloadQR('${batchId}')">
                                    <i class="fas fa-download me-2"></i>Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('qrModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('qrModal'));
            modal.show();

            // Store QR data URL for download
            this.currentQRDataURL = qrDataURL;
            
            // Set image src after modal is shown
            const modalElement = document.getElementById('qrModal');
            modalElement.addEventListener('shown.bs.modal', () => {
                console.log('Dashboard: Modal shown, setting image src...');
                const img = document.getElementById('qrCodeImage');
                if (img) {
                    // Force image reload
                    img.src = qrDataURL;
                    img.style.display = 'block';
                    
                    // Additional debug
                    setTimeout(() => {
                        console.log('Dashboard: Image after modal shown:');
                        console.log('Dashboard: - src:', img.src ? 'Set' : 'Not set');
                        console.log('Dashboard: - naturalWidth:', img.naturalWidth);
                        console.log('Dashboard: - naturalHeight:', img.naturalHeight);
                        console.log('Dashboard: - computed display:', window.getComputedStyle(img).display);
                        console.log('Dashboard: - computed visibility:', window.getComputedStyle(img).visibility);
                        console.log('Dashboard: - computed opacity:', window.getComputedStyle(img).opacity);
                        
                        if (img.naturalWidth === 0) {
                            console.warn('Dashboard: Image still not loaded after modal shown');
                            // Try alternative approach
                            img.onload = () => {
                                console.log('Dashboard: Image loaded via onload event');
                            };
                            img.onerror = (e) => {
                                console.error('Dashboard: Image load error:', e);
                            };
                        }
                    }, 100);
                }
            }, { once: true });
            
            // Debug: Check if image loads
            setTimeout(() => {
                const img = document.getElementById('qrCodeImage');
                if (img) {
                    console.log('Dashboard: Image element found, src:', img.src ? 'Set' : 'Not set');
                    console.log('Dashboard: Image naturalWidth:', img.naturalWidth);
                    console.log('Dashboard: Image naturalHeight:', img.naturalHeight);
                    
                    if (img.naturalWidth === 0) {
                        console.warn('Dashboard: Image failed to load - naturalWidth is 0');
                    }
                } else {
                    console.error('Dashboard: Image element not found after modal creation');
                }
            }, 100);

        } catch (error) {
            console.error('Error generating QR code:', error);
            AgriTraceUtils.showToast('Failed to generate QR code', 'error');
        }
    }

    /**
     * Download QR code
     */
    downloadQR(batchId) {
        try {
            if (this.currentQRDataURL) {
                // Create download link
                const link = document.createElement('a');
                link.href = this.currentQRDataURL;
                link.download = `product-${batchId}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                AgriTraceUtils.showToast('QR code downloaded successfully', 'success');
            } else {
                AgriTraceUtils.showToast('No QR code to download', 'warning');
            }
        } catch (error) {
            console.error('Error downloading QR code:', error);
            AgriTraceUtils.showToast('Failed to download QR code', 'error');
        }
    }

    /**
     * Edit product
     */
    editProduct(batchId) {
        // For now, just show a message
        AgriTraceUtils.showToast('Product editing not implemented yet', 'info');
    }

    /**
     * Show add harvest modal
     */
    showAddHarvestModal() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="addHarvestModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Harvest Event</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="harvestEventForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harvestBatchId" class="form-label">Product Batch ID</label>
                                            <select class="form-select" id="harvestBatchId" required>
                                                <option value="">Select Product...</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harvestDate" class="form-label">Harvest Date</label>
                                            <input type="datetime-local" class="form-control" id="harvestDate" required>
                                            <div class="form-text">
                                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setCurrentDateTime()">
                                                    <i class="fas fa-clock me-1"></i>Set Current Time
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harvestLocation" class="form-label">Harvest Location</label>
                                            <input type="text" class="form-control" id="harvestLocation" placeholder="Farm location or GPS coordinates" required>
                                            <div class="form-text">
                                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="getCurrentLocation()">
                                                    <i class="fas fa-map-marker-alt me-1"></i>Get Current Location
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harvestQuantity" class="form-label">Harvest Quantity</label>
                                            <input type="number" class="form-control" id="harvestQuantity" placeholder="0" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harvestUnit" class="form-label">Unit</label>
                                            <select class="form-select" id="harvestUnit" required>
                                                <option value="kg">Kilograms (kg)</option>
                                                <option value="tons">Tons</option>
                                                <option value="lbs">Pounds (lbs)</option>
                                                <option value="pieces">Pieces</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harvestMethod" class="form-label">Harvest Method</label>
                                            <select class="form-select" id="harvestMethod" required>
                                                <option value="manual">Manual Harvest</option>
                                                <option value="mechanical">Mechanical Harvest</option>
                                                <option value="mixed">Mixed (Manual + Mechanical)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="harvestQuality" class="form-label">Quality Check</label>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="qualityRipeness" value="ripeness">
                                                <label class="form-check-label" for="qualityRipeness">Proper Ripeness</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="qualitySize" value="size">
                                                <label class="form-check-label" for="qualitySize">Correct Size</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="qualityColor" value="color">
                                                <label class="form-check-label" for="qualityColor">Good Color</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="harvestWeather" class="form-label">Weather Conditions</label>
                                    <input type="text" class="form-control" id="harvestWeather" placeholder="e.g., Sunny, 25°C, Low humidity">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="harvestNotes" class="form-label">Additional Notes</label>
                                    <textarea class="form-control" id="harvestNotes" rows="3" placeholder="Any additional information about the harvest..."></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="harvestDocuments" class="form-label">Upload Documents/Photos</label>
                                    <input type="file" class="form-control" id="harvestDocuments" multiple accept="image/*,.pdf,.doc,.docx">
                                    <div class="form-text">Upload photos of harvest, quality certificates, or other relevant documents</div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="dashboardManager.submitHarvestEvent()">
                                <i class="fas fa-plus me-1"></i>Add Harvest Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('addHarvestModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Populate product dropdown
        this.populateHarvestProductDropdown();

        // Set default harvest date to now
        const harvestDateInput = document.getElementById('harvestDate');
        if (harvestDateInput) {
            // Set current date and time in datetime-local format (YYYY-MM-DDTHH:MM)
            const now = new Date();
            const currentDateTime = now.toISOString().slice(0, 16);
            
            harvestDateInput.value = currentDateTime;
            
            console.log('Set default harvest date (datetime-local):', currentDateTime);
            
            // Add event listener to debug date changes
            harvestDateInput.addEventListener('input', function() {
                console.log('Harvest date input changed:', {
                    value: this.value,
                    length: this.value.length,
                    type: this.type
                });
            });
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addHarvestModal'));
        modal.show();

    }

    /**
     * Populate harvest product dropdown
     */
    populateHarvestProductDropdown() {
        const dropdown = document.getElementById('harvestBatchId');
        if (!dropdown) {
            console.error('harvestBatchId dropdown not found');
            return;
        }

        dropdown.innerHTML = '<option value="">Select Product...</option>';
        
        console.log('Populating dropdown with products:', this.userProducts);
        
        if (this.userProducts.length === 0) {
            console.warn('No user products available for harvest event');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No products available - Create a product first';
            option.disabled = true;
            dropdown.appendChild(option);
            return;
        }
        
        this.userProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.batchId;
            option.textContent = `${product.productName} (${product.batchId})`;
            dropdown.appendChild(option);
        });
    }

    /**
     * Submit harvest event
     */
    async submitHarvestEvent() {
        try {
            // Get form data with EXTENSIVE debugging
            console.log('=== STARTING FORM SUBMISSION DEBUG ===');
            
            const batchIdElement = document.getElementById('harvestBatchId');
            const harvestDateElement = document.getElementById('harvestDate');
            const locationElement = document.getElementById('harvestLocation');
            const quantityElement = document.getElementById('harvestQuantity');
            const unitElement = document.getElementById('harvestUnit');
            const methodElement = document.getElementById('harvestMethod');
            const weatherElement = document.getElementById('harvestWeather');
            const notesElement = document.getElementById('harvestNotes');

            console.log('=== ELEMENT EXISTENCE CHECK ===');
            console.log('batchIdElement:', batchIdElement);
            console.log('harvestDateElement:', harvestDateElement);
            console.log('locationElement:', locationElement);
            console.log('quantityElement:', quantityElement);
            console.log('unitElement:', unitElement);
            console.log('methodElement:', methodElement);
            console.log('weatherElement:', weatherElement);
            console.log('notesElement:', notesElement);

            // Try multiple ways to get harvest date
            let harvestDate = '';
            if (harvestDateElement) {
                harvestDate = harvestDateElement.value || '';
                console.log('=== HARVEST DATE DEBUG ===');
                console.log('harvestDateElement.value:', harvestDateElement.value);
                console.log('harvestDateElement.value.length:', harvestDateElement.value ? harvestDateElement.value.length : 0);
                console.log('harvestDateElement.type:', harvestDateElement.type);
                console.log('harvestDateElement.id:', harvestDateElement.id);
                console.log('harvestDateElement.className:', harvestDateElement.className);
                console.log('harvestDateElement.outerHTML:', harvestDateElement.outerHTML);
                
                // Try alternative ways to get value
                console.log('Alternative value methods:');
                console.log('- harvestDateElement.defaultValue:', harvestDateElement.defaultValue);
                console.log('- harvestDateElement.getAttribute("value"):', harvestDateElement.getAttribute('value'));
                console.log('- harvestDateElement.dataset:', harvestDateElement.dataset);
            } else {
                console.error('harvestDateElement NOT FOUND!');
            }

            const batchId = batchIdElement ? batchIdElement.value : '';
            const location = locationElement ? locationElement.value : '';
            const quantity = quantityElement ? parseInt(quantityElement.value) : 0;
            const unit = unitElement ? unitElement.value : '';
            const method = methodElement ? methodElement.value : '';
            const weather = weatherElement ? weatherElement.value : '';
            const notes = notesElement ? notesElement.value : '';

            console.log('=== FINAL FORM VALUES ===');
            console.log('batchId:', batchId, '(length:', batchId.length, ')');
            console.log('harvestDate:', harvestDate, '(length:', harvestDate.length, ')');
            console.log('location:', location, '(length:', location.length, ')');
            console.log('quantity:', quantity);
            console.log('unit:', unit, '(length:', unit.length, ')');
            console.log('method:', method, '(length:', method.length, ')');
            console.log('weather:', weather, '(length:', weather.length, ')');
            console.log('notes:', notes, '(length:', notes.length, ')');
            
            // Get quality checks
            const qualityChecks = [];
            if (document.getElementById('qualityRipeness').checked) qualityChecks.push('Proper Ripeness');
            if (document.getElementById('qualitySize').checked) qualityChecks.push('Correct Size');
            if (document.getElementById('qualityColor').checked) qualityChecks.push('Good Color');
            
            // Validate required fields with detailed checking
            const validationErrors = [];
            
            if (!batchId || batchId.trim() === '') {
                validationErrors.push('Batch ID is required');
            }
            
            // Validate harvest date format (YYYY-MM-DD HH:MM)
            let actualHarvestDate = harvestDate;
            
            // WORKAROUND: If harvest date is empty, try to get it again or set default
            if (!actualHarvestDate || actualHarvestDate.trim() === '') {
                console.log('=== WORKAROUND: Harvest date is empty, trying to fix ===');
                
                // Try to get the element again
                const retryHarvestDateElement = document.getElementById('harvestDate');
                if (retryHarvestDateElement) {
                    actualHarvestDate = retryHarvestDateElement.value || '';
                    console.log('Retry harvestDateElement.value:', actualHarvestDate);
                    
                    // If still empty, set current date/time in datetime-local format
                    if (!actualHarvestDate || actualHarvestDate.trim() === '') {
                        const now = new Date();
                        actualHarvestDate = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
                        
                        // Set the value back to the input
                        retryHarvestDateElement.value = actualHarvestDate;
                        console.log('Set default harvest date (datetime-local):', actualHarvestDate);
                    }
                }
            }
            
            if (!actualHarvestDate || actualHarvestDate.trim() === '') {
                validationErrors.push('Harvest Date is required');
            } else {
                // Validate datetime-local format (YYYY-MM-DDTHH:MM)
                const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
                if (!dateRegex.test(actualHarvestDate.trim())) {
                    validationErrors.push('Harvest Date must be in datetime format (YYYY-MM-DDTHH:MM)');
                } else {
                    // Try to parse the date to ensure it's valid
                    const testDate = new Date(actualHarvestDate.trim());
                    if (isNaN(testDate.getTime())) {
                        validationErrors.push('Invalid harvest date - please check the date and time');
                    }
                }
            }
            
            if (!location || location.trim() === '') {
                validationErrors.push('Harvest Location is required');
            }
            
            if (!quantity || isNaN(quantity) || quantity <= 0) {
                validationErrors.push('Quantity must be a positive number');
            }
            
            if (!unit || unit.trim() === '') {
                validationErrors.push('Unit is required');
            }
            
            if (validationErrors.length > 0) {
                AgriTraceUtils.showToast('Validation failed: ' + validationErrors.join(', '), 'warning');
                console.log('Validation failed:', {
                    batchId: batchId,
                    harvestDate: harvestDate,
                    actualHarvestDate: actualHarvestDate,
                    location: location,
                    quantity: quantity,
                    unit: unit,
                    errors: validationErrors
                });
                return;
            }

            // Use the actual harvest date
            const finalHarvestDate = actualHarvestDate;
            
            AgriTraceUtils.showToast('Creating harvest event...', 'info');
            
            // Upload documents to IPFS if any
            let ipfsHash = '';
            const documents = document.getElementById('harvestDocuments').files;
            if (documents.length > 0) {
                const harvestData = {
                    qualityChecks: qualityChecks,
                    weather: weather,
                    notes: notes,
                    method: method,
                    documents: []
                };
                
                for (let i = 0; i < documents.length; i++) {
                    const fileHash = await this.ipfsService.uploadFile(documents[i]);
                    harvestData.documents.push({
                        fileName: documents[i].name,
                        fileHash: fileHash,
                        fileSize: documents[i].size,
                        fileType: documents[i].type
                    });
                }
                
                ipfsHash = await this.ipfsService.uploadJSON(harvestData);
            }
            
            // Convert datetime-local format to timestamp for blockchain
            const harvestTimestamp = new Date(finalHarvestDate.trim());
            
            // Create harvest event on blockchain
            const harvestNotes = `Harvest: ${quantity} ${unit} using ${method} on ${finalHarvestDate}. Quality checks: ${qualityChecks.join(', ')}. Weather: ${weather}. ${notes}`;
            
            console.log('Creating harvest event with data:', {
                batchId,
                eventType: 'HARVEST',
                location,
                ipfsHash,
                harvestDate: finalHarvestDate,
                harvestTimestamp: harvestTimestamp.getTime(),
                notes: harvestNotes
            });
            
            const tx = await this.blockchainService.addEvent(
                batchId,
                'HARVEST',
                location,
                ipfsHash,
                harvestNotes
            );
            
            AgriTraceUtils.showToast('Harvest event created successfully!', 'success');
            
            // Harvest event created successfully
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addHarvestModal'));
            if (modal) {
                modal.hide();
            }
            
            // Refresh harvest events data
            await this.loadHarvestEventsData();
            
            // Also refresh products data to show updated info
            await this.loadStats();
            
        } catch (error) {
            console.error('Error creating harvest event:', error);
            AgriTraceUtils.showToast(`Failed to create harvest event: ${error.message}`, 'error');
        }
    }

    /**
     * Show upload certification modal
     */
    showUploadCertificationModal() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="uploadCertificationModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Upload Certification</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="certificationForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="certificationType" class="form-label">Certification Type *</label>
                                            <select class="form-select" id="certificationType" required>
                                                <option value="">Select Certification Type...</option>
                                                <option value="organic">Organic Certification</option>
                                                <option value="fair_trade">Fair Trade</option>
                                                <option value="rainforest_alliance">Rainforest Alliance</option>
                                                <option value="utz">UTZ Certified</option>
                                                <option value="global_gap">GlobalG.A.P.</option>
                                                <option value="iso_22000">ISO 22000</option>
                                                <option value="halal">Halal</option>
                                                <option value="kosher">Kosher</option>
                                                <option value="non_gmo">Non-GMO</option>
                                                <option value="sustainable">Sustainable Agriculture</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="certificationNumber" class="form-label">Certification Number</label>
                                            <input type="text" class="form-control" id="certificationNumber" placeholder="e.g., ORG-2024-001">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="issuingBody" class="form-label">Issuing Body *</label>
                                            <input type="text" class="form-control" id="issuingBody" placeholder="e.g., USDA Organic, Fair Trade USA" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="validFrom" class="form-label">Valid From *</label>
                                            <input type="date" class="form-control" id="validFrom" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="validUntil" class="form-label">Valid Until *</label>
                                            <input type="date" class="form-control" id="validUntil" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="certificationScope" class="form-label">Scope</label>
                                            <select class="form-select" id="certificationScope">
                                                <option value="">Select Scope...</option>
                                                <option value="farm">Farm Level</option>
                                                <option value="product">Product Level</option>
                                                <option value="processing">Processing</option>
                                                <option value="distribution">Distribution</option>
                                                <option value="full_chain">Full Supply Chain</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="certificationFiles" class="form-label">Upload Certification Documents *</label>
                                    <input type="file" class="form-control" id="certificationFiles" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required>
                                    <div class="form-text">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Upload PDF certificates, images, or documents. Maximum 10MB per file.
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="certificationDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="certificationDescription" rows="3" placeholder="Additional information about this certification..."></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="certificationActive" checked>
                                        <label class="form-check-label" for="certificationActive">
                                            This certification is currently active
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="dashboardManager.submitCertification()">
                                <i class="fas fa-upload me-1"></i>Upload Certification
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('uploadCertificationModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Set default dates
        const validFromInput = document.getElementById('validFrom');
        const validUntilInput = document.getElementById('validUntil');
        
        if (validFromInput) {
            const today = new Date().toISOString().split('T')[0];
            validFromInput.value = today;
        }
        
        if (validUntilInput) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            validUntilInput.value = nextYear.toISOString().split('T')[0];
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('uploadCertificationModal'));
        modal.show();
    }

    /**
     * Submit certification upload
     */
    async submitCertification() {
        try {
            // Get form data
            const formData = {
                certificationType: document.getElementById('certificationType').value,
                certificationNumber: document.getElementById('certificationNumber').value,
                issuingBody: document.getElementById('issuingBody').value,
                validFrom: document.getElementById('validFrom').value,
                validUntil: document.getElementById('validUntil').value,
                certificationScope: document.getElementById('certificationScope').value,
                certificationDescription: document.getElementById('certificationDescription').value,
                certificationActive: document.getElementById('certificationActive').checked
            };

            // Validate required fields
            if (!formData.certificationType || !formData.issuingBody || !formData.validFrom || !formData.validUntil) {
                AgriTraceUtils.showToast('Please fill in all required fields', 'error');
                return;
            }

            // Validate date range
            const validFromDate = new Date(formData.validFrom);
            const validUntilDate = new Date(formData.validUntil);
            if (validUntilDate <= validFromDate) {
                AgriTraceUtils.showToast('Valid Until date must be after Valid From date', 'error');
                return;
            }

            // Get files
            const files = document.getElementById('certificationFiles').files;
            if (files.length === 0) {
                AgriTraceUtils.showToast('Please select at least one file to upload', 'error');
                return;
            }

            // Validate file sizes (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            for (let file of files) {
                if (file.size > maxSize) {
                    AgriTraceUtils.showToast(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
                    return;
                }
            }

            // Show loading state
            const submitBtn = document.querySelector('#uploadCertificationModal .btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Uploading...';
            submitBtn.disabled = true;

            // Upload files to IPFS
            const uploadedFiles = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const fileHash = await this.ipfsService.uploadFile(file);
                    uploadedFiles.push({
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        ipfsHash: fileHash
                    });
                } catch (error) {
                    console.error(`Error uploading file ${file.name}:`, error);
                    throw new Error(`Failed to upload file "${file.name}": ${error.message}`);
                }
            }

            // Create certification data
            const certificationData = {
                ...formData,
                files: uploadedFiles,
                uploadDate: new Date().toISOString(),
                farmerAddress: this.currentUser?.userAddress || this.currentUser?.address
            };

            // Store certification data (for now, we'll store in localStorage)
            // In a real implementation, this would be stored on blockchain
            const existingCertifications = JSON.parse(localStorage.getItem('farmerCertifications') || '[]');
            const newCertification = {
                id: Date.now().toString(),
                ...certificationData
            };
            existingCertifications.push(newCertification);
            localStorage.setItem('farmerCertifications', JSON.stringify(existingCertifications));

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('uploadCertificationModal'));
            modal.hide();

            // Show success message
            AgriTraceUtils.showToast('Certification uploaded successfully!', 'success');

            // Refresh certifications display
            this.loadCertifications();

        } catch (error) {
            console.error('Error uploading certification:', error);
            AgriTraceUtils.showToast(`Failed to upload certification: ${error.message}`, 'error');
            
            // Reset button state
            const submitBtn = document.querySelector('#uploadCertificationModal .btn-primary');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-upload me-1"></i>Upload Certification';
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Load and display certifications
     */
    loadCertifications() {
        try {
            const certificationsGrid = document.getElementById('certificationsGrid');
            if (!certificationsGrid) return;

            // Get certifications from localStorage
            const certifications = JSON.parse(localStorage.getItem('farmerCertifications') || '[]');

            if (certifications.length === 0) {
                certificationsGrid.innerHTML = `
                    <div class="col-12">
                        <div class="certifications-empty-state">
                            <i class="fas fa-certificate empty-icon"></i>
                            <h5>No Certifications Found</h5>
                            <p>Upload your first certification to get started</p>
                            <button class="btn btn-primary" onclick="dashboardManager.showUploadCertificationModal()">
                                <i class="fas fa-upload me-2"></i>Upload Certification
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            // Display certifications
            const certificationsHtml = certifications.map(cert => {
                const validFromDate = new Date(cert.validFrom);
                const validUntilDate = new Date(cert.validUntil);
                const isExpired = validUntilDate < new Date();
                const isExpiringSoon = validUntilDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

                let statusBadge = '';
                if (isExpired) {
                    statusBadge = '<span class="badge bg-danger">Expired</span>';
                } else if (isExpiringSoon) {
                    statusBadge = '<span class="badge bg-warning">Expiring Soon</span>';
                } else {
                    statusBadge = '<span class="badge bg-success">Active</span>';
                }

                return `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="certification-card">
                            <div class="certification-card-header">
                                <h6 class="certification-title">${AgriTraceUtils.sanitizeHtml(cert.certificationType.replace('_', ' ').toUpperCase())}</h6>
                                <span class="certification-status-badge ${isExpired ? 'bg-danger' : isExpiringSoon ? 'bg-warning' : 'bg-success'}">${isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}</span>
                            </div>
                            <div class="certification-card-body">
                                <div class="certification-details">
                                    <div class="certification-detail-item">
                                        <span class="certification-detail-label">Issuing Body</span>
                                        <span class="certification-detail-value">${AgriTraceUtils.sanitizeHtml(cert.issuingBody)}</span>
                                    </div>
                                    <div class="certification-detail-item">
                                        <span class="certification-detail-label">Number</span>
                                        <span class="certification-detail-value">${AgriTraceUtils.sanitizeHtml(cert.certificationNumber || 'N/A')}</span>
                                    </div>
                                    <div class="certification-detail-item">
                                        <span class="certification-detail-label">Valid From</span>
                                        <span class="certification-detail-value">${validFromDate.toLocaleDateString()}</span>
                                    </div>
                                    <div class="certification-detail-item">
                                        <span class="certification-detail-label">Valid Until</span>
                                        <span class="certification-detail-value">${validUntilDate.toLocaleDateString()}</span>
                                    </div>
                                    <div class="certification-detail-item">
                                        <span class="certification-detail-label">Scope</span>
                                        <span class="certification-detail-value">${AgriTraceUtils.sanitizeHtml(cert.certificationScope || 'N/A')}</span>
                                    </div>
                                    <div class="certification-detail-item">
                                        <span class="certification-detail-label">Files</span>
                                        <span class="certification-detail-value">${cert.files.length} document(s)</span>
                                    </div>
                                </div>
                                ${cert.certificationDescription ? `
                                    <div class="certification-description">
                                        <p>${AgriTraceUtils.sanitizeHtml(cert.certificationDescription)}</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="certification-card-footer">
                                <button class="certification-action-btn btn-outline-primary" onclick="dashboardManager.viewCertificationDetails('${cert.id}')">
                                    <i class="fas fa-eye"></i>View
                                </button>
                                <button class="certification-action-btn btn-outline-secondary" onclick="dashboardManager.downloadCertification('${cert.id}')">
                                    <i class="fas fa-download"></i>Download
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            certificationsGrid.innerHTML = certificationsHtml;

        } catch (error) {
            console.error('Error loading certifications:', error);
            const certificationsGrid = document.getElementById('certificationsGrid');
            if (certificationsGrid) {
                certificationsGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h5 class="text-danger">Error Loading Certifications</h5>
                        <p class="text-muted">${error.message}</p>
                    </div>
                `;
            }
        }
    }

    /**
     * View certification details
     */
    viewCertificationDetails(certificationId) {
        try {
            const certifications = JSON.parse(localStorage.getItem('farmerCertifications') || '[]');
            const certification = certifications.find(cert => cert.id === certificationId);
            
            if (!certification) {
                AgriTraceUtils.showToast('Certification not found', 'error');
                return;
            }

            // Create modal for viewing details
            const modalHtml = `
                <div class="modal fade certification-modal" id="certificationDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Certification Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Basic Information</h6>
                                        <table class="table table-sm">
                                            <tr><td><strong>Type:</strong></td><td>${AgriTraceUtils.sanitizeHtml(certification.certificationType.replace('_', ' ').toUpperCase())}</td></tr>
                                            <tr><td><strong>Number:</strong></td><td>${AgriTraceUtils.sanitizeHtml(certification.certificationNumber || 'N/A')}</td></tr>
                                            <tr><td><strong>Issuing Body:</strong></td><td>${AgriTraceUtils.sanitizeHtml(certification.issuingBody)}</td></tr>
                                            <tr><td><strong>Scope:</strong></td><td>${AgriTraceUtils.sanitizeHtml(certification.certificationScope || 'N/A')}</td></tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Validity Period</h6>
                                        <table class="table table-sm">
                                            <tr><td><strong>Valid From:</strong></td><td>${new Date(certification.validFrom).toLocaleDateString()}</td></tr>
                                            <tr><td><strong>Valid Until:</strong></td><td>${new Date(certification.validUntil).toLocaleDateString()}</td></tr>
                                            <tr><td><strong>Status:</strong></td><td>${certification.certificationActive ? 'Active' : 'Inactive'}</td></tr>
                                            <tr><td><strong>Upload Date:</strong></td><td>${new Date(certification.uploadDate).toLocaleDateString()}</td></tr>
                                        </table>
                                    </div>
                                </div>
                                
                                ${certification.certificationDescription ? `
                                    <div class="mt-3">
                                        <h6>Description</h6>
                                        <p>${AgriTraceUtils.sanitizeHtml(certification.certificationDescription)}</p>
                                    </div>
                                ` : ''}
                                
                                <div class="mt-3">
                                    <h6>Uploaded Files (${certification.files.length})</h6>
                                    <div class="list-group">
                                        ${certification.files.map(file => `
                                            <div class="certification-file-item">
                                                <div class="certification-file-info">
                                                    <div class="certification-file-icon">
                                                        <i class="fas fa-file"></i>
                                                    </div>
                                                    <div class="certification-file-details">
                                                        <h6>${AgriTraceUtils.sanitizeHtml(file.fileName)}</h6>
                                                        <small>${(file.fileSize / 1024 / 1024).toFixed(2)} MB</small>
                                                    </div>
                                                </div>
                                                <button class="certification-file-download" onclick="dashboardManager.downloadCertificationFile('${file.ipfsHash}', '${file.fileName}')">
                                                    <i class="fas fa-download me-1"></i>Download
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
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
            const existingModal = document.getElementById('certificationDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('certificationDetailsModal'));
            modal.show();

        } catch (error) {
            console.error('Error viewing certification details:', error);
            AgriTraceUtils.showToast('Error loading certification details', 'error');
        }
    }

    /**
     * Download certification files
     */
    async downloadCertification(certificationId) {
        try {
            const certifications = JSON.parse(localStorage.getItem('farmerCertifications') || '[]');
            const certification = certifications.find(cert => cert.id === certificationId);
            
            if (!certification) {
                AgriTraceUtils.showToast('Certification not found', 'error');
                return;
            }

            if (!certification.files || certification.files.length === 0) {
                AgriTraceUtils.showToast('No files found for this certification', 'warning');
                return;
            }

            AgriTraceUtils.showToast(`Downloading ${certification.files.length} file(s)...`, 'info');

            // Download all files
            for (let i = 0; i < certification.files.length; i++) {
                const file = certification.files[i];
                try {
                    await this.downloadCertificationFile(file.ipfsHash, file.fileName);
                    // Add small delay between downloads to avoid overwhelming the browser
                    if (i < certification.files.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } catch (fileError) {
                    console.error(`Error downloading file ${file.fileName}:`, fileError);
                    AgriTraceUtils.showToast(`Failed to download ${file.fileName}`, 'error');
                }
            }

            AgriTraceUtils.showToast('All files downloaded successfully', 'success');

        } catch (error) {
            console.error('Error downloading certification:', error);
            AgriTraceUtils.showToast('Error downloading certification files', 'error');
        }
    }

    /**
     * Download individual certification file
     */
    async downloadCertificationFile(ipfsHash, fileName) {
        try {
            AgriTraceUtils.showToast(`Downloading ${fileName}...`, 'info');
            
            // Ensure IPFS service is initialized
            if (!this.ipfsService) {
                this.ipfsService = new IPFSService();
            }
            
            if (!this.ipfsService.isInitialized) {
                await this.ipfsService.initialize();
            }
            
            // Download file from IPFS
            const fileBlob = await this.ipfsService.getFile(ipfsHash);
            
            if (!fileBlob) {
                throw new Error('File not found on IPFS');
            }
            
            // Create download link
            const url = window.URL.createObjectURL(fileBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            AgriTraceUtils.showToast(`${fileName} downloaded successfully`, 'success');

        } catch (error) {
            console.error('Error downloading file:', error);
            AgriTraceUtils.showToast(`Error downloading ${fileName}: ${error.message}`, 'error');
        }   
    }

    /**
     * Show generate QR modal
     */
    showGenerateQRModal() {
        AgriTraceUtils.showToast('Generate QR modal not implemented yet', 'info');
    }


    /**
     * Get current GPS location
     */
    async getCurrentLocation() {
        try {
            // Check if we're on HTTPS or localhost
            const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            
            if (!navigator.geolocation) {
                AgriTraceUtils.showToast('Geolocation is not supported by this browser', 'warning');
                return;
            }

            if (!isSecure) {
                // Show fallback options for non-HTTPS
                AgriTraceUtils.showToast('GPS location requires HTTPS. Please enter location manually.', 'warning');
                this.showLocationFallback();
                return;
            }

            AgriTraceUtils.showToast('Getting your location...', 'info');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    
                    const locationInput = document.getElementById('harvestLocation');
                    if (locationInput) {
                        locationInput.value = `${latitude}, ${longitude}`;
                        AgriTraceUtils.showToast(`Location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${Math.round(accuracy)}m)`, 'success');
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let errorMessage = 'Unable to get location: ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Permission denied - please allow location access';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Position unavailable - check your GPS/network';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Request timeout - try again';
                            break;
                        default:
                            errorMessage += 'Unknown error';
                            break;
                    }
                    AgriTraceUtils.showToast(errorMessage, 'error');
                    
                    // Show fallback options
                    this.showLocationFallback();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        } catch (error) {
            console.error('Error getting location:', error);
            AgriTraceUtils.showToast('Error getting location: ' + error.message, 'error');
            this.showLocationFallback();
        }
    }

    /**
     * Show location fallback options
     */
    showLocationFallback() {
        const locationInput = document.getElementById('harvestLocation');
        if (!locationInput) return;

        // Create a simple prompt for manual location entry
        const currentValue = locationInput.value;
        const promptText = currentValue ? 
            `Current location: ${currentValue}\n\nEnter new location (GPS coordinates or address):` :
            'Enter harvest location (GPS coordinates or address):';
        
        const newLocation = prompt(promptText, currentValue);
        if (newLocation && newLocation.trim() !== '') {
            locationInput.value = newLocation.trim();
            AgriTraceUtils.showToast('Location updated manually', 'success');
        }
    }
}

// Global GPS function for modal
window.getCurrentLocation = function() {
    if (window.dashboardManager) {
        window.dashboardManager.getCurrentLocation();
    }
};

// Global function to set current date/time
window.setCurrentDateTime = function() {
    const harvestDateInput = document.getElementById('harvestDate');
    if (harvestDateInput) {
        const now = new Date();
        const currentDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
        
        harvestDateInput.value = currentDateTime;
        console.log('Set current date/time (datetime-local):', currentDateTime);
        
        if (typeof AgriTraceUtils !== 'undefined') {
            AgriTraceUtils.showToast('Current date/time set', 'success');
        }
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Export for global access
window.DashboardManager = DashboardManager;
