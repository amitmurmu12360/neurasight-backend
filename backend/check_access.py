# backend folder mein check_access.py naam se save karo aur chalao
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) # Default version

try:
    print("Listing all models accessible by this key...")
    for model in client.models.list():
        print(f"-> {model.name}")
except Exception as e:
    print(f"❌ Abhi bhi block hai: {e}")