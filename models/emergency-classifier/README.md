# Emergency Classifier Model

This directory contains the BERT-based emergency classification model for the RapidResponse system.

## Files Included

- `config.json` - Model configuration
- `tokenizer.json` - Tokenizer configuration
- `tokenizer_config.json` - Additional tokenizer settings
- `special_tokens_map.json` - Special token mappings
- `vocab.txt` - Vocabulary file

## Missing File

The `model.safetensors` file (417MB) has been excluded from this repository due to GitHub's 100MB file size limit.

### To Use This Model

1. **Download the model separately** or use a model hosting service like Hugging Face
2. **Use Git LFS** if you need to version control large model files
3. **Alternative**: Train a smaller model or use model compression techniques

### Model Details

- **Architecture**: BERT-based transformer for emergency text classification
- **Size**: ~417MB
- **Purpose**: Classify emergency reports into categories (FIRE, MEDICAL, CRIME, etc.)
- **Input**: Text descriptions of emergency situations
- **Output**: Emergency type classification with confidence scores

### Setup Instructions

```python
# Option 1: Load from Hugging Face Hub (recommended)
from transformers import AutoModel, AutoTokenizer

model = AutoModel.from_pretrained("your-huggingface-model-id")
tokenizer = AutoTokenizer.from_pretrained("your-huggingface-model-id")

# Option 2: Place model.safetensors in this directory and load locally
# model = AutoModel.from_pretrained("./models/emergency-classifier/")
```

### Training Information

The model was trained on emergency response data to classify text into:
- 🔥 FIRE
- 🚑 MEDICAL  
- 🚨 CRIME
- ⛈️ NATURAL_DISASTER
- 🚗 TRAFFIC
- ⚠️ OTHER

For production use, ensure you have the complete model file available in your deployment environment. 