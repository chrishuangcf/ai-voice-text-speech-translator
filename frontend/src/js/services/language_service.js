/**
 * Language Service - DEPRECATED
 * 
 * This service is deprecated. Please use the LanguageSelect component 
 * and LanguageConfig instead for consistent language handling.
 * 
 * @deprecated Use LanguageSelect component and LanguageConfig
 */

import { LANGUAGES, getLanguageDisplayName } from '../config/LanguageConfig.js';

class LanguageService {
    constructor() {
        console.warn('LanguageService is deprecated. Use LanguageSelect component instead.');
        
        // Legacy support - kept for backward compatibility
        this.languageNames = Object.fromEntries(
            Object.entries(LANGUAGES).map(([code, lang]) => [code, lang.name])
        );

        this.flagMap = Object.fromEntries(
            Object.entries(LANGUAGES).map(([code, lang]) => [code, lang.flag])
        );
    }

    /**
     * @deprecated Use LANGUAGE_CODES from LanguageConfig instead
     */
    getDefaultLanguages() {
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
    }

    /**
     * @deprecated Use LanguageSelect component instead
     */
    populateLanguageSelect(select, languages) {
        console.warn('populateLanguageSelect is deprecated. Use LanguageSelect component.');
        if (!select || select.options.length > 2) return;
        
        select.innerHTML = '<option value="">🌍 Auto-detect</option>';
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = getLanguageDisplayName(lang, 'flag-name');
            select.appendChild(option);
        });
    }

    /**
     * @deprecated Use LanguageSelect component instead
     */
    populateTranslationSelect(select, languages) {
        console.warn('populateTranslationSelect is deprecated. Use LanguageSelect component.');
        if (!select || select.options.length > 5) return;
        
        select.innerHTML = '';
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = getLanguageDisplayName(lang, 'flag-code');
            select.appendChild(option);
        });
    }

    /**
     * @deprecated Use getLanguageDisplayName from LanguageConfig instead
     */
    getLanguageName(code) {
        return getLanguageDisplayName(code, 'name');
    }
}

export default LanguageService;
