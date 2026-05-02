import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('customSearchApi2')
CX = os.getenv('searchEngineId')

query = "admission process of gautam buddha university?"

def webSearch(query : str):
    try:
        url = f"https://www.googleapis.com/customsearch/v1?key={API_KEY}&cx={CX}&q={query}"
        #url = "https://cse.google.com/cse?cx=f27856f42362c4a84"
        response = requests.get(url)
        data = response.json()
        return data.get("items",[])
    
    except Exception as err:
        return str(err)

'''
    for item in data.get("items", []):
        print("Title:", item["title"])
        print("Link:", item["link"])
        print("Snippet:", item["snippet"])
        print()
'''
print(webSearch(query))