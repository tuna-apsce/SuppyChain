/**
 * Blockchain Service for AgriTrace
 * Handles Web3 interactions with BNB Smart Chain Testnet
 */
class BlockchainService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        
        // BNB Smart Chain Testnet Configuration
        this.chainId = '0x61'; // 97 in hex
        this.rpcUrls = [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/',
            'https://data-seed-prebsc-1-s2.binance.org:8545/',
            'https://data-seed-prebsc-2-s2.binance.org:8545/',
            'https://data-seed-prebsc-1-s3.binance.org:8545/',
            'https://data-seed-prebsc-2-s3.binance.org:8545/'
        ];
        this.rpcUrl = this.rpcUrls[0]; // Primary RPC
        this.networkName = 'BSC Testnet';
        this.currencySymbol = 'tBNB';
        this.blockExplorer = 'https://testnet.bscscan.com';
        
        // Contract Configuration (Update after deployment)
        this.contractAddress = '0xCe086579FA47F0d918055CEf9821429C8c4a8a3b'; // Update this after deployment
        this.contractABI = [
            // User Management
            {
                "inputs": [
                    {"internalType": "enum AgriSupplyChain.UserRole", "name": "role", "type": "uint8"},
                    {"internalType": "string", "name": "companyName", "type": "string"}
                ],
                "name": "registerUser",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
                "name": "verifyUser",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
                "name": "deactivateUser",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
                "name": "activateUser",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "admin",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
                "name": "getUser",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "address", "name": "userAddress", "type": "address"},
                            {"internalType": "enum AgriSupplyChain.UserRole", "name": "role", "type": "uint8"},
                            {"internalType": "string", "name": "companyName", "type": "string"},
                            {"internalType": "bool", "name": "isVerified", "type": "bool"},
                            {"internalType": "bool", "name": "isActive", "type": "bool"},
                            {"internalType": "uint256", "name": "registrationDate", "type": "uint256"}
                        ],
                        "internalType": "struct AgriSupplyChain.User",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getCurrentUser",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "address", "name": "userAddress", "type": "address"},
                            {"internalType": "enum AgriSupplyChain.UserRole", "name": "role", "type": "uint8"},
                            {"internalType": "string", "name": "companyName", "type": "string"},
                            {"internalType": "bool", "name": "isVerified", "type": "bool"},
                            {"internalType": "bool", "name": "isActive", "type": "bool"},
                            {"internalType": "uint256", "name": "registrationDate", "type": "uint256"}
                        ],
                        "internalType": "struct AgriSupplyChain.User",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            
            // Product Management
            {
                "inputs": [
                    {"internalType": "string", "name": "batchId", "type": "string"},
                    {"internalType": "string", "name": "productName", "type": "string"},
                    {"internalType": "string", "name": "category", "type": "string"},
                    {"internalType": "string", "name": "origin", "type": "string"},
                    {"internalType": "uint256", "name": "harvestDate", "type": "uint256"},
                    {"internalType": "uint256", "name": "expiryDate", "type": "uint256"},
                    {"internalType": "uint256", "name": "quantity", "type": "uint256"},
                    {"internalType": "string", "name": "unit", "type": "string"},
                    {"internalType": "string", "name": "ipfsHash", "type": "string"}
                ],
                "name": "createProduct",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "batchId", "type": "string"}],
                "name": "getProduct",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "uint256", "name": "productId", "type": "uint256"},
                            {"internalType": "string", "name": "batchId", "type": "string"},
                            {"internalType": "address", "name": "farmer", "type": "address"},
                            {"internalType": "string", "name": "productName", "type": "string"},
                            {"internalType": "string", "name": "category", "type": "string"},
                            {"internalType": "string", "name": "origin", "type": "string"},
                            {"internalType": "uint256", "name": "harvestDate", "type": "uint256"},
                            {"internalType": "uint256", "name": "expiryDate", "type": "uint256"},
                            {"internalType": "uint256", "name": "quantity", "type": "uint256"},
                            {"internalType": "string", "name": "unit", "type": "string"},
                            {"internalType": "string", "name": "ipfsHash", "type": "string"},
                            {"internalType": "bool", "name": "isActive", "type": "bool"},
                            {"internalType": "address", "name": "currentOwner", "type": "address"},
                            {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
                        ],
                        "internalType": "struct AgriSupplyChain.Product",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "batchId", "type": "string"}],
                "name": "getProductSummary",
                "outputs": [
                    {"internalType": "string", "name": "productName", "type": "string"},
                    {"internalType": "string", "name": "category", "type": "string"},
                    {"internalType": "string", "name": "origin", "type": "string"},
                    {"internalType": "uint256", "name": "harvestDate", "type": "uint256"},
                    {"internalType": "uint256", "name": "expiryDate", "type": "uint256"},
                    {"internalType": "uint256", "name": "quantity", "type": "uint256"},
                    {"internalType": "string", "name": "unit", "type": "string"},
                    {"internalType": "address", "name": "currentOwner", "type": "address"},
                    {"internalType": "uint256", "name": "eventCount", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            
            // Event Management
            {
                "inputs": [
                    {"internalType": "string", "name": "batchId", "type": "string"},
                    {"internalType": "enum AgriSupplyChain.EventType", "name": "eventType", "type": "uint8"},
                    {"internalType": "string", "name": "location", "type": "string"},
                    {"internalType": "string", "name": "ipfsHash", "type": "string"},
                    {"internalType": "string", "name": "notes", "type": "string"}
                ],
                "name": "addEvent",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "batchId", "type": "string"}],
                "name": "getEvents",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "uint256", "name": "eventId", "type": "uint256"},
                            {"internalType": "string", "name": "batchId", "type": "string"},
                            {"internalType": "enum AgriSupplyChain.EventType", "name": "eventType", "type": "uint8"},
                            {"internalType": "address", "name": "actor", "type": "address"},
                            {"internalType": "string", "name": "location", "type": "string"},
                            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                            {"internalType": "string", "name": "ipfsHash", "type": "string"},
                            {"internalType": "string", "name": "notes", "type": "string"}
                        ],
                        "internalType": "struct AgriSupplyChain.SupplyChainEvent[]",
                        "name": "",
                        "type": "tuple[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            
            // Utility Functions
            {
                "inputs": [],
                "name": "getAllBatchIds",
                "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getProductCount",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
                "name": "isUserRegistered",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
                "name": "isUserVerified",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getRegisteredUsers",
                "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        // User Role Enum Mapping
        this.userRoles = {
            0: 'FARMER',
            1: 'PROCESSOR', 
            2: 'TRANSPORTER',
            3: 'WAREHOUSE',
            4: 'RETAILER',
            5: 'CONSUMER'
        };
        
        // Event Type Enum Mapping
        this.eventTypes = {
            0: 'HARVEST',
            1: 'PROCESSING',
            2: 'TRANSPORT_START',
            3: 'TRANSPORT_END',
            4: 'WAREHOUSE_IN',
            5: 'WAREHOUSE_OUT',
            6: 'RETAIL_RECEIVE',
            7: 'SALE'
        };
    }

    /**
     * Connect to MetaMask and initialize Web3
     */
    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }

            this.account = accounts[0];
            
            // Try to initialize Web3 with fallback RPC endpoints
            await this.initializeWeb3WithFallback();
            
            // Initialize contract
            this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
            
            // Check if we're on the correct network
            await this.ensureCorrectNetwork();
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.account = null;
                    this.handleAccountChange();
                } else {
                    this.account = accounts[0];
                    this.handleAccountChange();
                }
            });
            
            // Listen for network changes
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });

            return this.account;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }

    /**
     * Check network connectivity and get current block
     */
    async checkNetworkHealth() {
        try {
            if (!this.web3) {
                return { healthy: false, error: 'Web3 not initialized' };
            }
            
            const blockNumber = await this.web3.eth.getBlockNumber();
            const networkId = await this.web3.eth.net.getId();
            
            return {
                healthy: true,
                blockNumber,
                networkId,
                chainId: this.chainId
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * Initialize Web3 with fallback RPC endpoints
     */
    async initializeWeb3WithFallback() {
        // First try MetaMask's provider
        try {
            this.web3 = new Web3(window.ethereum);
            // Test connection by getting block number
            await this.web3.eth.getBlockNumber();
            console.log('Connected via MetaMask provider');
            return;
        } catch (error) {
            console.warn('MetaMask provider failed, trying RPC endpoints:', error);
        }

        // Try each RPC endpoint
        for (let i = 0; i < this.rpcUrls.length; i++) {
            try {
                console.log(`Trying RPC endpoint ${i + 1}/${this.rpcUrls.length}: ${this.rpcUrls[i]}`);
                this.web3 = new Web3(this.rpcUrls[i]);
                
                // Test connection
                const blockNumber = await this.web3.eth.getBlockNumber();
                console.log(`Successfully connected to RPC ${i + 1}, block number: ${blockNumber}`);
                
                // Update primary RPC
                this.rpcUrl = this.rpcUrls[i];
                return;
            } catch (error) {
                console.warn(`RPC endpoint ${i + 1} failed:`, error);
                if (i === this.rpcUrls.length - 1) {
                    throw new Error('All RPC endpoints failed. Please check your internet connection or try again later.');
                }
            }
        }
    }

    /**
     * Ensure we're connected to BNB Smart Chain Testnet
     */
    async ensureCorrectNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            if (chainId !== this.chainId) {
                await this.switchToBSCTestnet();
            }
        } catch (error) {
            console.error('Error checking network:', error);
            throw new Error('Failed to verify network connection');
        }
    }

    /**
     * Switch to BNB Smart Chain Testnet
     */
    async switchToBSCTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.chainId }],
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                await this.addBSCTestnet();
            } else {
                throw switchError;
            }
        }
    }

    /**
     * Add BNB Smart Chain Testnet to MetaMask
     */
    async addBSCTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: this.chainId,
                        chainName: this.networkName,
                        nativeCurrency: {
                            name: 'Test BNB',
                            symbol: this.currencySymbol,
                            decimals: 18,
                        },
                        rpcUrls: [this.rpcUrl],
                        blockExplorerUrls: [this.blockExplorer],
                    },
                ],
            });
        } catch (error) {
            console.error('Error adding BSC Testnet:', error);
            throw new Error('Failed to add BSC Testnet to MetaMask');
        }
    }

    /**
     * Handle account changes
     */
    handleAccountChange() {
        // Dispatch custom event for account changes
        window.dispatchEvent(new CustomEvent('accountChanged', {
            detail: { account: this.account }
        }));
    }

    /**
     * Get current account
     */
    getCurrentAccount() {
        return this.account;
    }

    /**
     * Check if wallet is connected
     */
    isConnected() {
        return this.account !== null && this.web3 !== null;
    }

    /**
     * Register a new user
     */
    async registerUser(role, companyName) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const roleValue = this.getRoleValue(role);
            
            const tx = await this.contract.methods.registerUser(roleValue, companyName)
                .send({ from: this.account });

            return tx;
        } catch (error) {
            console.error('Error registering user:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get user information
     */
    async getUser(userAddress = null) {
        try {
            const address = userAddress || this.account;
            if (!address) {
                throw new Error('No address provided');
            }

            const user = await this.contract.methods.getUser(address).call();
            return this.formatUser(user);
        } catch (error) {
            console.error('Error getting user:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get current user information
     */
    async getCurrentUser() {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            // Get current account from web3 to ensure we have the latest account
            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }
            
            const currentAccount = accounts[0];
            console.log('Getting user for account:', currentAccount);

            // First check if user is registered using getUser
            try {
                const user = await this.contract.methods.getUser(currentAccount).call();
                if (user && user.userAddress !== '0x0000000000000000000000000000000000000000') {
                    const formattedUser = this.formatUser(user);
                    console.log('User found via getUser:', formattedUser);
                    return formattedUser;
                } else {
                    // User not registered
                    console.log('User not registered for account:', currentAccount);
                    return null;
                }
            } catch (error) {
                console.warn('User not found via getUser, checking with getCurrentUser...', error);
                
                // Fallback to getCurrentUser
                try {
                    const user = await this.contract.methods.getCurrentUser().call();
                    if (user && user.userAddress !== '0x0000000000000000000000000000000000000000') {
                        const formattedUser = this.formatUser(user);
                        console.log('User found via getCurrentUser:', formattedUser);
                        return formattedUser;
                    } else {
                        console.log('No user found via getCurrentUser');
                        return null;
                    }
                } catch (currentUserError) {
                    console.warn('getCurrentUser also failed:', currentUserError);
                    return null;
                }
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            
            // Handle specific error cases
            if (error.message.includes('missing trie node') || 
                error.message.includes('Internal JSON-RPC error')) {
                console.warn('Network issue, user likely not registered');
                return null;
            }
            
            throw this.handleContractError(error);
        }
    }

    /**
     * Admin: Verify a user
     */
    async verifyUser(userAddress) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const tx = await this.contract.methods.verifyUser(userAddress).send({
                from: this.account,
                gas: 200000
            });

            return tx;
        } catch (error) {
            console.error('Error verifying user:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Admin: Deactivate a user
     */
    async deactivateUser(userAddress) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const tx = await this.contract.methods.deactivateUser(userAddress).send({
                from: this.account,
                gas: 200000
            });

            return tx;
        } catch (error) {
            console.error('Error deactivating user:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Admin: Activate a user
     */
    async activateUser(userAddress) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const tx = await this.contract.methods.activateUser(userAddress).send({
                from: this.account,
                gas: 200000
            });

            return tx;
        } catch (error) {
            console.error('Error activating user:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Admin: Get all users (if contract supports it)
     */
    async getAllUsers() {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            // This would need to be implemented in the smart contract
            // For now, we'll return a placeholder
            throw new Error('getAllUsers function not implemented in contract yet');
        } catch (error) {
            console.error('Error getting all users:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Check if user is registered
     */
    async isUserRegistered(userAddress = null) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const address = userAddress || this.account;
            const user = await this.contract.methods.getUser(address).call();
            
            return user && user.userAddress !== '0x0000000000000000000000000000000000000000';
        } catch (error) {
            console.error('Error checking user registration:', error);
            return false;
        }
    }

    /**
     * Check if current user is admin
     */
    async isAdmin() {
        try {
            if (!this.isConnected()) {
                return false;
            }

            // Get admin address from contract
            const adminAddress = await this.contract.methods.admin().call();
            return this.account.toLowerCase() === adminAddress.toLowerCase();
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Create a new product
     */
    async createProduct(productData) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            // Check user status before creating product
            const user = await this.contract.methods.getUser(this.account).call();
            console.log('User status check:', {
                userAddress: user.userAddress,
                role: user.role,
                isVerified: user.isVerified,
                isActive: user.isActive,
                companyName: user.companyName
            });

            // Verify user can create products
            if (user.role !== '0') { // 0 = FARMER in enum
                throw new Error('Only farmers can create products');
            }
            
            if (!user.isVerified) {
                throw new Error('User not verified. Please contact admin for verification.');
            }
            
            if (!user.isActive) {
                throw new Error('User account is inactive. Please contact admin.');
            }

            const {
                batchId,
                productName,
                category,
                origin,
                harvestDate,
                expiryDate,
                quantity,
                unit,
                ipfsHash
            } = productData;

            // Validate required fields
            if (!batchId || !productName || !category || !origin) {
                throw new Error('Missing required fields: batchId, productName, category, origin');
            }

            if (!harvestDate || !expiryDate) {
                throw new Error('Missing required dates: harvestDate, expiryDate');
            }

            console.log('Creating product with data:', {
                batchId,
                productName,
                category,
                origin,
                harvestDate: Math.floor(harvestDate.getTime() / 1000),
                expiryDate: Math.floor(expiryDate.getTime() / 1000),
                quantity,
                unit,
                ipfsHash
            });

            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await this.contract.methods.createProduct(
                    batchId,
                    productName,
                    category,
                    origin,
                    Math.floor(harvestDate.getTime() / 1000),
                    Math.floor(expiryDate.getTime() / 1000),
                    quantity,
                    unit,
                    ipfsHash || ''
                ).estimateGas({ from: this.account });
                
                console.log('Gas estimate:', gasEstimate);
                // Add 20% buffer to gas estimate
                gasEstimate = Math.floor(gasEstimate * 1.2);
            } catch (gasError) {
                console.warn('Gas estimation failed, using default:', gasError);
                gasEstimate = 800000; // Higher default gas limit
            }

            console.log('Using gas limit:', gasEstimate);

            const tx = await this.contract.methods.createProduct(
                batchId,
                productName,
                category,
                origin,
                Math.floor(harvestDate.getTime() / 1000),
                Math.floor(expiryDate.getTime() / 1000),
                quantity,
                unit,
                ipfsHash || ''
            ).send({ 
                from: this.account,
                gas: gasEstimate
            });

            return tx;
        } catch (error) {
            console.error('Error creating product:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Add an event to the supply chain
     */
    async addEvent(eventData) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const {
                batchId,
                eventType,
                location,
                ipfsHash,
                notes
            } = eventData;

            const eventTypeValue = this.getEventTypeValue(eventType);

            const tx = await this.contract.methods.addEvent(
                batchId,
                eventTypeValue,
                location,
                ipfsHash || '',
                notes || ''
            ).send({ from: this.account });

            return tx;
        } catch (error) {
            console.error('Error adding event:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Load contract instance
     */
    async loadContract() {
        try {
            if (!this.web3) {
                throw new Error('Web3 not initialized');
            }
            
            console.log('Loading contract with address:', this.contractAddress);
            console.log('Contract ABI length:', this.contractABI.length);
            
            // Create contract instance
            this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
            
            console.log('Contract loaded successfully:', this.contract);
            console.log('Contract methods available:', !!this.contract.methods);
            console.log('Contract address:', this.contract.options.address);
            
            return this.contract;
        } catch (error) {
            console.error('Error loading contract:', error);
            console.error('Web3 instance:', this.web3);
            console.error('Contract ABI:', this.contractABI);
            throw error;
        }
    }

    /**
     * Get product information
     */
    async getProduct(batchId) {
        try {
            console.log('=== getProduct DEBUG v2 ===');
            console.log('this.contract before check:', this.contract);
            console.log('this.web3 before check:', this.web3);
            console.log('this.account before check:', this.account);
            
            // Force re-initialization if contract is null
            if (!this.contract) {
                console.log('Contract is null, forcing re-initialization...');
                try {
                    // First try to initialize web3
                    if (!this.web3) {
                        console.log('Web3 is null, initializing...');
                        await this.initializeWeb3WithFallback();
                        console.log('Web3 initialized, this.web3:', this.web3);
                    }
                    
                    // Then load contract
                    await this.loadContract();
                    console.log('Contract loaded, this.contract:', this.contract);
                } catch (initError) {
                    console.error('Failed to initialize contract:', initError);
                    throw new Error('Failed to initialize blockchain connection: ' + initError.message);
                }
            }
            
            // Double-check contract after initialization
            if (!this.contract || !this.contract.methods) {
                console.log('Contract still null or corrupted, trying direct creation...');
                try {
                    this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
                    console.log('Contract created directly:', this.contract);
                } catch (directError) {
                    console.error('Direct contract creation failed:', directError);
                    throw new Error('Unable to create contract instance: ' + directError.message);
                }
            }
            
            console.log('this.contract after initialization:', this.contract);
            
            if (!this.contract) {
                throw new Error('Contract not available. Please connect wallet first.');
            }
            
            if (!this.contract.methods) {
                throw new Error('Contract methods not available. Contract may be corrupted.');
            }
            
            console.log('Calling contract.methods.getProduct...');
            
            // Use retry logic for getProduct
            const product = await this.retryWithBackoff(async () => {
                return await this.contract.methods.getProduct(batchId).call();
            });
            
            console.log('Product retrieved:', product);
            return this.formatProduct(product);
        } catch (error) {
            console.error('Error getting product:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get product events
     */
    async getEvents(batchId) {
        try {
            // Ensure contract is initialized
            if (!this.contract) {
                await this.initializeWeb3WithFallback();
                await this.loadContract();
            }
            
            if (!this.contract) {
                throw new Error('Contract not available. Please connect wallet first.');
            }

            // Use retry logic for getEvents
            const events = await this.retryWithBackoff(async () => {
                return await this.contract.methods.getEvents(batchId).call();
            });
            
            if (!events || events.length === 0) {
                return [];
            }
            
            const formattedEvents = events.map(event => this.formatEvent(event));
            return formattedEvents;
            
        } catch (error) {
            console.error('Error getting events:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get product summary for QR display
     */
    async getProductSummary(batchId) {
        try {
            // Use retry logic for getProductSummary
            const summary = await this.retryWithBackoff(async () => {
                return await this.contract.methods.getProductSummary(batchId).call();
            });
            return this.formatProductSummary(summary);
        } catch (error) {
            console.error('Error getting product summary:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get complete product history
     */
    async getProductHistory(batchId) {
        try {
            // Ensure contract is initialized
            if (!this.contract) {
                console.log('Contract not initialized for getProductHistory, attempting to initialize...');
                await this.initializeWeb3WithFallback();
                await this.loadContract();
            }
            
            if (!this.contract) {
                throw new Error('Contract not available. Please connect wallet first.');
            }

            // Use retry logic for the entire product history operation
            const result = await this.retryWithBackoff(async () => {
                const [product, events] = await Promise.all([
                    this.getProduct(batchId),
                    this.getEvents(batchId)
                ]);

                return {
                    product,
                    events,
                    timestamp: new Date().toISOString()
                };
            });

            return result;
        } catch (error) {
            console.error('Error getting product history:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get all batch IDs
     */
    async getAllBatchIds() {
        try {
            const batchIds = await this.contract.methods.getAllBatchIds().call();
            return batchIds;
        } catch (error) {
            console.error('Error getting batch IDs:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Get all registered users
     */
    async getRegisteredUsers() {
        try {
            if (!this.contract) {
                throw new Error('Contract not available');
            }
            
            const userAddresses = await this.contract.methods.getRegisteredUsers().call();
            return userAddresses;
        } catch (error) {
            console.error('Error getting registered users:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Add event to product
     */
    async addEvent(batchId, eventType, location, ipfsHash, notes) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            // Validate event type
            const eventTypeMap = {
                'HARVEST': 0,
                'PROCESSING': 1,
                'TRANSPORT_START': 2,
                'TRANSPORT_END': 3,
                'WAREHOUSE_IN': 4,
                'WAREHOUSE_OUT': 5,
                'RETAIL_RECEIVE': 6,
                'SALE': 7
            };

            const eventTypeValue = eventTypeMap[eventType.toUpperCase()];
            if (eventTypeValue === undefined) {
                throw new Error(`Invalid event type: ${eventType}`);
            }

            console.log('Adding event:', {
                batchId,
                eventType: eventTypeValue,
                location,
                ipfsHash: ipfsHash || '',
                notes
            });

            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await this.contract.methods.addEvent(
                    batchId,
                    eventTypeValue,
                    location || '',
                    ipfsHash || '',
                    notes || ''
                ).estimateGas({ from: this.account });
                
                console.log('Gas estimate for addEvent:', gasEstimate);
                // Add 20% buffer to gas estimate
                gasEstimate = Math.floor(gasEstimate * 1.2);
            } catch (gasError) {
                console.warn('Gas estimation failed for addEvent, using default:', gasError);
                gasEstimate = 300000; // Default gas limit for events
            }

            const tx = await this.contract.methods.addEvent(
                batchId,
                eventTypeValue,
                location || '',
                ipfsHash || '',
                notes || ''
            ).send({ 
                from: this.account,
                gas: gasEstimate
            });

            console.log('Event added successfully:', tx);
            return tx;

        } catch (error) {
            console.error('Error adding event:', error);
            throw this.handleContractError(error);
        }
    }


    /**
     * Get product count
     */
    async getProductCount() {
        try {
            const count = await this.contract.methods.getProductCount().call();
            return parseInt(count);
        } catch (error) {
            console.error('Error getting product count:', error);
            throw this.handleContractError(error);
        }
    }

    /**
     * Check if user is registered
     */
    async isUserRegistered(userAddress = null) {
        try {
            const address = userAddress || this.account;
            if (!address) {
                return false;
            }

            const isRegistered = await this.contract.methods.isUserRegistered(address).call();
            return isRegistered;
        } catch (error) {
            console.error('Error checking user registration:', error);
            return false;
        }
    }

    /**
     * Check if user is verified
     */
    async isUserVerified(userAddress = null) {
        try {
            const address = userAddress || this.account;
            if (!address) {
                return false;
            }

            const isVerified = await this.contract.methods.isUserVerified(address).call();
            return isVerified;
        } catch (error) {
            console.error('Error checking user verification:', error);
            return false;
        }
    }

    /**
     * Get role value for contract calls
     */
    getRoleValue(role) {
        const roleMap = {
            'FARMER': 0,
            'PROCESSOR': 1,
            'TRANSPORTER': 2,
            'WAREHOUSE': 3,
            'RETAILER': 4,
            'CONSUMER': 5
        };
        return roleMap[role.toUpperCase()] || 0;
    }

    /**
     * Get event type value for contract calls
     */
    getEventTypeValue(eventType) {
        const eventMap = {
            'HARVEST': 0,
            'PROCESSING': 1,
            'TRANSPORT_START': 2,
            'TRANSPORT_END': 3,
            'WAREHOUSE_IN': 4,
            'WAREHOUSE_OUT': 5,
            'RETAIL_RECEIVE': 6,
            'SALE': 7
        };
        return eventMap[eventType.toUpperCase()] || 0;
    }

    /**
     * Format user data from contract
     */
    formatUser(user) {
        return {
            address: user.userAddress,
            role: this.userRoles[user.role] || 'UNKNOWN',
            companyName: user.companyName,
            isVerified: user.isVerified,
            isActive: user.isActive,
            registrationDate: new Date(parseInt(user.registrationDate) * 1000)
        };
    }

    /**
     * Format product data from contract
     */
    formatProduct(product) {
        return {
            productId: parseInt(product.productId),
            batchId: product.batchId,
            farmer: product.farmer,
            productName: product.productName,
            category: product.category,
            origin: product.origin,
            harvestDate: new Date(parseInt(product.harvestDate) * 1000),
            expiryDate: new Date(parseInt(product.expiryDate) * 1000),
            quantity: parseInt(product.quantity),
            unit: product.unit,
            ipfsHash: product.ipfsHash,
            isActive: product.isActive,
            currentOwner: product.currentOwner,
            createdAt: new Date(parseInt(product.createdAt) * 1000)
        };
    }

    /**
     * Format event data from contract
     */
    formatEvent(event) {
        return {
            eventId: parseInt(event.eventId),
            batchId: event.batchId,
            eventType: this.eventTypes[event.eventType] || 'UNKNOWN',
            actor: event.actor,
            location: event.location,
            timestamp: new Date(parseInt(event.timestamp) * 1000),
            ipfsHash: event.ipfsHash,
            notes: event.notes
        };
    }

    /**
     * Format product summary from contract
     */
    formatProductSummary(summary) {
        return {
            productName: summary.productName,
            category: summary.category,
            origin: summary.origin,
            harvestDate: new Date(parseInt(summary.harvestDate) * 1000),
            expiryDate: new Date(parseInt(summary.expiryDate) * 1000),
            quantity: parseInt(summary.quantity),
            unit: summary.unit,
            currentOwner: summary.currentOwner,
            eventCount: parseInt(summary.eventCount)
        };
    }

    /**
     * Format event data from contract
     */
    formatEvent(event) {
        const eventTypes = ['HARVEST', 'PROCESSING', 'TRANSPORT_START', 'TRANSPORT_END', 'WAREHOUSE_IN', 'WAREHOUSE_OUT', 'RETAIL_RECEIVE', 'SALE'];
        
        return {
            eventId: parseInt(event.eventId),
            batchId: event.batchId,
            eventType: eventTypes[parseInt(event.eventType)] || 'UNKNOWN',
            eventTypeValue: parseInt(event.eventType),
            actor: event.actor,
            timestamp: new Date(parseInt(event.timestamp) * 1000),
            location: event.location,
            ipfsHash: event.ipfsHash,
            notes: event.notes
        };
    }

    /**
     * Handle contract errors
     */
    handleContractError(error) {
        if (error.message.includes('User denied')) {
            return new Error('Transaction was cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
            return new Error('Insufficient funds for transaction');
        } else if (error.message.includes('gas')) {
            return new Error('Transaction failed due to gas issues');
        } else if (error.message.includes('revert')) {
            // Extract revert reason if possible
            const revertMatch = error.message.match(/revert (.+)/);
            if (revertMatch) {
                return new Error(`Transaction failed: ${revertMatch[1]}`);
            }
            return new Error('Transaction failed');
        } else if (error.message.includes('missing trie node') || 
                   error.message.includes('Internal JSON-RPC error') ||
                   error.message.includes('code: -32000')) {
            return new Error('Network connection issue. Please try again or switch RPC endpoint.');
        }
        return error;
    }

    /**
     * Retry function with exponential backoff
     */
    async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                console.log(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Check if error is retryable
                if (error.message.includes('missing trie node') || 
                    error.message.includes('Internal JSON-RPC error') ||
                    error.message.includes('code: -32000') ||
                    error.message.includes('Network connection issue')) {
                    
                    // Try switching RPC endpoint on first retry
                    if (attempt === 1) {
                        console.log('Switching RPC endpoint...');
                        await this.switchRPCEndpoint();
                    }
                    
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Switch to next RPC endpoint
     */
    async switchRPCEndpoint() {
        try {
            const currentIndex = this.rpcUrls.findIndex(url => url === this.rpcUrl);
            const nextIndex = (currentIndex + 1) % this.rpcUrls.length;
            this.rpcUrl = this.rpcUrls[nextIndex];
            
            console.log(`Switching to RPC endpoint: ${this.rpcUrl}`);
            
            // Reinitialize web3 with new endpoint
            await this.initializeWeb3WithFallback();
            await this.loadContract();
            
            console.log('RPC endpoint switched successfully');
        } catch (error) {
            console.error('Error switching RPC endpoint:', error);
        }
    }

    /**
     * Get network information
     */
    async getNetworkInfo() {
        try {
            if (!this.web3) {
                throw new Error('Web3 not initialized');
            }

            const chainId = await this.web3.eth.getChainId();
            const blockNumber = await this.web3.eth.getBlockNumber();
            const gasPrice = await this.web3.eth.getGasPrice();

            return {
                chainId: chainId.toString(),
                blockNumber: parseInt(blockNumber),
                gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
                networkName: this.networkName,
                currencySymbol: this.currencySymbol
            };
        } catch (error) {
            console.error('Error getting network info:', error);
            throw error;
        }
    }

    /**
     * Estimate gas for transaction
     */
    async estimateGas(method, params = []) {
        try {
            if (!this.isConnected()) {
                throw new Error('Wallet not connected');
            }

            const gasEstimate = await method(...params).estimateGas({ from: this.account });
            return parseInt(gasEstimate);
        } catch (error) {
            console.error('Error estimating gas:', error);
            throw error;
        }
    }
}

// Export for use in other modules
window.BlockchainService = BlockchainService;
