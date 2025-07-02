from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import Dict, Any
import os
import asyncio

class EmergencyClassifier:
    def __init__(self, model_path: str = "models/emergency-classifier"):
        """Initialize the emergency classifier with BERT model"""
        self.model_path = model_path
        
        # Initialize model attributes
        self.model = None
        self.tokenizer = None
        self.classifier_pipeline = None
        self.use_zero_shot = False
        
        # Use Hugging Face models for emergency classification
        print("🤖 Initializing Hugging Face emergency classification models...")
        
        # Try different emergency/disaster classification models
        models_to_try = [
            "facebook/bart-large-mnli",  # Zero-shot classification
            "microsoft/DialoGPT-medium",
            "distilbert-base-uncased"
        ]
        
        for model_name in models_to_try:
            try:
                if model_name == "facebook/bart-large-mnli":
                    # Use zero-shot classification for emergency types
                    from transformers import pipeline
                    self.classifier_pipeline = pipeline("zero-shot-classification", model=model_name)
                    self.use_zero_shot = True
                    print(f"✅ Loaded zero-shot classifier: {model_name}")
                    break
                else:
                    self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                    self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
                    print(f"✅ Loaded HuggingFace model: {model_name}")
                    break
            except Exception as e:
                print(f"⚠️ Failed to load {model_name}: {e}")
                continue
        else:
            print("⚠️ All models failed, using keyword-based classification")
        
        # Move model to CPU if available
        if self.model:
            self.device = torch.device("cpu")
            self.model = self.model.to(self.device)
            self.model.eval()
        
        # Emergency type mapping for local model (4 classes)
        self.local_type_mapping = {
            0: "FIRE",
            1: "MEDICAL", 
            2: "CRIME",
            3: "OTHER"
        }
        
        # Priority mapping
        self.priority_mapping = {
            "FIRE": "HIGH",
            "MEDICAL": "HIGH",
            "CRIME": "HIGH",
            "NATURAL_DISASTER": "HIGH",
            "TRAFFIC": "MEDIUM",
            "OTHER": "LOW"
        }

    async def classify(self, text: str) -> Dict[str, Any]:
        """
        Classify emergency type from text using Hugging Face models
        
        Args:
            text: Emergency description text
            
        Returns:
            Dictionary containing emergency type, confidence, and priority
        """
        try:
            if self.use_zero_shot and hasattr(self, 'classifier_pipeline'):
                # Use zero-shot classification - best approach for emergency classification
                return await self._classify_with_zero_shot(text)
            elif self.model and self.tokenizer:
                # Use BERT model for classification
                return await self._classify_with_model(text)
            else:
                # Fallback to keyword-based classification
                return await self._classify_with_keywords(text)
            
        except Exception as e:
            print(f"⚠️ Model classification failed: {e}, falling back to keywords")
            return await self._classify_with_keywords(text)

    async def _classify_with_zero_shot(self, text: str) -> Dict[str, Any]:
        """Use zero-shot classification for emergency types"""
        # Define emergency categories for zero-shot classification
        candidate_labels = [
            "fire emergency and burning buildings",
            "medical emergency and health crisis", 
            "crime and violence",
            "traffic accident and vehicle collision",
            "natural disaster and weather emergency",
            "other emergency situation"
        ]
        
        # Get zero-shot predictions
        result = self.classifier_pipeline(text, candidate_labels)
        
        # Map labels back to our emergency types
        label_mapping = {
            "fire emergency and burning buildings": "FIRE",
            "medical emergency and health crisis": "MEDICAL",
            "crime and violence": "CRIME", 
            "traffic accident and vehicle collision": "TRAFFIC",
            "natural disaster and weather emergency": "NATURAL_DISASTER",
            "other emergency situation": "OTHER"
        }
        
        # Get top prediction
        top_label = result['labels'][0]
        confidence = result['scores'][0]
        emergency_type = label_mapping.get(top_label, "OTHER")
        
        # Get priority based on emergency type
        priority = self.priority_mapping.get(emergency_type, "MEDIUM")
        
        print(f"🎯 Zero-shot Classification: {emergency_type} (confidence: {confidence:.3f})")
        
        return {
            "type": emergency_type,
            "confidence": float(confidence),
            "priority": priority
        }

    async def _classify_with_model(self, text: str) -> Dict[str, Any]:
        """Use BERT model for classification"""
        # Tokenize input text
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )
        
        # Move inputs to device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Get model predictions
        with torch.no_grad():
            outputs = self.model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = torch.argmax(predictions, dim=-1).item()
            confidence = predictions[0][predicted_class].item()
        
        # Map prediction to emergency type
        emergency_type = self.local_type_mapping.get(predicted_class, "OTHER")
        
        # Get priority based on emergency type
        priority = self.priority_mapping.get(emergency_type, "MEDIUM")
        
        print(f"🤖 BERT Model Classification: {emergency_type} (confidence: {confidence:.3f})")
        
        return {
            "type": emergency_type,
            "confidence": float(confidence),
            "priority": priority
        }

    async def _classify_with_keywords(self, text: str) -> Dict[str, Any]:
        """Fallback keyword-based classification"""
        text_lower = text.lower()
        
        # Fire emergency keywords
        fire_keywords = ['fire', 'burning', 'smoke', 'flames', 'explosion', 'gas leak', 'propane', 'wildfire']
        
        # Medical emergency keywords  
        medical_keywords = ['heart attack', 'chest pain', 'unconscious', 'bleeding', 'stroke', 'overdose', 
                           'breathing', 'medical', 'ambulance', 'hurt', 'injured', 'pain', 'sick']
        
        # Crime keywords
        crime_keywords = ['robbery', 'assault', 'shooting', 'stabbing', 'break in', 'theft', 'violence',
                         'crime', 'gun', 'weapon', 'attack']
        
        # Traffic keywords
        traffic_keywords = ['accident', 'crash', 'collision', 'car', 'vehicle', 'highway', 'traffic']
        
        # Natural disaster keywords
        disaster_keywords = ['earthquake', 'flood', 'hurricane', 'tornado', 'landslide', 'tsunami']
        
        # Count keyword matches
        fire_count = sum(1 for keyword in fire_keywords if keyword in text_lower)
        medical_count = sum(1 for keyword in medical_keywords if keyword in text_lower)
        crime_count = sum(1 for keyword in crime_keywords if keyword in text_lower)
        traffic_count = sum(1 for keyword in traffic_keywords if keyword in text_lower)
        disaster_count = sum(1 for keyword in disaster_keywords if keyword in text_lower)
        
        # Determine emergency type based on highest count
        counts = {
            "FIRE": fire_count,
            "MEDICAL": medical_count,
            "CRIME": crime_count,
            "TRAFFIC": traffic_count,
            "NATURAL_DISASTER": disaster_count
        }
        
        emergency_type = max(counts, key=counts.get)
        max_count = counts[emergency_type]
        
        # If no clear match, default to OTHER
        if max_count == 0:
            emergency_type = "OTHER"
            confidence = 0.3
        else:
            # Calculate confidence based on keyword matches
            confidence = min(0.5 + (max_count * 0.2), 0.95)
        
        # Get priority based on emergency type
        priority = self.priority_mapping.get(emergency_type, "MEDIUM")
        
        print(f"🔍 Keyword Classification: {emergency_type} (confidence: {confidence:.3f})")
        
        return {
            "type": emergency_type,
            "confidence": confidence,
            "priority": priority
        }

    async def get_required_services(
        self,
        emergency_type: str,
        confidence: float
    ) -> Dict[str, bool]:
        """
        Determine which emergency services are required
        
        Args:
            emergency_type: Type of emergency
            confidence: Model confidence in classification
            
        Returns:
            Dictionary indicating required services
        """
        services = {
            "fire": False,
            "medical": False,
            "police": False,
            "rescue": False
        }
        
        # Always enable service matching emergency type
        if emergency_type == "FIRE":
            services["fire"] = True
        elif emergency_type == "MEDICAL":
            services["medical"] = True
        elif emergency_type == "CRIME":
            services["police"] = True
        elif emergency_type == "NATURAL_DISASTER":
            services["rescue"] = True
            services["fire"] = True
            services["medical"] = True
        elif emergency_type == "TRAFFIC":
            services["police"] = True
            services["medical"] = True
            
        # Enable additional services for high confidence emergencies
        if confidence > 0.8:
            if emergency_type == "FIRE":
                services["rescue"] = True
                services["medical"] = True
            elif emergency_type == "MEDICAL":
                services["rescue"] = True
            elif emergency_type == "CRIME":
                services["medical"] = True
                
        return services 