// Add this to your frontend JavaScript
class TTSService {
    constructor(baseUrl = null) {
        // Determine base URL based on environment (similar to WhisperAPI)
        const hostname = window.location.hostname;
        if (baseUrl) {
            this.baseUrl = baseUrl;
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.baseUrl = `http://${hostname}:7000`;
        } else {
            this.baseUrl = `http://tts-service:7000`;
        }
        
        this.currentAudioId = null;
        console.log('TTSService initialized with baseUrl:', this.baseUrl);
    }

    async testConnection() {
        try {
            console.log('Testing TTS connection to:', this.baseUrl);
            const response = await fetch(`${this.baseUrl}/health`);
            console.log('TTS health response status:', response.status);
            const result = response.ok;
            console.log('TTS connection test result:', result);
            return result;
        } catch (error) {
            console.error('TTS connection test failed:', error);
            return false;
        }
    }

    async synthesize(text, voice = null) {
        return this.synthesizeText(text, voice);
    }

    async cleanupCurrent() {
        if (this.currentAudioId) {
            try {
                await this.cleanup(this.currentAudioId);
                this.currentAudioId = null;
            } catch (error) {
                console.error('Failed to cleanup current audio:', error);
            }
        }
    }

    async getVoices() {
        try {
            const response = await fetch(`${this.baseUrl}/voices`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching voices:', error);
            throw error;
        }
    }

    async synthesizeText(text, voice = null) {
        try {
            const response = await fetch(`${this.baseUrl}/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voice })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error synthesizing text:', error);
            throw error;
        }
    }

    getDownloadUrl(audioId) {
        return `${this.baseUrl}/download/${audioId}`;
    }

    async playAudio(audioId) {
        try {
            const audioUrl = this.getDownloadUrl(audioId);
            const audio = new Audio(audioUrl);
            await audio.play();
            return audio;
        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }

    async cleanup(audioId) {
        try {
            const response = await fetch(`${this.baseUrl}/cleanup/${audioId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error cleaning up audio:', error);
            throw error;
        }
    }
}

// Usage example
const tts = new TTSService();

// Add TTS button to your UI
function addTTSButton(text) {
    const button = document.createElement('button');
    button.textContent = '🔊 Speak';
    button.onclick = async () => {
        try {
            const result = await tts.synthesizeText(text);
            await tts.playAudio(result.audio_id);
            // Optional: cleanup after playing
            setTimeout(() => tts.cleanup(result.audio_id), 5000);
        } catch (error) {
            console.error('TTS Error:', error);
            alert('Error generating speech');
        }
    };
    return button;
}

export default TTSService;