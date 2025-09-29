// Comprehensive language configuration for Whisper transcription and translation
export const LANGUAGES = {
    // Tier 1: Most common languages with premium support
    en: { name: 'English', flag: '🇺🇸', native: 'English', region: 'United States' },
    es: { name: 'Spanish', flag: '🇪🇸', native: 'Español', region: 'Spain' },
    fr: { name: 'French', flag: '🇫🇷', native: 'Français', region: 'France' },
    de: { name: 'German', flag: '🇩🇪', native: 'Deutsch', region: 'Germany' },
    it: { name: 'Italian', flag: '🇮🇹', native: 'Italiano', region: 'Italy' },
    pt: { name: 'Portuguese', flag: '🇵🇹', native: 'Português', region: 'Portugal' },
    ru: { name: 'Russian', flag: '🇷🇺', native: 'Русский', region: 'Russia' },
    ja: { name: 'Japanese', flag: '🇯🇵', native: '日本語', region: 'Japan' },
    ko: { name: 'Korean', flag: '🇰🇷', native: '한국어', region: 'South Korea' },
    zh: { name: 'Chinese', flag: '🇨🇳', native: '中文', region: 'China' },
    
    // Tier 2: Additional widely supported languages
    ar: { name: 'Arabic', flag: '🇸🇦', native: 'العربية', region: 'Saudi Arabia' },
    hi: { name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी', region: 'India' },
    tr: { name: 'Turkish', flag: '🇹🇷', native: 'Türkçe', region: 'Turkey' },
    nl: { name: 'Dutch', flag: '🇳🇱', native: 'Nederlands', region: 'Netherlands' },
    pl: { name: 'Polish', flag: '🇵🇱', native: 'Polski', region: 'Poland' },
    sv: { name: 'Swedish', flag: '🇸🇪', native: 'Svenska', region: 'Sweden' },
    da: { name: 'Danish', flag: '🇩🇰', native: 'Dansk', region: 'Denmark' },
    no: { name: 'Norwegian', flag: '🇳🇴', native: 'Norsk', region: 'Norway' },
    fi: { name: 'Finnish', flag: '🇫🇮', native: 'Suomi', region: 'Finland' },
    th: { name: 'Thai', flag: '🇹🇭', native: 'ไทย', region: 'Thailand' },
    
    // Tier 3: Extended language support
    uk: { name: 'Ukrainian', flag: '🇺🇦', native: 'Українська', region: 'Ukraine' },
    cs: { name: 'Czech', flag: '🇨🇿', native: 'Čeština', region: 'Czech Republic' },
    he: { name: 'Hebrew', flag: '🇮🇱', native: 'עברית', region: 'Israel' },
    hu: { name: 'Hungarian', flag: '🇭🇺', native: 'Magyar', region: 'Hungary' },
    ro: { name: 'Romanian', flag: '🇷🇴', native: 'Română', region: 'Romania' },
    sk: { name: 'Slovak', flag: '🇸🇰', native: 'Slovenčina', region: 'Slovakia' },
    bg: { name: 'Bulgarian', flag: '🇧🇬', native: 'Български', region: 'Bulgaria' },
    hr: { name: 'Croatian', flag: '🇭🇷', native: 'Hrvatski', region: 'Croatia' },
    ca: { name: 'Catalan', flag: '🇪🇸', native: 'Català', region: 'Catalonia' },
    vi: { name: 'Vietnamese', flag: '🇻🇳', native: 'Tiếng Việt', region: 'Vietnam' },
    id: { name: 'Indonesian', flag: '🇮🇩', native: 'Bahasa Indonesia', region: 'Indonesia' },
    ms: { name: 'Malay', flag: '🇲🇾', native: 'Bahasa Malaysia', region: 'Malaysia' },
    tl: { name: 'Filipino', flag: '🇵🇭', native: 'Filipino', region: 'Philippines' },
    bn: { name: 'Bengali', flag: '🇧🇩', native: 'বাংলা', region: 'Bangladesh' },
    ta: { name: 'Tamil', flag: '🇮🇳', native: 'தமிழ்', region: 'Tamil Nadu' },
    te: { name: 'Telugu', flag: '🇮🇳', native: 'తెলুগু', region: 'Andhra Pradesh' },
    mr: { name: 'Marathi', flag: '🇮🇳', native: 'मराठी', region: 'Maharashtra' },
    gu: { name: 'Gujarati', flag: '🇮🇳', native: 'ગુજરાતી', region: 'Gujarat' },
    kn: { name: 'Kannada', flag: '🇮🇳', native: 'ಕನ್ನಡ', region: 'Karnataka' },
    ml: { name: 'Malayalam', flag: '🇮🇳', native: 'മലയാളം', region: 'Kerala' },
    
    // Regional variants
    'pt-br': { name: 'Portuguese (Brazil)', flag: '🇧🇷', native: 'Português (Brasil)', region: 'Brazil' },
    'en-gb': { name: 'English (UK)', flag: '🇬🇧', native: 'English (UK)', region: 'United Kingdom' },
    'en-au': { name: 'English (Australia)', flag: '🇦🇺', native: 'English (Australia)', region: 'Australia' },
    'zh-tw': { name: 'Chinese (Traditional)', flag: '🇹🇼', native: '繁體中文', region: 'Taiwan' },
    'es-mx': { name: 'Spanish (Mexico)', flag: '🇲🇽', native: 'Español (México)', region: 'Mexico' },
    'fr-ca': { name: 'French (Canada)', flag: '🇨🇦', native: 'Français (Canada)', region: 'Canada' }
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES);

// Helper functions for different display formats
export const getLanguageDisplayName = (code, format = 'name') => {
    const lang = LANGUAGES[code];
    if (!lang) return code.toUpperCase();
    
    switch (format) {
        case 'name': return lang.name;
        case 'native': return lang.native;
        case 'flag': return lang.flag;
        case 'flag-name': return `${lang.flag} ${lang.name}`;
        case 'flag-code': return `${lang.flag} ${code.toUpperCase()}`;
        case 'name-native': return lang.native !== lang.name ? `${lang.name} (${lang.native})` : lang.name;
        case 'full': return `${lang.flag} ${lang.name} (${lang.native})`;
        default: return lang.name;
    }
};

// Categories for UI organization
export const LANGUAGE_CATEGORIES = {
    'popular': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
    'european': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'uk', 'cs', 'he', 'hu', 'ro', 'sk', 'bg', 'hr', 'ca'],
    'asian': ['ja', 'ko', 'zh', 'hi', 'th', 'vi', 'id', 'ms', 'tl', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml'],
    'african': ['ar'],
    'americas': ['en', 'es', 'pt', 'fr']
};

export default {
    LANGUAGES,
    LANGUAGE_CODES,
    getLanguageDisplayName,
    LANGUAGE_CATEGORIES
};
