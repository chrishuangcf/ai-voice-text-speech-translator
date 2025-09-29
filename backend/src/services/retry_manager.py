"""Retry logic for translation service"""
import time
from typing import Callable, Any
from .errors import TranslationError

def with_retry(
    func: Callable[..., Any],
    max_retries: int = 3,
    delay: float = 1.0,
    exceptions: tuple = (TranslationError,)
) -> Callable[..., Any]:
    """Decorator to retry a function on failure"""
    def wrapper(*args, **kwargs):
        last_error = None
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except exceptions as e:
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep(delay)
        raise last_error
    return wrapper
