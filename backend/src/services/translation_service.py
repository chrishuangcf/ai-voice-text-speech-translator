"""
Translation service using Google Translate
"""
import logging
from typing import Dict, Any, List, Optional
import time

logger = logging.getLogger(__name__)

# Constants
SERVICE_NOT_LOADED_MSG = "Translation service is not loaded"
NO_TEXT_PROVIDED_MSG = "No text provided"
TRANSLATION_FAILED_MSG = "Translation failed"

class TranslationError(Exception):
    """Custom exception for translation errors"""
    pass

class ServiceNotLoadedError(TranslationError):
    """Exception raised when translation service is not loaded"""
    pass

class InvalidInputError(TranslationError):
    """Exception raised for invalid input parameters"""
    pass

class TranslationService:
    """Service for handling text translation using Google Translate"""
    
    def __init__(self):
        """Initialize translation service"""
        self.translator = None
        self._load_translator()
        
        # Language codes mapping for better user experience
        self.language_names = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
            'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
            'nl': 'Dutch', 'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish',
            'fi': 'Finnish', 'pl': 'Polish', 'tr': 'Turkish', 'he': 'Hebrew'
        }
    
    def _load_translator(self):
        """Load the Google Translate service"""
        try:
            from googletrans import Translator  # pylint: disable=import-outside-toplevel
            self.translator = Translator()
            logger.info("Google Translate service loaded successfully")
        except ImportError as e:
            logger.error(f"googletrans not installed: {str(e)}")
            self.translator = None
        except Exception as e:
            logger.error(f"Failed to load translation service: {str(e)}")
            self.translator = None
    
    def is_translator_loaded(self) -> bool:
        """Check if translator is loaded and ready"""
        return self.translator is not None
    
    def _validate_translation_input(self, text: str, target_language: str):
        """Validate input parameters for translation"""
        if not self.is_translator_loaded():
            raise ServiceNotLoadedError(SERVICE_NOT_LOADED_MSG)
        
        if not text or not text.strip():
            raise InvalidInputError(f"{NO_TEXT_PROVIDED_MSG} for translation")
        
        if not target_language:
            raise InvalidInputError("Target language not specified")
    
    def _perform_translation_with_retry(self, text: str, target_language: str, source_language: Optional[str] = None):
        """Perform translation with retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if source_language:
                    return self.translator.translate(text, dest=target_language, src=source_language)
                return self.translator.translate(text, dest=target_language)
            except Exception as e:
                if self._is_rate_limit_error(e) and attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limit hit, retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                raise e
    
    def _is_rate_limit_error(self, error: Exception) -> bool:
        """Check if error is due to rate limiting"""
        return "too many requests" in str(error).lower()
    
    def translate_text(self, text: str, target_language: str, source_language: Optional[str] = None) -> Dict[str, Any]:
        """Translate text to target language"""
        try:
            self._validate_translation_input(text, target_language)
            
            logger.info(f"Translating text to '{target_language}' from '{source_language or 'auto-detect'}'")
            
            result = self._perform_translation_with_retry(text, target_language, source_language)
            
            response = {
                "original_text": text,
                "translated_text": result.text,
                "source_language": result.src,
                "target_language": target_language,
                "source_language_name": self.language_names.get(result.src, result.src),
                "target_language_name": self.language_names.get(target_language, target_language),
                "confidence": getattr(result, 'confidence', None)
            }
            
            logger.info(f"Translation completed successfully. {result.src} -> {target_language}")
            return response
            
        except (ServiceNotLoadedError, InvalidInputError):
            raise
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            raise TranslationError(f"{TRANSLATION_FAILED_MSG}: {str(e)}") from e
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes for translation"""
        if not self.is_translator_loaded():
            return list(self.language_names.keys())
        
        try:
            from googletrans import LANGUAGES  # pylint: disable=import-outside-toplevel
            return list(LANGUAGES.keys())
        except Exception as e:
            logger.error(f"Failed to get supported languages: {str(e)}")
            return list(self.language_names.keys())
    
    def get_language_name(self, language_code: str) -> str:
        """Get human-readable language name from code"""
        return self.language_names.get(language_code, language_code)
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect the language of given text"""
        try:
            if not self.is_translator_loaded():
                raise ServiceNotLoadedError(SERVICE_NOT_LOADED_MSG)
            
            if not text or not text.strip():
                raise InvalidInputError(f"{NO_TEXT_PROVIDED_MSG} for language detection")
            
            logger.info("Detecting language of provided text")
            
            detected = self.translator.detect(text)
            
            response = {
                "language": detected.lang,
                "language_name": self.language_names.get(detected.lang, detected.lang),
                "confidence": detected.confidence
            }
            
            logger.info(f"Language detected: {detected.lang} (confidence: {detected.confidence})")
            return response
            
        except (ServiceNotLoadedError, InvalidInputError):
            raise
        except Exception as e:
            logger.error(f"Language detection failed: {str(e)}")
            raise TranslationError(f"Language detection failed: {str(e)}") from e
