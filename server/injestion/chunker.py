# ingestion/chunker.py

import re
import numpy as np
from getEmbeddings import generate_embeddings, load_model_once  # adjust import path as per your structure

MAX_TOKENS = 200
SIMILARITY_THRESHOLD = 0.35


def split_into_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


def count_tokens(text: str) -> int:
    
    _, tokenizer = load_model_once()  # ensures tokenizer is loaded
    return len(tokenizer.encode(text, add_special_tokens=False))


def semantic_chunking(text: str) -> list[str]:
    sentences = split_into_sentences(text)

    if len(sentences) <= 2:
        return [text]

    # batch embed all sentences in one call
    embeddings = np.array(generate_embeddings(sentences))

    # find split points where cosine similarity drops
    split_indices = []
    for i in range(len(sentences) - 1):
        sim = np.dot(embeddings[i], embeddings[i + 1])  # already L2 normalized, so dot = cosine
        if sim < SIMILARITY_THRESHOLD:
            split_indices.append(i + 1)

    # build chunks
    boundaries = [0] + split_indices + [len(sentences)]
    raw_chunks = []
    for i in range(len(boundaries) - 1):
        chunk = " ".join(sentences[boundaries[i]:boundaries[i + 1]])
        raw_chunks.append(chunk)

    # enforce max token size
    final_chunks = []
    for chunk in raw_chunks:
        if count_tokens(chunk) <= MAX_TOKENS:
            final_chunks.append(chunk)
        else:
            chunk_sentences = split_into_sentences(chunk)
            current, current_tokens = [], 0
            for sent in chunk_sentences:
                sent_tokens = count_tokens(sent)
                if current_tokens + sent_tokens > MAX_TOKENS and current:
                    final_chunks.append(" ".join(current))
                    current, current_tokens = [sent], sent_tokens
                else:
                    current.append(sent)
                    current_tokens += sent_tokens
            if current:
                final_chunks.append(" ".join(current))

    return final_chunks


