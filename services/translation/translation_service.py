from google.cloud import translate
import os
from typing import Optional

class TranslationService:
    def __init__(self):
        """
        Initialize the translation service with Google Cloud Translation
        """
        self.client = translate.TranslationServiceClient()
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        self.parent = f"projects/{self.project_id}"

    async def translate(
        self,
        text: str,
        target_language: str = "en",
        source_language: Optional[str] = None
    ) -> dict:
        """
        Translate text to target language
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'en', 'es')
            source_language: Source language code (optional)
            
        Returns:
            Dictionary containing translated text and detected language
        """
        try:
            # Create translation request
            request = {
                "parent": self.parent,
                "contents": [text],
                "target_language_code": target_language,
            }
            
            # Add source language if provided
            if source_language:
                request["source_language_code"] = source_language

            # Perform translation
            response = self.client.translate_text(request=request)
            
            # Extract translation
            translation = response.translations[0]
            
            return {
                "translated_text": translation.translated_text,
                "detected_language": translation.detected_language_code,
                "source_language": source_language or translation.detected_language_code,
                "target_language": target_language
            }
            
        except Exception as e:
            raise Exception(f"Translation failed: {str(e)}")

    async def detect_language(self, text: str) -> dict:
        """
        Detect the language of the text
        
        Args:
            text: Text to detect language for
            
        Returns:
            Dictionary containing language code and confidence
        """
        try:
            # Create translation request with target language same as source
            # This is a workaround since the detect_language API is not working
            request = {
                "parent": self.parent,
                "contents": [text],
                "target_language_code": "en"
            }
            
            response = self.client.translate_text(request=request)
            
            # Get the language from the first translation
            translation = response.translations[0]
            
            return {
                "language": translation.detected_language_code,
                "confidence": 1.0  # Translation API doesn't provide confidence
            }
            
        except Exception as e:
            raise Exception(f"Language detection failed: {str(e)}")

    def is_translation_needed(self, detected_language: str) -> bool:
        """
        Determine if translation is needed based on detected language
        
        Args:
            detected_language: Detected language code
            
        Returns:
            Boolean indicating if translation is needed
        """
        return detected_language.lower() != "en" 