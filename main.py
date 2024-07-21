import os
import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from ultralytics import YOLO
import io
from pathlib import Path


app = FastAPI()

# Initialize YOLOv8 model
model = YOLO('yolov8n.pt')

# Allow CORS
origins = [
    "http://localhost",
    "http://localhost:5173",  # Add your frontend URL here
    "http://0.0.0.0",
    "http://0.0.0.0:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to generate Amazon search URL
def get_amazon_link(query):
    return f"https://www.amazon.com/s?k={query.replace(' ', '+')}"


@app.post("/upload/")
async def upload_image(image: UploadFile = File(...)):
    if image.content_type not in ["image/jpeg", "image/png"]:
        return JSONResponse(content={"error": "Invalid image format"}, status_code=400)

    # Save the image to a temporary location
    image_path = f"uploads/{image.filename}"
    annotated_image_path = f"uploads/annotated_{image.filename}"
    
    # Ensure the uploads directory exists
    os.makedirs('uploads', exist_ok=True)
    
    with open(image_path, "wb") as buffer:
        buffer.write(await image.read())

    # Perform object detection
    results = model(image_path)
    
    # Load image with OpenCV
    img = cv2.imread(image_path)
    
    # Extract detected objects and draw bounding boxes
    detected_objects = set()
    for result in results:
        for detection in result.boxes.data:
            x1, y1, x2, y2, conf, cls = map(int, detection[:6])
            label = result.names[cls]
            detected_objects.add(label)
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    
    # Save annotated image
    cv2.imwrite(annotated_image_path, img)

    # Create a BytesIO object from the image bytes
    with open(annotated_image_path, 'rb') as img_file:
        img_bytes = img_file.read()

    object_links = {obj: get_amazon_link(obj) for obj in detected_objects}

    # Clean up the saved image
    os.remove(image_path)

    return JSONResponse(
        content={
            "object_links": object_links,
            "image_url": f"http://localhost:8000/annotated-image/{os.path.basename(annotated_image_path)}"  # Correct URL for the annotated image
        }
    )

@app.get("/annotated-image/{filename}")
async def get_annotated_image(filename: str):
    img_path = Path(f"uploads/{filename}")
    
    if not img_path.exists():
        return JSONResponse(content={"error": "Image not found"}, status_code=404)

    # Load the image and return it as a streaming response
    return StreamingResponse(img_path.open("rb"), media_type="image/jpeg")


if __name__ == '__main__':
    import uvicorn
    os.makedirs('uploads', exist_ok=True)
    uvicorn.run(app, host='0.0.0.0', port=8000)
