import os
import cloudinary
import cloudinary.uploader

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )

def upload_image(image_bytes: bytes) -> str:
    """
    Uploads camera capture image to Cloudinary and returns secure URL.
    Fallback to base64 data URL if Cloudinary keys are not provided in dev environment.
    """
    if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        response = cloudinary.uploader.upload(image_bytes, folder="civic_pulse_complaints")
        return response.get("secure_url")
    else:
        # Dev fallback when keys aren't set yet
        import base64
        b64_str = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{b64_str}"
