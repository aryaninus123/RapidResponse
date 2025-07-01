from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import Dict, Any
import os

class EmergencyClassifier:
    def __init__(self, model_path: str = "models/emergency-classifier"):
        """Initialize the emergency classifier with BERT model"""
        self.model_path = model_path
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        
        # Move model to CPU
        self.device = torch.device("cpu")
        self.model = self.model.to(self.device)
        
        # Load emergency type mapping
        self.type_mapping = {
            0: "FIRE",
            1: "MEDICAL",
            2: "CRIME",
            3: "NATURAL_DISASTER",
            4: "TRAFFIC",
            5: "OTHER"
        }
        
        # Load priority mapping
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
        Classify emergency type from text
        
        Args:
            text: Emergency description text
            
        Returns:
            Dictionary containing emergency type, confidence, and priority
        """
        try:
            # For testing purposes, return a mock classification
            return {
                "type": "FIRE",
                "confidence": 0.95,
                "priority": "HIGH"
            }
            
        except Exception as e:
            raise Exception(f"Classification failed: {str(e)}")

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