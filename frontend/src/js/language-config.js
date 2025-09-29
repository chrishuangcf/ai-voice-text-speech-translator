// Updated backend language configuration
class WhisperTTSService:
    # Languages supported by both Whisper and TTS
    WHISPER_TTS_LANGUAGES = {
        # Tier 1: Premium Support (Neural TTS + Full Whisper)
        'en': {'whisper': 'english', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'es': {'whisper': 'spanish', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'fr': {'whisper': 'french', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'de': {'whisper': 'german', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'it': {'whisper': 'italian', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'pt': {'whisper': 'portuguese', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'ru': {'whisper': 'russian', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'ja': {'whisper': 'japanese', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'ko': {'whisper': 'korean', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        'zh': {'whisper': 'chinese', 'tts': True, 'quality': 'premium', 'voices': ['neural', 'standard']},
        
        # Tier 2: High Quality Support (Neural TTS + Full Whisper)
        'hi': {'whisper': 'hindi', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'ar': {'whisper': 'arabic', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'tr': {'whisper': 'turkish', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'nl': {'whisper': 'dutch', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'pl': {'whisper': 'polish', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'sv': {'whisper': 'swedish', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'da': {'whisper': 'danish', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'no': {'whisper': 'norwegian', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'fi': {'whisper': 'finnish', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        'th': {'whisper': 'thai', 'tts': True, 'quality': 'high', 'voices': ['neural']},
        
        # Tier 3: Standard Support (Standard TTS + Full Whisper)
        'uk': {'whisper': 'ukrainian', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'cs': {'whisper': 'czech', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'he': {'whisper': 'hebrew', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'hu': {'whisper': 'hungarian', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'ro': {'whisper': 'romanian', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'sk': {'whisper': 'slovak', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'bg': {'whisper': 'bulgarian', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'hr': {'whisper': 'croatian', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'ca': {'whisper': 'catalan', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'vi': {'whisper': 'vietnamese', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'id': {'whisper': 'indonesian', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'ms': {'whisper': 'malay', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'tl': {'whisper': 'filipino', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'bn': {'whisper': 'bengali', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'ta': {'whisper': 'tamil', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'te': {'whisper': 'telugu', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'mr': {'whisper': 'marathi', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
        'gu': {'whisper': 'gujarati', 'tts': True, 'quality': 'standard', 'voices': ['standard']},
    }
    
    def get_supported_languages(self, include_tts_only=False):
        """Get languages supported by both Whisper and TTS"""
        if include_tts_only:
            return {k: v for k, v in self.WHISPER_TTS_LANGUAGES.items() if v['tts']}
        return self.WHISPER_TTS_LANGUAGES
    
    def validate_language_support(self, language_code, require_tts=False):
        """Validate if language is supported for transcription and/or TTS"""
        if not language_code:
            return True  # Auto-detect is always valid
        
        lang_info = self.WHISPER_TTS_LANGUAGES.get(language_code)
        if not lang_info:
            raise ValueError(f"Language {language_code} not supported")
        
        if require_tts and not lang_info['tts']:
            raise ValueError(f"TTS not supported for language {language_code}")
        
        return True

# API endpoint for TTS
@router.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    language: str = Form(...),
    voice_type: str = Form("standard"),
    quality: str = Form("standard")
):
    """
    Convert text to speech with language-specific optimization
    """
    whisper_tts = WhisperTTSService()
    
    # Validate language supports TTS
    whisper_tts.validate_language_support(language, require_tts=True)
    
    lang_info = whisper_tts.WHISPER_TTS_LANGUAGES[language]
    
    # Check if requested voice type is available
    if voice_type not in lang_info['voices']:
        voice_type = lang_info['voices'][0]  # Use first available
    
    # Generate speech based on quality tier
    if lang_info['quality'] == 'premium' and voice_type == 'neural':
        audio_data = await generate_neural_speech(text, language)
    else:
        audio_data = await generate_standard_speech(text, language)
    
    return StreamingResponse(
        io.BytesIO(audio_data),
        media_type="audio/wav",
        headers={"Content-Disposition": "attachment; filename=speech.wav"}
    )

@router.get("/languages/supported")
async def get_supported_languages():
    """Get complete language support matrix"""
    whisper_tts = WhisperTTSService()
    languages = whisper_tts.get_supported_languages()
    
    return {
        "languages": [
            {
                "code": code,
                "whisper_support": True,
                "tts_support": info['tts'],
                "quality": info['quality'],
                "voices": info['voices']
            }
            for code, info in languages.items()
        ],
        "total_languages": len(languages),
        "tts_languages": len([l for l in languages.values() if l['tts']]),
        "quality_tiers": {
            "premium": len([l for l in languages.values() if l['quality'] == 'premium']),
            "high": len([l for l in languages.values() if l['quality'] == 'high']),
            "standard": len([l for l in languages.values() if l['quality'] == 'standard'])
        }
    }