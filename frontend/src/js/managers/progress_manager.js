/**
 * Progress Manager - Handles progress tracking and UI updates
 */
class ProgressManager {
    constructor(elements) {
        this.elements = elements;
        this.currentProgress = 0;
    }

    /**
     * Show progress section
     */
    show() {
        if (this.elements.progressSection) {
            this.elements.progressSection.style.display = 'block';
        }
        if (this.elements.options) {
            this.elements.options.style.display = 'none';
        }
    }

    /**
     * Update progress
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} text - Status text
     */
    update(percent, text) {
        this.currentProgress = percent;
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = text;
        }
    }

    /**
     * Hide progress section
     */
    hide() {
        if (this.elements.progressSection) {
            this.elements.progressSection.style.display = 'none';
        }
        if (this.elements.options) {
            this.elements.options.style.display = 'grid';
        }
    }

    /**
     * Reset progress to 0
     */
    reset() {
        this.update(0, '');
    }
}

export default ProgressManager;
