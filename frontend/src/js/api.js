/**
 * Whisper API Client with enhanced error handling and caching
 */

// API Configuration
const API_BASE_URL = 'http://whisper-backend:5000';
const TRANSLATION_API_URL = 'http://translation-service:6000';
const TTS_API_URL = 'http://tts-service:7000';

export class WhisperAPI {
    constructor() {
        this.hostname = window.location.hostname;
        // Determine base URL based on environment (Docker vs. local)
        // If hostname is 'localhost' or '127.0.0.1', use those for local dev.
        // Otherwise, assume Docker network and use service names.
        if (this.hostname === 'localhost' || this.hostname === '127.0.0.1') {
            this.baseURL = `http://${this.hostname}:5000/api/v1`;
            this.healthURL = `http://${this.hostname}:5000/health`;
        } else {
            this.baseURL = `${API_BASE_URL}/api/v1`;
            this.healthURL = `${API_BASE_URL}/health`;
        }
        
        this._connectionTested = false;
        this._cache = new Map();
        
        console.log('WhisperAPI initialized:', {
            baseURL: this.baseURL,
            healthURL: this.healthURL
        });
    }

    /**
     * Enhanced connection testing with retry logic
     */
    async testConnection(retries = 3) {
        const testUrls = [
            this.healthURL, // This will be the service name URL in Docker, or localhost in local dev
            // Fallbacks for local development or direct IP access
            `http://${this.hostname}:5000/health`,
            'http://localhost:5000/health',
            'http://127.0.0.1:5000/health'
        ];
        
        // Add Docker service health URLs if not already included (e.g., if hostname is localhost)
        if (this.hostname === 'localhost' || this.hostname === '127.0.0.1') {
            testUrls.push('http://whisper-backend:5000/health');
            testUrls.push('http://translation-service:6000/health');
            testUrls.push('http://tts-service:7000/health');
        }
        
        for (const url of testUrls) {
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(5000) // 5 second timeout
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Backend accessible at: ${url}`);
                        this.healthURL = url;
                        this.baseURL = url.replace('/health', '/api/v1');
                        return true;
                    }
                } catch (error) {
                    console.warn(`Attempt ${attempt + 1}/${retries} failed for ${url}:`, error.message);
                    if (attempt < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
                    }
                }
            }
        }
        
        console.log('❌ No accessible backend found');
        return false;
    }

    /**
     * Centralized request handler with better error handling
     */
    async request(endpoint, options = {}) {
        if (!this._connectionTested) {
            const connected = await this.testConnection();
            if (!connected) {
                throw new Error('Backend service is not accessible');
            }
            this._connectionTested = true;
        }
        
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${options.method || 'GET'}-${url}`;
        
        // Simple GET request caching for language lists
        if (!options.method || options.method === 'GET') {
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey);
            }
        }

        const config = {
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
            ...options
        };

        // Set headers for non-FormData requests
        if (options.body && !(options.body instanceof FormData)) {
            config.headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
        }

        try {
            console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If error response isn't JSON, use status text
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Cache successful GET requests
            if (!options.method || options.method === 'GET') {
                this._cache.set(cacheKey, data);
            }
            
            console.log('✅ API Response received');
            return data;
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this._connectionTested = false;
                throw new Error(`Network error: Cannot connect to backend at ${url}`);
            }
            throw error;
        }
    }

    /**
     * Check service health
     */
    async checkHealth() {
        try {
            const response = await fetch(this.healthURL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            const connected = await this.testConnection();
            if (!connected) {
                throw new Error(`Backend service is not accessible.`);
            }
            
            throw new Error(`Backend health check failed: ${error.message}`);
        }
    }

    /**
     * Transcribe audio file
     */
    async transcribeAudio(file, language = '', task = 'transcribe', targetLanguage = 'en') {
        console.log('🎤 Starting transcription:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            language: language,
            task: task,
            targetLanguage: targetLanguage
        });
        
        const formData = new FormData();
        formData.append('audio', file);
        
        if (language) {
            formData.append('language', language);
        }
        
        formData.append('task', task);
        
        // Add target language for translation tasks
        if (task === 'translate' && targetLanguage) {
            formData.append('target_language', targetLanguage);
        }

        return this.request('/transcribe', {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Get supported languages for transcription
     */
    async getLanguages() {
        console.log('🌐 Getting supported transcription languages...');
        return this.request('/languages');
    }

    /**
     * Get supported languages for translation
     */
    async getTranslationLanguages() {
        console.log('🌍 Getting supported translation languages...');
        return this.request('/translation-languages');
    }

    /**
     * Get model information
     */
    async getModelInfo() {
        return this.request('/model-info');
    }

    /**
     * Translate text using translation service
     */
    async translateText(text, targetLanguage = 'en') {
        console.log('🌍 Starting text translation:', {
            textLength: text.length,
            targetLanguage: targetLanguage
        });
        
        return this.request('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                target_language: targetLanguage
            })
        });
    }
}



/**
 * Transcription API
 */
async function transcribeAudio(file, language = 'auto') {
    const formData = new FormData();
    formData.append('audio', file);
    
    if (language !== 'auto') {
        formData.append('language', language);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    }
}

/**
 * Translation API
 */
async function translate(text, targetLanguage) {
    try {
        const response = await fetch(`${TRANSLATION_API_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                target_language: targetLanguage
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * TTS API Functions
 */
async function synthesizeTextToSpeech(text, voice = 'en-US-gtts') {
    try {
        const response = await fetch(`${TTS_API_URL}/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: voice
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `TTS API error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('TTS synthesis error:', error);
        throw error;
    }
}

async function downloadTTSAudio(audioId) {
    try {
        const response = await fetch(`${TTS_API_URL}/download/${audioId}`);
        
        if (!response.ok) {
            throw new Error(`Download error: ${response.status}`);
        }

        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error('Audio download error:', error);
        throw error;
    }
}

async function getAvailableVoices() {
    try {
        const response = await fetch(`${TTS_API_URL}/voices`);
        
        if (!response.ok) {
            throw new Error(`Voices API error: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Get voices error:', error);
        return { voices: ['en-US-gtts'], default: 'en-US-gtts' };
    }
}

async function cleanupTTSAudio(audioId) {
    try {
        const response = await fetch(`${TTS_API_URL}/cleanup/${audioId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.warn(`Cleanup warning: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Cleanup error:', error);
        return false;
    }
}

/**
 * Health check for all services
 */
async function checkServiceHealth() {
    const services = [
        { name: 'Transcription', url: `${API_BASE_URL}/health` },
        { name: 'Translation', url: `${TRANSLATION_API_URL}/health` },
        { name: 'TTS', url: `${TTS_API_URL}/health` }
    ];

    const results = {};

    for (const service of services) {
        try {
            const response = await fetch(service.url);
            results[service.name] = {
                status: response.ok ? 'healthy' : 'unhealthy',
                data: response.ok ? await response.json() : null
            };
        } catch (error) {
            results[service.name] = {
                status: 'error',
                error: error.message
            };
        }
    }

    return results;
}