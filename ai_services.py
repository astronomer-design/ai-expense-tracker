import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load the secret key from the .env file
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def process_receipt_image(image_bytes: bytes) -> dict:
    """
    Sends the receipt image to Gemini Vision to extract the merchant and amount.
    """
    try:
        # We use the lightning-fast 1.5 Flash model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Package the image for the API
        image_parts = [{"mime_type": "image/jpeg", "data": image_bytes}]
        
        # Give the AI strict instructions
        prompt = """
        You are an expert receipt analyzer. Look at this receipt image and extract the data.
        Return ONLY a raw, valid JSON object with no markdown formatting. It must match this exact structure:
        {
            "merchant": "Name of the store or service",
            "amount": 0.00
        }
        If you cannot read it, make your best guess or return "Unknown" and 0.0.
        """
        
        # Send it to the cloud!
        response = model.generate_content([prompt, image_parts[0]])
        
        # Clean up the response and turn it into a Python dictionary
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        extracted_data = json.loads(clean_text)
        
        return extracted_data

    except Exception as e:
        print(f"Vision API Error: {e}")
        return {"merchant": "Failed to read", "amount": 0.0}