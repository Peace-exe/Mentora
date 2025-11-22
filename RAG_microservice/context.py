from getEmbeddings import generate_embeddings
from pinecone_config import index
from typing import List, Dict
from debug_logger import log_error

def searchFact(userQuery :str ):
    
    try:
        queryList = [userQuery]
        embeddings = generate_embeddings(queryList)
        result = index.query(
            vector = embeddings,
            top_k = 3,
            include_metadata = True,
            )
        print(result)
        return result['matches']

    except Exception as err:
        log_error(err)
        return str(err)
    
def parseFacts(matchedData : List[Dict]):

    if not matchedData:
        return ""
    
    factsRelatedtoUserQuery = [m["metadata"]["text"] for m in matchedData]
    contextString = "\n".join(factsRelatedtoUserQuery)
    return contextString

def context(query:str):
    
    matches = searchFact(query)
    context = parseFacts(matches)
    return context

#print(context("what is the website of gautam buddha university?"))