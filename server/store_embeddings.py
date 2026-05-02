from getEmbeddings import generate_embeddings
from config.pinecone import index
from debug_logger import log_error
from datetime import datetime, timezone


dummy_data = [
    "The School of Management at GBU is known for its MBA programs.",
    "The library at GBU is equipped with thousands of books, journals, and digital resources.",
    "GBU has separate hostels for boys and girls with modern facilities.",
    "The university conducts entrance examinations for various courses.",
    "GBU promotes research in areas like AI, data science, and renewable energy.",
    "The university has collaborations with several international institutions.",
    "GBU organizes annual cultural and technical festivals for students.",
    "The campus has sports facilities including cricket, football, and indoor stadiums.",
    "The official website of GBU provides information about admissions and courses.",
    "GBU emphasizes value-based education inspired by Buddhist principles.",
    "Scholarships are available for meritorious and financially weaker students.",
    "Gautam Buddha University has a website which is www.gbu.ac.in"
]


# ── separated metadata builder ──────────────────────────────
def buildMetadata(question: str, questionId: str, factId : str) -> dict:
    return {
        "question" : question,
        "questionId" : questionId,
        "factId" : factId, 
        "timestamp" : datetime.now(timezone.utc).isoformat()
    }

def buildVectors(data: list[str], embeddings: list, category: str, subcategory: str, department: str, idPrefix: str) -> list:
    return [
        {
            "id": f"{idPrefix}-{i}",
            "values": embeddings[i],
            "metadata": buildMetadata(text, category, subcategory, department)
        }
        for i, text in enumerate(data)
    ]
# ─────────────────────────────────────────────────────────────


def upsertFacts(data: list[str], category, subcategory, department, idPrefix):
    try:
        embeddings = generate_embeddings(data)
        to_upsert = buildVectors(data, embeddings, category, subcategory, department, idPrefix)

        index.upsert(vectors=to_upsert)
        print(f"Input: {len(data)}, Output: {len(embeddings)}")

        return f"Input: {len(data)}, Output: {len(embeddings)}"

    except Exception as err:
        log_error(err)
        raise RuntimeError(f"Error! :\n{err}")