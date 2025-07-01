import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path

def setup_models():
    """Download and set up required models"""
    print("Setting up models...")
    
    # Create models directory if it doesn't exist
    models_dir = Path("models/emergency-classifier")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Download BERT model
    print("Downloading BERT model...")
    model_name = "bert-base-uncased"
    
    # Download and save tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.save_pretrained(models_dir)
    
    # Download and save model
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=4  # Fire, Medical, Police, NGO
    )
    model.save_pretrained(models_dir)
    
    print("Models setup complete!")

if __name__ == "__main__":
    setup_models() 