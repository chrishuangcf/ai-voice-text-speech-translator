/**
 * Simplified TTS Service
 */
class TTSService {
    constructor() {
        this.baseURL = 'http://localhost:7000';
        this.currentAudioId = null;
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`, { 
                signal: AbortSignal.timeout(3000) 
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async synthesize(text, voice = 'en-US-gtts') {
        const response = await fetch(`${this.baseURL}/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text.trim(), voice }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`TTS failed: ${response.status}`);
        }

        const result = await response.json();
        this.currentAudioId = result.audio_id || result.id;
        return result;
    }

    async downloadToFile(audioId, filename) {
        const response = await fetch(`${this.baseURL}/download/${audioId}`);
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    async cleanupCurrent() {
        if (!this.currentAudioId) return;
        
        try {
            await fetch(`${this.baseURL}/cleanup/${this.currentAudioId}`, { 
                method: 'DELETE' 
            });
        } catch {
            // Ignore cleanup errors
        }
        
        this.currentAudioId = null;
    }
}

// Create global TTS service instance
window.ttsService = new TTSService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add any initialization code if needed
});