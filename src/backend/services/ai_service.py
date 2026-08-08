import os
import json
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def detect_semantic_duplicate(new_description: str, nearby_complaints: list) -> dict:
    """
    Uses Gemini text model to compare new complaint against existing open complaints.
    """
    if not GEMINI_API_KEY:
        # Require Gemini API Key as specified in constraints: "fail loudly with a clear setup error"
        raise ValueError("GEMINI_API_KEY is not configured! Real AI is required by constraints.")

    model = genai.GenerativeModel("gemini-1.5-flash")
    
    complaints_context = [
        {"id": c["id"], "category": c["category"], "description": c["description"], "street": c["street"]}
        for c in nearby_complaints
    ]
    
    prompt = f"""
    You are a civic issue duplicate detector for Coimbatore Municipal Corporation.
    Compare the following NEW COMPLAINT against the list of EXISTING NEARBY COMPLAINTS.

    NEW COMPLAINT:
    Description: "{new_description}"

    EXISTING NEARBY COMPLAINTS:
    {json.dumps(complaints_context, indent=2)}

    TASK:
    Determine if the NEW COMPLAINT describes the EXACT SAME physical problem as any of the EXISTING NEARBY COMPLAINTS, even if the wording is different.

    Respond STRICTLY in JSON format with no extra text:
    {{
      "is_duplicate": true or false,
      "existing_complaint_id": <int or null>,
      "confidence": <float between 0.0 and 1.0>,
      "reason": "<short explanation>"
    }}
    """
    
    response = model.generate_content(prompt)
    try:
        text_content = response.text.strip()
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
        return json.loads(text_content)
    except Exception as e:
        return {
            "is_duplicate": False,
            "existing_complaint_id": None,
            "confidence": 0.0,
            "reason": f"AI Parsing error: {str(e)}"
        }

def validate_photo_with_gemini(image_bytes: bytes, category: str, description: str) -> dict:
    """
    Uses Gemini Vision model to verify if the photo matches the complaint issue category.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured! Real AI is required by constraints.")

    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
    Analyze this photo for a civic complaint submission in Coimbatore.
    Complaint Category: "{category}"
    Complaint Description: "{description}"

    Does this photo visually depict the reported civic problem (e.g. pothole, garbage, street light, water leak, drainage issue)?
    Reject selfies, documents, random indoor objects, or blank images.

    Respond STRICTLY in JSON format:
    {{
      "is_valid": true or false,
      "reason": "<explanation>"
    }}
    """
    
    image_part = {
        "mime_type": "image/jpeg",
        "data": image_bytes
    }
    
    response = model.generate_content([prompt, image_part])
    try:
        text_content = response.text.strip()
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
        return json.loads(text_content)
    except Exception as e:
        return {"is_valid": False, "reason": f"Vision AI Parsing error: {str(e)}"}
