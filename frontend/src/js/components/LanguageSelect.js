import { LANGUAGES, LANGUAGE_CODES, getLanguageDisplayName } from '../config/LanguageConfig.js';

export default class LanguageSelect {
    constructor(type = 'source', displayFormat = 'flag-name') {
        this.type = type;
        this.displayFormat = displayFormat;
        this.element = document.createElement('select');
        this.element.className = `language-select ${type}-select`;
        this.render();
    }

    render() {
        // Add auto-detect option for source language selection
        this.element.innerHTML = this.type === 'source' ? 
            '<option value="">🌍 Auto-detect</option>' : '';
            
        // Populate with languages using consistent formatting
        LANGUAGE_CODES.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            
            // Use the specified display format for consistent rendering
            option.textContent = getLanguageDisplayName(code, this.displayFormat);
            
            this.element.appendChild(option);
        });
        
        return this.element;
    }

    // Add method to update display format
    setDisplayFormat(format) {
        this.displayFormat = format;
        this.render();
    }

    get value() {
        return this.element.value;
    }

    set value(newValue) {
        this.element.value = newValue;
    }

    onchange(callback) {
        this.element.addEventListener('change', callback);
    }

    // Helper method to get currently selected language info
    getSelectedLanguage() {
        const code = this.element.value;
        return code ? LANGUAGES[code] : null;
    }
}
