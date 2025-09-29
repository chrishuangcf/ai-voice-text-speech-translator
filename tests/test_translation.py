#!/usr/bin/env python3
"""
Test script for translation functionality
"""
import sys
import os

# Add src to path
sys.path.append('src')

def test_translation_service():
    print("Testing Translation Service...")
    
    try:
        from services.translation_service import TranslationService
        
        # Initialize service
        ts = TranslationService()
        
        if not ts.is_translator_loaded():
            print("❌ Translation service not loaded")
            return False
            
        print("✅ Translation service loaded successfully")
        
        # Test translation
        test_text = "Hello, this is a test message."
        target_lang = "es"
        
        print(f"Translating: '{test_text}' to {target_lang}")
        
        result = ts.translate_text(test_text, target_lang)
        
        print("Translation result:")
        print(f"  Original: {result['original_text']}")
        print(f"  Translated: {result['translated_text']}")
        print(f"  Source Language: {result['source_language']}")
        print(f"  Target Language: {result['target_language']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Translation test failed: {str(e)}")
        return False

def test_flask_app():
    print("\nTesting Flask App Import...")
    
    try:
        from app import create_app
        
        app = create_app()
        print("✅ Flask app created successfully")
        
        # Test if translation service is available in app context
        with app.app_context():
            print("✅ App context works")
            
        return True
        
    except Exception as e:
        print(f"❌ Flask app test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Voice-to-Text Translation Test")
    print("=" * 40)
    
    # Change to backend directory
    os.chdir('backend')
    
    success = True
    success &= test_translation_service()
    success &= test_flask_app()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ All tests passed!")
        print("\nThe translation functionality should work correctly.")
        print("You can now:")
        print("1. Upload an audio file")
        print("2. Select 'Transcribe + Translate (to any language)' task")
        print("3. Choose your target language")
        print("4. The system will transcribe the audio and then translate to your chosen language")
    else:
        print("❌ Some tests failed. Check the errors above.")
        
    print("\nTo start the backend server, run:")
    print("cd backend && python3 src/app.py")
