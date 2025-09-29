/**
 * UI Manager - Handles DOM elements caching and UI utilities
 */
class UIManager {
    constructor() {
        this.elements = {};
    }

    /**
     * Cache DOM elements
     * @param {Array<string>} elementIds - Array of element IDs to cache
     */
    cacheElements(elementIds) {
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    showOptions() {
        if (this.elements.options) {
            this.elements.options.style.display = 'grid';
        }
        if (this.elements.transcribeBtn) {
            this.elements.transcribeBtn.disabled = !this.app.state.currentFile;
        }
    }

    showResults(result) {
        if (this.elements.resultText) {
            this.elements.resultText.textContent = result.text || '';
        }
        if (this.elements.detectedLanguage) {
            this.elements.detectedLanguage.textContent = result.language || 'unknown';
        }
        if (this.elements.modelInfo) {
            this.elements.modelInfo.textContent = result.model_size || 'Unknown';
        }
        
        // Show sections
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'block';
        }
        if (this.elements.progressSection) {
            this.elements.progressSection.style.display = 'none';
        }
        if (this.elements.quickActions) {
            this.elements.quickActions.style.display = 'block';
        }
    }

    resetUI() {
        const hideElements = ['resultsSection', 'progressSection', 'ttsSection', 'quickActions'];
        hideElements.forEach(id => {
            if (this.elements[id]) {
                this.elements[id].style.display = 'none';
            }
        });
    }

    /**
     * Show/hide elements
     * @param {string} id - Element ID
     * @param {boolean} show - Whether to show or hide
     */
    toggleElement(id, show) {
        if (this.elements[id]) {
            this.elements[id].style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Update element text content
     * @param {string} id - Element ID
     * @param {string} text - Text to set
     */
    updateText(id, text) {
        if (this.elements[id]) {
            this.elements[id].textContent = text;
        }
    }

    /**
     * Toggle element disabled state
     * @param {string} id - Element ID
     * @param {boolean} disabled - Whether to disable
     */
    setDisabled(id, disabled) {
        if (this.elements[id]) {
            this.elements[id].disabled = disabled;
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} [type='success'] - Type of toast (success, error, info)
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.textContent = message;
        
        const bgColor = type === 'error' ? '#f56565' : 
                       type === 'info' ? '#4299e1' : '#48bb78';
        
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: ${bgColor}; color: white; 
            padding: 12px 20px; border-radius: 6px; 
            z-index: 1001; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Scroll element into view
     * @param {string} id - Element ID
     * @param {object} [options] - Scroll options
     */
    scrollTo(id, options = { behavior: 'smooth' }) {
        if (this.elements[id]) {
            this.elements[id].scrollIntoView(options);
        }
    }
}

export default UIManager;
