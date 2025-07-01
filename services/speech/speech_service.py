import tempfile
import os
from typing import BinaryIO, Union

class SpeechService:
    def __init__(self, model_size: str = "large-v3", test_mode: bool = True):
        """
        Initialize the speech service with Whisper AI
        
        Args:
            model_size: Size of the Whisper model to use
                       Options: tiny, base, small, medium, large-v3
            test_mode: If True, returns mock transcription for testing
        """
        self.test_mode = test_mode
        self.model = None
        
        if not test_mode:
            # Only import and initialize Whisper if not in test mode
            from faster_whisper import WhisperModel
            self.model = WhisperModel(
                model_size,
                device="cpu",
                compute_type="int8"
            )

    async def transcribe(self, audio_data: Union[bytes, BinaryIO]) -> dict:
        """
        Transcribe audio data to text
        
        Args:
            audio_data: Raw audio data in bytes or file-like object
            
        Returns:
            Dictionary with transcribed text, language, and duration
        """
        try:
            # Test mode: return mock transcription immediately
            if self.test_mode:
                return {
                    "text": "Help! There is a medical emergency at Central Park. Someone has collapsed and is not breathing.",
                    "language": "en",
                    "duration": 5.0
                }
            
            # Real mode: use Whisper
            if not self.model:
                raise Exception("Whisper model not initialized")
                
            # Create a temporary file to store the audio data
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as temp_file:
                # Write audio data to temporary file
                if isinstance(audio_data, bytes):
                    temp_file.write(audio_data)
                else:
                    temp_file.write(audio_data.read())
                temp_file.flush()
                
                # Transcribe the audio
                segments, info = self.model.transcribe(
                    temp_file.name,
                    beam_size=5,
                    word_timestamps=True
                )
                
                # Combine all segments into a single text
                transcribed_text = " ".join([segment.text for segment in segments])
                
                return {
                    "text": transcribed_text.strip(),
                    "language": info.language,
                    "duration": info.duration
                }
                
        except Exception as e:
            raise Exception(f"Failed to transcribe audio: {str(e)}")

    def detect_language(self, audio_data: Union[bytes, BinaryIO]) -> str:
        """
        Detect the language of the audio
        
        Args:
            audio_data: Raw audio data in bytes or file-like object
            
        Returns:
            Language code (e.g., 'en', 'es', 'fr')
        """
        try:
            # Test mode: return English immediately
            if self.test_mode:
                return "en"
                
            if not self.model:
                raise Exception("Whisper model not initialized")
                
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as temp_file:
                if isinstance(audio_data, bytes):
                    temp_file.write(audio_data)
                else:
                    temp_file.write(audio_data.read())
                temp_file.flush()
                
                # Only detect language
                _, info = self.model.transcribe(
                    temp_file.name,
                    language_detection=True,
                    no_speech_threshold=0.5
                )
                
                return info.language
                
        except Exception as e:
            raise Exception(f"Failed to detect language: {str(e)}") 