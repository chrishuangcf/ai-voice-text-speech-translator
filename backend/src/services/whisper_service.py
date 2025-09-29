"""
Simple Whisper service for voice-to-text transcription
"""
import os
import logging

logger = logging.getLogger(__name__)


class SimpleWhisperService:
    """Simple Whisper service"""
    
    def __init__(self, model_size: str = None):
        self.model_size = model_size or os.getenv('WHISPER_MODEL_SIZE', 'small')
        self.model = None
        self.device = "cpu"
        self.is_loading = False
        self._load_model()
    
    def _load_model(self):
        """Load the Whisper model"""
        if self.is_loading:
            logger.info("Model is already loading, skipping...")
            return
            
        self.is_loading = True
        try:
            logger.info(f"Attempting to load Whisper model '{self.model_size}' on CPU")
            
            import whisper
            
            # Force CPU usage
            os.environ['CUDA_VISIBLE_DEVICES'] = ''
            
            self.model = whisper.load_model(self.model_size, device="cpu")
            logger.info(f"Whisper model '{self.model_size}' loaded successfully")
            
        except ImportError as e:
            logger.error(f"Whisper not installed: {str(e)}")
            self.model = None
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {str(e)}")
            self.model = None
        finally:
            self.is_loading = False
    
    def is_model_loaded(self):
        """Check if model is loaded"""
        return self.model is not None and not self.is_loading
    
    def transcribe_audio(self, audio_path, language=None, task="transcribe"):
        """Transcribe audio file"""
        if not self.is_model_loaded():
            raise Exception("Whisper model is not loaded")
        
        if not os.path.exists(audio_path):
            raise Exception(f"Audio file not found: {audio_path}")
        
        try:
            logger.info(f"Transcribing audio file: {audio_path}")
            
            options = {"task": task, "fp16": False}
            if language:
                options["language"] = language
            
            result = self.model.transcribe(audio_path, **options)
            
            response = {
                "text": result["text"].strip(),
                "language": result.get("language", "unknown"),
                "model_size": self.model_size,
                "segments": []
            }
            
            if "segments" in result:
                response["segments"] = [
                    {
                        "start": segment["start"],
                        "end": segment["end"],
                        "text": segment["text"].strip()
                    }
                    for segment in result["segments"]
                ]
            
            logger.info(f"Transcription completed. Language: {response['language']}")
            return response
            
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise Exception(f"Transcription failed: {str(e)}")
    
    def get_supported_languages(self):
        """Get supported languages"""
        if not self.is_model_loaded():
            return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi']
        
        try:
            import whisper
            return list(whisper.tokenizer.LANGUAGES.keys())
        except Exception:
            return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi']
    
    def get_model_info(self):
        """Get model info"""
        return {
            "model_size": self.model_size,
            "device": self.device,
            "status": "loaded" if self.is_model_loaded() else ("loading" if self.is_loading else "not_loaded"),
            "cuda_available": False,
            "mps_available": False
        }
