import os
import google.generativeai as genai
from core.config import settings

def list_models():
    try:
        genai.configure(api_key=settings.OPENAI_API_KEY)
        print("Fetching available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model Name: {m.name}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
