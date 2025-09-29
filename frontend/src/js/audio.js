/**
 * Enhanced Audio handling utilities with better error handling
 */
class AudioHandler {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.supportedTypes = [
            'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a',
            'audio/ogg', 'audio/flac', 'audio/webm'
        ];
        this.supportedExtensions = ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.flac', '.webm'];
        this.objectUrls = new Set(); // Track URLs for cleanup
    }

    /**
     * Enhanced file validation with detailed error messages
     */
    validateFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        // File size check
        if (file.size > this.maxFileSize) {
            errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum limit of ${this.formatFileSize(this.maxFileSize)}`);
        }

        // Type validation
        const isValidType = this.supportedTypes.includes(file.type) || this.isValidExtension(file.name);
        if (!isValidType) {
            errors.push(`Unsupported file type: ${file.type || 'unknown'}. Supported formats: ${this.supportedExtensions.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Enhanced audio preview with better error handling
     */
    async createAudioPreview(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const audio = document.createElement('audio');
            const url = URL.createObjectURL(file);
            
            // Track URL for cleanup
            this.objectUrls.add(url);
            
            audio.src = url;
            audio.controls = true;
            audio.style.width = '100%';
            audio.preload = 'metadata';

            const cleanup = () => {
                audio.removeEventListener('loadedmetadata', handleLoad);
                audio.removeEventListener('error', handleError);
                clearTimeout(timeoutId);
            };

            const handleLoad = () => {
                cleanup();
                resolve({
                    element: audio,
                    duration: audio.duration || 0,
                    url: url
                });
            };

            const handleError = (event) => {
                cleanup();
                URL.revokeObjectURL(url);
                this.objectUrls.delete(url);
                reject(new Error(`Failed to load audio file: ${event.message || 'Unknown error'}`));
            };

            // Set timeout to prevent hanging
            const timeoutId = setTimeout(() => {
                if (audio.readyState === 0) {
                    handleError(new Error('Audio loading timeout'));
                }
            }, 10000); // 10 second timeout

            audio.addEventListener('loadedmetadata', handleLoad);
            audio.addEventListener('error', handleError);
        });
    }

    /**
     * Enhanced metadata extraction with fallbacks
     */
    async getAudioMetadata(file) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            let duration = 0;
            let preview = null;

            try {
                preview = await this.createAudioPreview(file);
                duration = preview.duration;
            } catch (previewError) {
                console.warn('Failed to create preview for metadata:', previewError.message);
            }

            return {
                name: file.name,
                size: file.size,
                type: file.type || 'unknown',
                duration: duration,
                formattedSize: this.formatFileSize(file.size),
                formattedDuration: this.formatDuration(duration),
                hasPreview: !!preview
            };
        } catch (error) {
            console.error('Failed to extract audio metadata:', error);
            return {
                name: file.name || 'Unknown',
                size: file.size || 0,
                type: file.type || 'Unknown',
                formattedSize: this.formatFileSize(file.size || 0),
                error: error.message
            };
        }
    }

    /**
     * Cleanup all object URLs
     */
    cleanup() {
        this.objectUrls.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.objectUrls.clear();
    }

    /**
     * Check file extension as fallback
     */
    isValidExtension(filename) {
        const validExtensions = ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.flac', '.webm'];
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return validExtensions.includes(extension);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format duration for display
     */
    formatDuration(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) {
            return '0:00';
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Export for use in other files
window.AudioHandler = AudioHandler;

// Enhanced file input handler with TTS integration
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const audioPreview = document.getElementById('audioPreview');
    const audioHandler = new AudioHandler();

    // Only add event listeners if elements exist
    if (fileInput && audioHandler) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const { isValid, errors } = audioHandler.validateFile(file);

                if (isValid) {
                    if (audioPreview) {
                        const url = URL.createObjectURL(file);
                        audioPreview.src = url;
                        audioPreview.style.display = 'block';
                    }
                    
                    // Show file info
                    displayFileInfo(file, audioHandler);
                } else {
                    console.error('Audio validation errors:', errors);
                    alert(errors.join('\n'));
                }
            }
        });
    }

    // Helper function to display file information
    function displayFileInfo(file, handler) {
        handler.getAudioMetadata(file).then(metadata => {
            const fileInfoElement = document.getElementById('fileInfo');
            if (fileInfoElement) {
                fileInfoElement.innerHTML = `
                    <div class="file-metadata">
                        <h4>📁 File Information:</h4>
                        <p><strong>Name:</strong> ${metadata.name}</p>
                        <p><strong>Size:</strong> ${metadata.formattedSize}</p>
                        <p><strong>Type:</strong> ${metadata.type}</p>
                        ${metadata.formattedDuration ? `<p><strong>Duration:</strong> ${metadata.formattedDuration}</p>` : ''}
                        ${metadata.error ? `<p class="error"><strong>Note:</strong> ${metadata.error}</p>` : ''}
                    </div>
                `;
            }
        });
    }
});

// Export for use in other files
export default AudioHandler;