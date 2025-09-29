import LanguageSelect from './components/LanguageSelect.js';
import { WhisperAPI } from './api.js';
import AudioHandler from './audio.js';
import TTSService from './services/TTSService.js';

/**
 * Whisper Voice-to-Text Application
 */
class WhisperApp {
    constructor() {
        console.log('WhisperApp initializing...');
        
        // Core services
        this.api = new WhisperAPI();
        this.audioHandler = new AudioHandler();
        this.ttsService = new TTSService();
        
        // Application state
        this.state = {
            currentFile: null,
            isProcessing: false,
            currentTranscription: '',
            currentAudioId: null,
            ttsAvailable: false
        };
        
        // DOM elements cache
        this.elements = {};
        
        // Initialize
        this.init();
    }

    async init() {
        console.log('WhisperApp.init() called');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        console.log('WhisperApp.setup() called');
        try {
            this.cacheElements();
            this.attachEventListeners();
            console.log('Calling loadInitialData...');
            await this.loadInitialData();
            console.log('loadInitialData completed.');
            await this.initializeTTS();
            console.log('✓ WhisperApp ready');
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        const ids = [
            'uploadArea', 'fileInput', 'browseBtn', 'filePreview', 'fileName', 'fileSize',
            'removeFile', 'audioPreview', 'options', 'languageSelect', 'taskSelect',
            'translateToSelect', 'translateToGroup', 'transcribeBtn', 'progressSection',
            'progressFill', 'progressText', 'resultsSection', 'resultText', 'detectedLanguage',
            'modelInfo', 'taskInfo', 'copyBtn', 'downloadBtn', 'newBtn', 'statusText',
            'statusIndicator', 'ttsStatusText', 'ttsStatusIndicator',
            'errorModal', 'errorMessage', 'modalOk', 'ttsSection', 'ttsResults', 
            'quickActions', 'speakTranscriptBtn'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
        
        console.log('Elements cached.', this.elements);
        console.log('speakTranscriptBtn element found:', !!this.elements.speakTranscriptBtn);
        console.log('quickActions element found:', !!this.elements.quickActions);
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        this.setupDragDrop();
        this.setupFileHandling();
        this.setupFormControls();
        this.setupResultActions();
        this.setupErrorHandling();
        console.log('Event listeners attached.');
    }

    /**
     * Enhanced drag and drop
     */
    setupDragDrop() {
        const { uploadArea } = this.elements;
        if (!uploadArea) return;

        // Prevent defaults globally
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            document.addEventListener(event, e => e.preventDefault(), false);
        });

        // Upload area events
        ['dragenter', 'dragover'].forEach(event => {
            uploadArea.addEventListener(event, e => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'dragend'].forEach(event => {
            uploadArea.addEventListener(event, e => {
                e.preventDefault();
                if (!uploadArea.contains(e.relatedTarget)) {
                    uploadArea.classList.remove('dragover');
                }
            });
        });

        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Click handlers
        uploadArea.addEventListener('click', () => this.elements.fileInput?.click());
        this.elements.browseBtn?.addEventListener('click', e => {
            e.stopPropagation();
            this.elements.fileInput?.click();
        });
        console.log('Drag and drop setup.');
    }

    /**
     * File handling events
     */
    setupFileHandling() {
        this.elements.fileInput?.addEventListener('change', e => {
            if (e.target.files?.[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        this.elements.removeFile?.addEventListener('click', e => {
            e.stopPropagation();
            this.removeCurrentFile();
        });
        console.log('File handling setup.');
    }

    /**
     * Form control events
     */
    setupFormControls() {
        this.elements.taskSelect?.addEventListener('change', () => this.handleTaskChange());
        this.elements.transcribeBtn?.addEventListener('click', () => this.startTranscription());
        this.elements.speakTranscriptBtn?.addEventListener('click', () => this.speakTranscript());
        console.log('Form controls setup.');
    }

    /**
     * Result action events
     */
    setupResultActions() {
        this.elements.copyBtn?.addEventListener('click', () => this.copyResults());
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadResults());
        this.elements.newBtn?.addEventListener('click', () => this.resetApp());
        this.elements.speakTranscriptBtn?.addEventListener('click', () => this.speakTranscript());
        console.log('Result actions setup.');
    }

    /**
     * Error handling events
     */
    setupErrorHandling() {
        this.elements.modalOk?.addEventListener('click', () => this.hideError());
        console.log('Error handling setup.');
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        console.log('loadInitialData() called.');
        try {
            this.updateBackendStatus('Loading...', null);
            this.updateTTSStatus('Waiting...', null);
            
            // Load languages with fallback
            console.log('Attempting to load languages...');
            try {
                const langs = await this.api.getLanguages();
                console.log('Languages received:', langs);
                this.populateLanguageSelect(langs.languages || this.getDefaultLanguages());
                this.updateBackendStatus('Connected', true);
            } catch (error) {
                console.error('Error loading languages:', error);
                this.populateLanguageSelect(this.getDefaultLanguages());
                this.updateBackendStatus('Connection error', false);
            }
            
            // Load translation languages with fallback
            console.log('Attempting to load translation languages...');
            try {
                const transLangs = await this.api.getTranslationLanguages();
                console.log('Translation languages received:', transLangs);
                this.populateTranslationSelect(transLangs.languages || this.getDefaultLanguages());
            } catch (error) {
                console.error('Error loading translation languages:', error);
                this.populateTranslationSelect(this.getDefaultLanguages());
            }
            
            // Load model info
            console.log('Attempting to load model info...');
            try {
                const model = await this.api.getModelInfo();
                console.log('Received model info from API:', model);
                this.updateModelStatus(model.model_info);
                this.updateBackendStatus('Transcribe service ready', true);
            } catch (error) {
                console.error('Error fetching model info:', error);
                this.updateModelStatus({ status: 'error', message: 'Backend not connected' });
                this.updateBackendStatus('Error', false);
            }
            
            console.log('loadInitialData() finished successfully.');
        } catch (error) {
            console.error('Error in loadInitialData:', error);
            this.updateBackendStatus('Error loading', false);
        }
    }

    /**
     * Default language list
     */
    getDefaultLanguages() {
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
    }

    /**
     * Populate language selects with consistent formatting
     */
    populateLanguageSelect() {
        const select = this.elements.languageSelect;
        if (!select) return;
        
        // Create source language select with flag + name format
        const langSelect = new LanguageSelect('source', 'flag-name');
        select.parentNode.replaceChild(langSelect.element, select);
        this.elements.languageSelect = langSelect.element;
    }

    populateTranslationSelect() {
        const select = this.elements.translateToSelect;
        if (!select) return;
        
        // Create target language select with flag + name format (consistent with source)
        const langSelect = new LanguageSelect('target', 'flag-name');
        select.parentNode.replaceChild(langSelect.element, select);
        this.elements.translateToSelect = langSelect.element;
    }

    /**
     * Handle file selection
     */
    async handleFileSelect(file) {
        if (!file) return;
        
        const validation = this.audioHandler.validateFile(file);
        if (!validation.isValid) {
            this.showError(validation.errors.join('\n'));
            return;
        }
        
        this.state.currentFile = file;
        await this.showFilePreview(file);
        this.showOptions();
    }

    /**
     * Show file preview
     */
    async showFilePreview(file) {
        try {
            const metadata = await this.audioHandler.getAudioMetadata(file);
            
            this.elements.fileName && (this.elements.fileName.textContent = metadata.name);
            this.elements.fileSize && (this.elements.fileSize.textContent = metadata.formattedSize);
            
            // Audio preview
            if (this.elements.audioPreview) {
                try {
                    const preview = await this.audioHandler.createAudioPreview(file);
                    this.elements.audioPreview.src = preview.url;
                } catch (error) {
                    console.warn('Audio preview failed:', error);
                }
            }
            
            this.elements.filePreview && (this.elements.filePreview.style.display = 'block');
            this.elements.uploadArea && (this.elements.uploadArea.style.display = 'none');
            
        } catch (error) {
            this.showError('Failed to preview file');
        }
    }

    /**
     * Show/hide options
     */
    showOptions() {
        this.elements.options && (this.elements.options.style.display = 'grid');
        this.elements.transcribeBtn && (this.elements.transcribeBtn.disabled = !this.state.currentFile);
    }

    /**
     * Remove current file
     */
    removeCurrentFile() {
        this.state.currentFile = null;
        
        const elements = ['filePreview', 'options'];
        elements.forEach(id => {
            this.elements[id] && (this.elements[id].style.display = 'none');
        });
        
        this.elements.uploadArea && (this.elements.uploadArea.style.display = 'block');
        this.elements.fileInput && (this.elements.fileInput.value = '');
        this.elements.transcribeBtn && (this.elements.transcribeBtn.disabled = true);
        
        // Cleanup audio preview
        if (this.elements.audioPreview?.src) {
            URL.revokeObjectURL(this.elements.audioPreview.src);
            this.elements.audioPreview.src = '';
        }
    }

    /**
     * Start transcription
     */
    async startTranscription() {
        if (!this.state.currentFile || this.state.isProcessing) return;
        
        this.state.isProcessing = true;
        this.elements.transcribeBtn.disabled = true;
        this.showProgress();
        
        try {
            const language = this.elements.languageSelect?.value || '';
            const task = this.elements.taskSelect?.value || 'transcribe';
            const targetLanguage = this.elements.translateToSelect?.value || 'en';
            
            this.updateProgress(0, 'Processing...');
            
            if (task === 'translate') {
                // Two-step: transcribe then translate
                this.updateProgress(25, 'Transcribing...');
                const transcribeResult = await this.api.transcribeAudio(this.state.currentFile, language, 'transcribe');
                
                this.updateProgress(50, 'Translating...');
                const translateResult = await this.api.translateText(transcribeResult.result.text, targetLanguage);
                
                const result = {
                    ...transcribeResult.result,
                    text: translateResult.result.translated_text,
                    original_text: transcribeResult.result.text,
                    target_language: targetLanguage,
                    task: 'translate'
                };
                
                this.updateProgress(100, 'Complete!');
                setTimeout(() => this.showResults(result), 500);
                
            } else {
                // Direct Whisper processing
                const whisperTask = task === 'whisper_translate' ? 'translate' : 'transcribe';
                const result = await this.api.transcribeAudio(this.state.currentFile, language, whisperTask, targetLanguage);
                
                this.updateProgress(100, 'Complete!');
                setTimeout(() => this.showResults(result.result || result), 500);
            }
            
        } catch (error) {
            console.error('Transcription failed:', error);
            this.showError(`Transcription failed: ${error.message}`);
            this.hideProgress();
        } finally {
            this.state.isProcessing = false;
            this.elements.transcribeBtn.disabled = false;
        }
    }

    /**
     * Progress management
     */
    showProgress() {
        this.elements.progressSection && (this.elements.progressSection.style.display = 'block');
        this.elements.options && (this.elements.options.style.display = 'none');
    }

    updateProgress(percent, text) {
        this.elements.progressFill && (this.elements.progressFill.style.width = `${percent}%`);
        this.elements.progressText && (this.elements.progressText.textContent = text);
    }

    hideProgress() {
        this.elements.progressSection && (this.elements.progressSection.style.display = 'none');
        this.showOptions();
    }

    /**
     * Show results
     */
    showResults(result) {
        console.log('showResults called with:', result);
        this.state.currentTranscription = result.text || '';
        console.log('Current transcription set to:', this.state.currentTranscription);
        console.log('TTS available:', this.state.ttsAvailable);
        
        this.elements.resultText && (this.elements.resultText.textContent = result.text || '');
        this.elements.detectedLanguage && (this.elements.detectedLanguage.textContent = result.language || 'unknown');
        this.elements.modelInfo && (this.elements.modelInfo.textContent = result.model_size || 'Unknown');
        
        // Task info
        if (this.elements.taskInfo) {
            const task = result.task || this.elements.taskSelect?.value || 'transcribe';
            this.elements.taskInfo.textContent = task === 'translate' ? 'Translated' : 'Transcribed';
        }
        
        // Show sections
        this.elements.resultsSection && (this.elements.resultsSection.style.display = 'block');
        this.elements.progressSection && (this.elements.progressSection.style.display = 'none');
        this.elements.quickActions && (this.elements.quickActions.style.display = 'block');
        
        // Show TTS button if TTS is available and we have transcription text
        console.log('Checking TTS button visibility conditions:');
        console.log('  - TTS available:', this.state.ttsAvailable);
        console.log('  - Result text:', !!result.text);
        console.log('  - Button element:', !!this.elements.speakTranscriptBtn);
        
        if (this.state.ttsAvailable && result.text && this.elements.speakTranscriptBtn) {
            console.log('Showing TTS button');
            this.elements.speakTranscriptBtn.style.display = 'block';
        } else {
            console.log('Not showing TTS button');
        }
        
        this.elements.resultsSection?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Result actions
     */
    async copyResults() {
        const text = this.elements.resultText?.textContent;
        if (!text) return;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard');
        } catch {
            this.showError('Failed to copy');
        }
    }

    downloadResults() {
        const text = this.elements.resultText?.textContent;
        if (!text) return;
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `transcription_${Date.now()}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Downloaded');
    }

    /**
     * Reset application
     */
    resetApp() {
        this.removeCurrentFile();
        
        const hideElements = ['resultsSection', 'progressSection', 'ttsSection', 'quickActions'];
        hideElements.forEach(id => {
            this.elements[id] && (this.elements[id].style.display = 'none');
        });
        
        this.state.currentTranscription = '';
        this.ttsService.cleanupCurrent();
        this.elements.ttsResults && (this.elements.ttsResults.innerHTML = '');
        this.updateStatus('Ready');
    }

    /**
     * Task change handler
     */
    handleTaskChange() {
        const task = this.elements.taskSelect?.value;
        const showTranslate = task === 'translate' || task === 'whisper_translate';
        
        this.elements.translateToGroup && (this.elements.translateToGroup.style.display = showTranslate ? 'block' : 'none');
        
        if (task === 'whisper_translate' && this.elements.translateToSelect) {
            this.elements.translateToSelect.value = 'en';
        }
    }

    /**
     * TTS functionality
     */
    async initializeTTS() {
        try {
            console.log('Initializing TTS service...');
            this.updateTTSStatus('Connecting...', null);
            
            const available = await this.ttsService.testConnection();
            console.log('TTS connection test result:', available);
            
            if (available) {
                console.log('TTS service is available');
                this.updateTTSStatus('Text to speech service ready', true);
                this.state.ttsAvailable = true;
                console.log('TTS state set to available:', this.state.ttsAvailable);
            } else {
                console.log('TTS service is not available');
                this.updateTTSStatus('Unavailable', false);
                this.elements.speakTranscriptBtn && (this.elements.speakTranscriptBtn.style.display = 'none');
                this.state.ttsAvailable = false;
            }
        } catch (error) {
            console.error('TTS initialization failed:', error);
            this.updateTTSStatus('Error', false);
            this.elements.speakTranscriptBtn && (this.elements.speakTranscriptBtn.style.display = 'none');
            this.state.ttsAvailable = false;
        }
    }

    async speakTranscript() {
        if (!this.state.currentTranscription) {
            this.showError('No transcript to speak');
            return;
        }

        try {
            this.updateStatus('Converting to speech...');
            await this.ttsService.cleanupCurrent();
            
            const result = await this.ttsService.synthesize(this.state.currentTranscription);
            this.state.currentAudioId = result.audio_id || result.id;
            
            this.displayTTSAudio(this.state.currentAudioId);
            this.elements.ttsSection && (this.elements.ttsSection.style.display = 'block');
            
            this.showToast('Speech generated!');
            
        } catch (error) {
            this.showError('TTS failed: ' + error.message);
        }
    }

    displayTTSAudio(audioId) {
        const directLink = `${this.ttsService.baseUrl}/download/${audioId}`;
        
        if (this.elements.ttsResults) {
            this.elements.ttsResults.innerHTML = `
                <div class="tts-audio-player">
                    <h4>🎵 Generated Speech</h4>
                    <audio controls autoplay style="width: 100%;">
                        <source src="${directLink}" type="audio/mpeg">
                    </audio>
                    <div class="tts-actions">
                        <button onclick="app.downloadTTSAudio('${audioId}')" class="btn">📥 Download</button>
                        <button onclick="app.clearTTSAudio()" class="btn">🗑️ Clear</button>
                    </div>
                </div>
            `;
        }
    }

    async downloadTTSAudio(audioId) {
        try {
            const url = `${this.ttsService.baseUrl}/download/${audioId}`;
            const link = document.createElement('a');
            link.href = url;
            link.download = `speech-${audioId}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('Download started');
        } catch (error) {
            this.showError('Download failed: ' + error.message);
        }
    }

    async clearTTSAudio() {
        try {
            if (this.state.currentAudioId) {
                await this.ttsService.cleanup(this.state.currentAudioId);
                this.state.currentAudioId = null;
            }
            this.elements.ttsSection && (this.elements.ttsSection.style.display = 'none');
            this.elements.ttsResults && (this.elements.ttsResults.innerHTML = '');
            this.showToast('Audio cleared');
        } catch (error) {
            console.error('Failed to clear TTS audio:', error);
            // Still hide the section even if cleanup fails
            this.elements.ttsSection && (this.elements.ttsSection.style.display = 'none');
            this.elements.ttsResults && (this.elements.ttsResults.innerHTML = '');
        }
    }

    /**
     * UI utilities
     */
    updateStatus(text) {
        this.elements.statusText && (this.elements.statusText.textContent = text);
    }

    updateBackendStatus(text, isHealthy = null) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = text;
        }
        if (this.elements.statusIndicator) {
            if (isHealthy === true) {
                this.elements.statusIndicator.textContent = '✅';
                this.elements.statusIndicator.className = 'status-indicator healthy';
            } else if (isHealthy === false) {
                this.elements.statusIndicator.textContent = '❌';
                this.elements.statusIndicator.className = 'status-indicator error';
            } else {
                this.elements.statusIndicator.textContent = '🔄';
                this.elements.statusIndicator.className = 'status-indicator checking';
            }
        }
    }

    updateTTSStatus(text, isHealthy = null) {
        if (this.elements.ttsStatusText) {
            this.elements.ttsStatusText.textContent = text;
        }
        if (this.elements.ttsStatusIndicator) {
            if (isHealthy === true) {
                this.elements.ttsStatusIndicator.textContent = '✅';
                this.elements.ttsStatusIndicator.className = 'status-indicator healthy';
            } else if (isHealthy === false) {
                this.elements.ttsStatusIndicator.textContent = '❌';
                this.elements.ttsStatusIndicator.className = 'status-indicator error';
            } else {
                this.elements.ttsStatusIndicator.textContent = '🔄';
                this.elements.ttsStatusIndicator.className = 'status-indicator checking';
            }
        }
    }

    updateModelStatus(info) {
        if (!this.elements.modelStatus) return;
        
        if (info.status === 'error') {
            this.elements.modelStatus.textContent = info.message || 'Error';
            this.elements.modelStatus.className = 'model-status error';
        } else {
            this.elements.modelStatus.textContent = `Model: ${info.model_size || 'Unknown'}`;
            this.elements.modelStatus.className = 'model-status success';
        }
    }

    showError(message) {
        this.elements.errorMessage && (this.elements.errorMessage.textContent = message);
        this.elements.errorModal && (this.elements.errorModal.style.display = 'flex');
    }

    hideError() {
        this.elements.errorModal && (this.elements.errorModal.style.display = 'none');
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

// Initialize app
window.app = new WhisperApp();