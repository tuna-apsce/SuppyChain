/**
 * Utility functions for AgriTrace
 */

/**
 * QR Code Generator Class
 */
class QRCodeGenerator {
    constructor() {
        this.defaultOptions = {
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.M : 0
        };
    }

    /**
     * Generate QR code and return as data URL
     */
    async generateQRCode(text, options = {}) {
        try {
            if (typeof QRCode === 'undefined') {
                throw new Error('QRCode library not loaded');
            }
            
            console.log('Generating QR code for text:', text);
            
            const qrOptions = { ...this.defaultOptions, ...options };
            
            // Create a temporary div element instead of canvas
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            tempDiv.style.width = qrOptions.width + 'px';
            tempDiv.style.height = qrOptions.height + 'px';
            document.body.appendChild(tempDiv);
            
            return new Promise((resolve, reject) => {
                try {
                    console.log('Creating QRCode instance...');
                    
                    // Create QR code in the div
                    const qr = new QRCode(tempDiv, {
                        text: text,
                        width: qrOptions.width,
                        height: qrOptions.height,
                        colorDark: qrOptions.colorDark,
                        colorLight: qrOptions.colorLight,
                        correctLevel: qrOptions.correctLevel
                    });
                    
                    console.log('QRCode instance created, waiting for render...');
                    
                    // Wait for QR code to render
                    setTimeout(() => {
                        try {
                            const canvas = tempDiv.querySelector('canvas');
                            if (canvas) {
                                console.log('Canvas found, generating dataURL...');
                                const dataURL = canvas.toDataURL('image/png');
                                
                                console.log('QR code rendered successfully, dataURL length:', dataURL.length);
                                
                                // Clean up
                                document.body.removeChild(tempDiv);
                                resolve(dataURL);
                            } else {
                                console.error('No canvas found in QR code div');
                                document.body.removeChild(tempDiv);
                                reject(new Error('QR code canvas not found'));
                            }
                        } catch (error) {
                            console.error('Error generating dataURL:', error);
                            document.body.removeChild(tempDiv);
                            reject(error);
                        }
                    }, 300); // Wait longer for render
                    
                } catch (error) {
                    console.error('Error creating QRCode:', error);
                    document.body.removeChild(tempDiv);
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }

    /**
     * Generate QR code and display in element
     */
    async generateQRCodeInElement(elementId, text, options = {}) {
        try {
            if (typeof QRCode === 'undefined') {
                throw new Error('QRCode library not loaded');
            }
            
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Element with id '${elementId}' not found`);
            }

            const qrOptions = { ...this.defaultOptions, ...options };
            
            // Clear previous content
            element.innerHTML = '';
            
            // Generate QR code
            const qr = new QRCode(element, {
                text: text,
                ...qrOptions
            });

            return qr;
        } catch (error) {
            console.error('Error generating QR code in element:', error);
            throw error;
        }
    }

    /**
     * Generate QR code for product batch ID
     */
    async generateProductQR(batchId, baseUrl = window.location.origin) {
        const qrText = `${baseUrl}/index.html?batch=${batchId}`;
        return await this.generateQRCode(qrText);
    }

    /**
     * Generate QR code for user profile
     */
    async generateUserQR(userAddress, baseUrl = window.location.origin) {
        const qrText = `${baseUrl}/index.html?user=${userAddress}`;
        return await this.generateQRCode(qrText);
    }
}

/**
 * QR Scanner Class
 */
class QRScanner {
    constructor() {
        this.scanner = null;
        this.isScanning = false;
    }

    /**
     * Initialize QR scanner
     */
    async init(videoElementId = 'qr-video') {
        try {
            if (typeof QrScanner === 'undefined') {
                throw new Error('QrScanner library not loaded');
            }
            
            const video = document.getElementById(videoElementId);
            if (!video) {
                throw new Error(`Video element with id '${videoElementId}' not found`);
            }

            this.scanner = new QrScanner(video, (result) => {
                this.onScanSuccess(result);
            }, {
                highlightScanRegion: true,
                highlightCodeOutline: true,
            });

            return this.scanner;
        } catch (error) {
            console.error('Error initializing QR scanner:', error);
            throw error;
        }
    }

    /**
     * Start scanning
     */
    async start() {
        try {
            if (!this.scanner) {
                throw new Error('QR scanner not initialized');
            }

            await this.scanner.start();
            this.isScanning = true;
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            throw error;
        }
    }

    /**
     * Stop scanning
     */
    async stop() {
        try {
            if (this.scanner && this.isScanning) {
                await this.scanner.stop();
                this.isScanning = false;
            }
        } catch (error) {
            console.error('Error stopping QR scanner:', error);
            throw error;
        }
    }

    /**
     * Check if camera is available
     */
    async isCameraAvailable() {
        try {
            if (typeof QrScanner === 'undefined') {
                return false;
            }
            
            // Check if camera is available using QrScanner.hasCamera()
            return await QrScanner.hasCamera();
        } catch (error) {
            console.error('Error checking camera availability:', error);
            return false;
        }
    }

    /**
     * Handle successful scan
     */
    onScanSuccess(result) {
        console.log('QR Code scanned:', result);
        
        // Emit custom event
        const event = new CustomEvent('qrScanSuccess', {
            detail: { result: result }
        });
        document.dispatchEvent(event);
    }

    /**
     * Destroy scanner
     */
    destroy() {
        if (this.scanner) {
            this.scanner.destroy();
            this.scanner = null;
            this.isScanning = false;
        }
    }
}

// Export classes to global scope
window.QRScanner = QRScanner;
window.QRCodeGenerator = QRCodeGenerator;

// Ensure isCameraAvailable method is available
if (window.QRScanner && !window.QRScanner.prototype.isCameraAvailable) {
    window.QRScanner.prototype.isCameraAvailable = async function() {
        try {
            if (typeof QrScanner === 'undefined') {
                return false;
            }
            
            // Check if camera is available using QrScanner.hasCamera()
            return await QrScanner.hasCamera();
        } catch (error) {
            console.error('Error checking camera availability:', error);
            return false;
        }
    };
    // Added isCameraAvailable method to QRScanner prototype
}

/**
 * Format date for display
 */
function formatDate(date, options = {}) {
    try {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        if (date instanceof Date) {
            return date.toLocaleDateString('en-US', formatOptions);
        } else if (typeof date === 'string' || typeof date === 'number') {
            return new Date(date).toLocaleDateString('en-US', formatOptions);
        }
        
        return 'Invalid Date';
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

/**
 * Format date relative to now
 */
function formatRelativeDate(date) {
    try {
        const now = new Date();
        const targetDate = new Date(date);
        const diffMs = now - targetDate;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSeconds < 60) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffWeeks < 4) {
            return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        } else if (diffMonths < 12) {
            return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
        } else {
            return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
        }
    } catch (error) {
        console.error('Error formatting relative date:', error);
        return 'Unknown';
    }
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `$${amount.toFixed(2)}`;
    }
}

/**
 * Format number with commas
 */
function formatNumber(number, decimals = 0) {
    try {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return number.toString();
    }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    try {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error) {
        console.error('Error formatting file size:', error);
        return bytes + ' Bytes';
    }
}

/**
 * Truncate text
 */
function truncateText(text, maxLength = 50, suffix = '...') {
    try {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    } catch (error) {
        console.error('Error truncating text:', error);
        return text || '';
    }
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
    try {
        if (!str || typeof str !== 'string') {
            return '';
        }
        
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } catch (error) {
        console.error('Error capitalizing string:', error);
        return str || '';
    }
}

/**
 * Convert string to title case
 */
function toTitleCase(str) {
    try {
        if (!str || typeof str !== 'string') {
            return '';
        }
        
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    } catch (error) {
        console.error('Error converting to title case:', error);
        return str || '';
    }
}

/**
 * Generate random ID
 */
function generateId(prefix = '', length = 8) {
    try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix;
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    } catch (error) {
        console.error('Error generating ID:', error);
        return prefix + Date.now().toString();
    }
}

/**
 * Generate batch ID
 */
function generateBatchId(productName = '', date = new Date()) {
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const productCode = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        
        return `${productCode}-${year}${month}${day}-${random}`;
    } catch (error) {
        console.error('Error generating batch ID:', error);
        return 'BATCH-' + Date.now().toString(36).toUpperCase();
    }
}

/**
 * Validate email
 */
function validateEmail(email) {
    try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    } catch (error) {
        console.error('Error validating email:', error);
        return false;
    }
}

/**
 * Validate URL
 */
function validateUrl(url) {
    try {
        const urlRegex = /^https?:\/\/.+\..+/;
        return urlRegex.test(url);
    } catch (error) {
        console.error('Error validating URL:', error);
        return false;
    }
}

/**
 * Sanitize HTML
 */
function sanitizeHtml(str) {
    try {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    } catch (error) {
        console.error('Error sanitizing HTML:', error);
        return str || '';
    }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 5000) {
    try {
        const toastContainer = document.querySelector('.toast-container') || createToastContainer();
        const toast = createToast(message, type);
        
        toastContainer.appendChild(toast);
        
        // Show toast
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();
        
        // Remove toast element after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
        
        return toast;
    } catch (error) {
        console.error('Error showing toast:', error);
        // Fallback to alert
        alert(message);
    }
}

/**
 * Create toast container
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

/**
 * Create toast element
 */
function createToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${icon} me-2"></i>
                ${sanitizeHtml(message)}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    return toast;
}

/**
 * Get toast icon based on type
 */
function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

/**
 * Debounce function
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.error('Error deep cloning object:', error);
        return obj;
    }
}

/**
 * Check if object is empty
 */
function isEmpty(obj) {
    try {
        if (obj == null) return true;
        if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
        return Object.keys(obj).length === 0;
    } catch (error) {
        console.error('Error checking if object is empty:', error);
        return true;
    }
}

/**
 * Get query parameter
 */
function getQueryParam(name, url = window.location.href) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get(name);
    } catch (error) {
        console.error('Error getting query parameter:', error);
        return null;
    }
}

/**
 * Set query parameter
 */
function setQueryParam(name, value, url = window.location.href) {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set(name, value);
        return urlObj.toString();
    } catch (error) {
        console.error('Error setting query parameter:', error);
        return url;
    }
}

/**
 * Remove query parameter
 */
function removeQueryParam(name, url = window.location.href) {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.delete(name);
        return urlObj.toString();
    } catch (error) {
        console.error('Error removing query parameter:', error);
        return url;
    }
}

/**
 * Format address for display
 */
function formatAddress(address, startChars = 6, endChars = 4) {
    try {
        if (!address || typeof address !== 'string') {
            return '';
        }
        
        if (address.length <= startChars + endChars) {
            return address;
        }
        
        return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
    } catch (error) {
        console.error('Error formatting address:', error);
        return address || '';
    }
}

/**
 * Calculate percentage
 */
function calculatePercentage(value, total, decimals = 2) {
    try {
        if (!total || total === 0) return 0;
        return parseFloat(((value / total) * 100).toFixed(decimals));
    } catch (error) {
        console.error('Error calculating percentage:', error);
        return 0;
    }
}

/**
 * Get user role display name
 */
function getRoleDisplayName(role) {
    try {
        const roleNames = {
            FARMER: 'Farmer',
            PROCESSOR: 'Processor',
            TRANSPORTER: 'Transporter',
            WAREHOUSE: 'Warehouse',
            RETAILER: 'Retailer',
            CONSUMER: 'Consumer'
        };
        return roleNames[role] || role;
    } catch (error) {
        console.error('Error getting role display name:', error);
        return role || 'Unknown';
    }
}

/**
 * Get event type display name
 */
function getEventTypeDisplayName(eventType) {
    try {
        const eventNames = {
            HARVEST: 'Harvest',
            PROCESSING: 'Processing',
            TRANSPORT_START: 'Transport Start',
            TRANSPORT_END: 'Transport End',
            WAREHOUSE_IN: 'Warehouse In',
            WAREHOUSE_OUT: 'Warehouse Out',
            RETAIL_RECEIVE: 'Retail Receive',
            SALE: 'Sale'
        };
        return eventNames[eventType] || eventType;
    } catch (error) {
        console.error('Error getting event type display name:', error);
        return eventType || 'Unknown';
    }
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
    try {
        const statusClasses = {
            active: 'badge-active',
            pending: 'badge-pending',
            expired: 'badge-expired',
            verified: 'badge-verified',
            inactive: 'badge-expired'
        };
        return statusClasses[status.toLowerCase()] || 'badge-pending';
    } catch (error) {
        console.error('Error getting status badge class:', error);
        return 'badge-pending';
    }
}

/**
 * Get role badge class
 */
function getRoleBadgeClass(role) {
    try {
        const roleClasses = {
            FARMER: 'badge-farmer',
            PROCESSOR: 'badge-processor',
            TRANSPORTER: 'badge-transporter',
            WAREHOUSE: 'badge-warehouse',
            RETAILER: 'badge-retailer',
            CONSUMER: 'badge-consumer'
        };
        return roleClasses[role] || 'badge-secondary';
    } catch (error) {
        console.error('Error getting role badge class:', error);
        return 'badge-secondary';
    }
}

/**
 * Export all utility functions
 */
window.AgriTraceUtils = {
    formatDate,
    formatRelativeDate,
    formatCurrency,
    formatNumber,
    formatFileSize,
    truncateText,
    capitalizeFirst,
    toTitleCase,
    generateId,
    generateBatchId,
    validateEmail,
    validateUrl,
    sanitizeHtml,
    copyToClipboard,
    showToast,
    debounce,
    throttle,
    deepClone,
    isEmpty,
    getQueryParam,
    setQueryParam,
    removeQueryParam,
    formatAddress,
    calculatePercentage,
    getRoleDisplayName,
    getEventTypeDisplayName,
    getStatusBadgeClass,
    getRoleBadgeClass
};
