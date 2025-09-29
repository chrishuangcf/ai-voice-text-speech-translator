"""Custom exceptions for translation service"""
class TranslationError(Exception):
    """Base exception for translation errors"""
    pass

class ServiceNotLoadedError(TranslationError):
    """Exception raised when translation service is not loaded"""
    pass

class InvalidInputError(TranslationError):
    """Exception raised for invalid input parameters"""
    pass
