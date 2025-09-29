"""Language management for translation service"""
from typing import Dict, Optional
from .constants import LANGUAGE_NAMES

def validate_language_code(language_code: str) -> bool:
    """Validate if language code is supported"""
    return language_code in LANGUAGE_NAMES

def get_language_name(language_code: str) -> Optional[str]:
    """Get full language name from code"""
    return LANGUAGE_NAMES.get(language_code)

def get_available_languages() -> Dict[str, str]:
    """Get all available languages"""
    return LANGUAGE_NAMES
