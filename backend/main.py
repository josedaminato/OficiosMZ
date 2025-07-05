from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from deepface import DeepFace
from PIL import Image
import io
import base64
import os

app = FastAPI()

# Permitir CORS para desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROFILE_PICS_DIR = "profile_pics"

@app.post("/api/verify-face")
async def verify_face(userId: str = Form(...), image: UploadFile = File(...)):
    # Simular obtención de la foto de perfil
    profile_pic_path = os.path.join(PROFILE_PICS_DIR, f"{userId}.jpg")
    if not os.path.exists(profile_pic_path):
        return JSONResponse({"verified": False, "error": "No profile picture found."}, status_code=404)

    # Leer imagen capturada
    captured_bytes = await image.read()
    captured_img = Image.open(io.BytesIO(captured_bytes)).convert("RGB")
    captured_img.save("temp_captured.jpg")

    # Comparar usando DeepFace
    try:
        result = DeepFace.verify(
            img1_path=profile_pic_path,
            img2_path="temp_captured.jpg",
            enforce_detection=False
        )
        verified = result.get("verified", False)
        return {"verified": verified}
    except Exception as e:
        return JSONResponse({"verified": False, "error": str(e)}, status_code=500)
    finally:
        if os.path.exists("temp_captured.jpg"):
            os.remove("temp_captured.jpg") 