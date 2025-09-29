/**
 * Error Manager - Handles all error display and logging
 */
class ErrorManager {
    constructor(elements) {
        this.elements = elements;
    }

    show(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        if (this.elements.errorModal) {
            this.elements.errorModal.style.display = 'flex';
        }
    }

    hide() {
        if (this.elements.errorModal) {
            this.elements.errorModal.style.display = 'none';
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #48bb78;
            color: white; padding: 12px 20px; border-radius: 6px; z-index: 1001;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

export default ErrorManager;
