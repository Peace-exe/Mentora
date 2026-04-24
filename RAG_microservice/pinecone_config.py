import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
INDEX_NAME = "gbu-index"

pc = Pinecone(api_key=PINECONE_API_KEY)

index = pc.Index(INDEX_NAME)
