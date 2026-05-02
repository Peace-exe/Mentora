from transformers import AutoTokenizer, AutoModel
import torch
from torch.nn.functional import normalize
import numpy as np

# Global cache variables
model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"


def load_model_once():
    
    global model, tokenizer

    if model is None:
        print(f"🚀 Loading google/embeddinggemma-300m on {device} ...")
        tokenizer = AutoTokenizer.from_pretrained("google/embeddinggemma-300m")
        model = AutoModel.from_pretrained(
            "google/embeddinggemma-300m",
            dtype=torch.float32   
        ).to(device)
        model.eval()
        print("✅ Model successfully loaded and ready.")
    else:
        print("⚡ Model already loaded in memory — reusing it.")

    return model, tokenizer


def generate_embeddings(texts: list[str]):
    """Generate embeddings for a list of sentences."""
    model, tokenizer = load_model_once()

    # Tokenization stays on CPU; only move tensors to GPU
    inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.inference_mode():
        outputs = model(**inputs)

    # Mean pooling + L2 normalization
    embeddings = outputs.last_hidden_state.mean(dim=1)
    embeddings = normalize(embeddings, p=2, dim=1)

    
    embeddings = embeddings.cpu().numpy()
    embeddings = np.nan_to_num(embeddings, nan=0.0, posinf=0.0, neginf=0.0)

    return embeddings.tolist()


if __name__ == "__main__":
    texts = [
        "Gautam Buddha University is in Greater Noida.",
        "The library is well-equipped."
    ]
    embeddings = generate_embeddings(texts)
    print(f"Generated {len(embeddings)} embeddings with dim={len(embeddings[0])}")
    print("Contains NaN:", np.isnan(embeddings).any())  # should print False
