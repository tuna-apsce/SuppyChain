/**
 * IPFS Service for AgriTrace
 * Handles file uploads and retrieval using IPFS
 */
class IPFSService {
    constructor() {
        this.gateways = [
            'https://ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/',
            'https://dweb.link/ipfs/'
        ];
        this.currentGateway = 0;
        this.ipfs = null;
        this.isInitialized = false;
    }

    /**
     * Initialize IPFS (using js-ipfs or alternative)
     */
    async initialize() {
        try {
            // For this implementation, we'll use a simple HTTP-based approach
            // In a production environment, you might want to use js-ipfs
            this.isInitialized = true;
            console.log('IPFS service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize IPFS:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * Upload file to IPFS
     */
    async uploadFile(file) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Use Pinata IPFS service (free tier available)
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': '2c917c5455986fa0c16b', // Replace with your Pinata API key
                    'pinata_secret_api_key': '983222ac986237e6e7cc0fc5dab80dde06a0633da596b6e91a566b0a1d3388da' // Replace with your Pinata secret key
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.IpfsHash;
        } catch (error) {
            console.error('Error uploading file to IPFS:', error);
            // Fallback to local upload simulation
            return this.simulateUpload(file);
        }
    }

    /**
     * Upload JSON data to IPFS
     */
    async uploadJSON(data) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Use Pinata IPFS service
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': '2c917c5455986fa0c16b', // Replace with your Pinata API key
                    'pinata_secret_api_key': '983222ac986237e6e7cc0fc5dab80dde06a0633da596b6e91a566b0a1d3388da' // Replace with your Pinata secret key
                },
                body: this.createFormDataWithBlob(blob, 'data.json')
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.IpfsHash;
        } catch (error) {
            console.error('Error uploading JSON to IPFS:', error);
            // Fallback to local upload simulation
            return this.simulateUpload({ name: 'data.json', type: 'application/json' });
        }
    }

    /**
     * Get file from IPFS
     */
    async getFile(hash) {
        try {
            if (!hash) {
                throw new Error('IPFS hash is required');
            }

            // Try different gateways until one works
            for (let i = 0; i < this.gateways.length; i++) {
                try {
                    const gateway = this.gateways[i];
                    const url = `${gateway}${hash}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': '*/*'
                        }
                    });

                    if (response.ok) {
                        this.currentGateway = i;
                        return await response.blob();
                    }
                } catch (error) {
                    console.warn(`Gateway ${i} failed:`, error);
                    continue;
                }
            }

            throw new Error('All IPFS gateways failed');
        } catch (error) {
            console.error('Error getting file from IPFS:', error);
            throw error;
        }
    }

    /**
     * Get JSON data from IPFS
     */
    async getJSON(hash) {
        try {
            const blob = await this.getFile(hash);
            const text = await blob.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Error getting JSON from IPFS:', error);
            throw error;
        }
    }

    /**
     * Get image from IPFS and return as data URL
     */
    async getImage(hash) {
        try {
            const blob = await this.getFile(hash);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error getting image from IPFS:', error);
            throw error;
        }
    }

    /**
     * Upload multiple files to IPFS
     */
    async uploadMultiple(files) {
        try {
            const uploadPromises = files.map(file => this.uploadFile(file));
            const hashes = await Promise.all(uploadPromises);
            return hashes;
        } catch (error) {
            console.error('Error uploading multiple files:', error);
            throw error;
        }
    }

    /**
     * Create FormData with Blob
     */
    createFormDataWithBlob(blob, filename) {
        const formData = new FormData();
        formData.append('file', blob, filename);
        return formData;
    }

    /**
     * Simulate file upload (fallback when IPFS is not available)
     */
    simulateUpload(file) {
        // Generate a mock hash for demonstration
        const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
        
        console.warn('Using simulated IPFS upload. Hash:', mockHash);
        return mockHash;
    }

    /**
     * Validate IPFS hash format
     */
    isValidHash(hash) {
        if (!hash) return false;
        
        // Basic IPFS hash validation (starts with Qm or bafy)
        return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{50,})$/i.test(hash);
    }

    /**
     * Get IPFS URL for a hash
     */
    getIPFSUrl(hash) {
        if (!this.isValidHash(hash)) {
            throw new Error('Invalid IPFS hash');
        }

        const gateway = this.gateways[this.currentGateway];
        return `${gateway}${hash}`;
    }

    /**
     * Upload product metadata to IPFS
     */
    async uploadProductMetadata(metadata) {
        try {
            const productData = {
                ...metadata,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            return await this.uploadJSON(productData);
        } catch (error) {
            console.error('Error uploading product metadata:', error);
            throw error;
        }
    }

    /**
     * Upload event metadata to IPFS
     */
    async uploadEventMetadata(metadata) {
        try {
            const eventData = {
                ...metadata,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            return await this.uploadJSON(eventData);
        } catch (error) {
            console.error('Error uploading event metadata:', error);
            throw error;
        }
    }

    /**
     * Upload certification document
     */
    async uploadCertification(file, certificationData) {
        try {
            // Upload the file
            const fileHash = await this.uploadFile(file);
            
            // Upload metadata
            const metadata = {
                ...certificationData,
                fileHash,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            };
            
            const metadataHash = await this.uploadJSON(metadata);
            
            return {
                fileHash,
                metadataHash,
                url: this.getIPFSUrl(fileHash)
            };
        } catch (error) {
            console.error('Error uploading certification:', error);
            throw error;
        }
    }

    /**
     * Get certification document
     */
    async getCertification(metadataHash) {
        try {
            const metadata = await this.getJSON(metadataHash);
            const fileBlob = await this.getFile(metadata.fileHash);
            
            return {
                metadata,
                file: fileBlob,
                url: this.getIPFSUrl(metadata.fileHash)
            };
        } catch (error) {
            console.error('Error getting certification:', error);
            throw error;
        }
    }

    /**
     * Upload image with metadata
     */
    async uploadImageWithMetadata(file, imageData) {
        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }

            // Upload the image
            const imageHash = await this.uploadFile(file);
            
            // Upload metadata
            const metadata = {
                ...imageData,
                imageHash,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                dimensions: await this.getImageDimensions(file)
            };
            
            const metadataHash = await this.uploadJSON(metadata);
            
            return {
                imageHash,
                metadataHash,
                url: this.getIPFSUrl(imageHash)
            };
        } catch (error) {
            console.error('Error uploading image with metadata:', error);
            throw error;
        }
    }

    /**
     * Get image dimensions
     */
    getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ width: 0, height: 0 });
            };
            
            img.src = url;
        });
    }

    /**
     * Create IPFS content hash (simplified version)
     */
    createContentHash(content) {
        // This is a simplified hash generation for demo purposes
        // In production, you'd use proper IPFS content addressing
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        
        // Simple hash function (not cryptographically secure)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return 'Qm' + Math.abs(hash).toString(16).padStart(44, '0');
    }

    /**
     * Check if IPFS service is available
     */
    async isAvailable() {
        try {
            // Try to reach one of the gateways
            const response = await fetch(this.gateways[0] + 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', {
                method: 'HEAD',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentGateway: this.currentGateway,
            gatewayUrl: this.gateways[this.currentGateway],
            availableGateways: this.gateways.length
        };
    }
}

// Export for use in other modules
window.IPFSService = IPFSService;
