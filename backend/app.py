from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
import io
import numpy as np
from torchvision import transforms
from pathlib import Path
import os
import traceback
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Load your PyTorch model (use a path relative to this file so it works
# whether you run the script from project root or the backend folder)
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'model.pt'
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

model = None

# Load model
print(f"Loading model from: {MODEL_PATH}")
try:
    # Try the normal safe load first
    model = YOLO(str(MODEL_PATH))
    model.eval()
    print(f"Model loaded successfully on {device} (standard load)")
except Exception as e:
    print(f"Standard torch.load failed: {e}")
    # Some torch versions restrict globals when loading weights-only files (ultralytics etc.).
    # Try to load using a safe_globals context for known classes, or fall back to weights_only=False
    try:
        # If the model uses ultralytics DetectionModel, attempt to allowlist that global
        import importlib
        try:
            ultralytics = importlib.import_module('ultralytics')
            print('ultralytics module found, attempting safe_globals allowlist...')
            safe_globals_ctx = getattr(torch.serialization, 'safe_globals', None)
            if safe_globals_ctx is not None:
                try:
                    with safe_globals_ctx([ultralytics.nn.tasks.DetectionModel]):
                        model = torch.load(str(MODEL_PATH), map_location=device)
                        model.eval()
                        print(f"Model loaded successfully on {device} (safe_globals)")
                except Exception as e2:
                    print(f"safe_globals load failed: {e2}")
            else:
                print('torch.serialization.safe_globals not available in this torch version')
        except Exception as e_mod:
            print(f"ultralytics import/allowlist failed: {e_mod}")

        if model is None:
            # Last-resort: load with weights_only=False (may execute arbitrary code). Only do this if you trust the file.
            print('Attempting fallback load with weights_only=False (unsafe). Only do this for trusted model files.')
            model = torch.load(str(MODEL_PATH), map_location=device, weights_only=False)
            model.eval()
            print(f"Model loaded successfully on {device} (weights_only=False)")
    except Exception as final_e:
        print(f"Final attempt to load model failed: {final_e}")
        model = None

# Document type mapping (adjust based on your model's output)
DOCUMENT_TYPES = {
    0: "Boarding Pass",
    1: "Bank Card",
    2: "ID Card",
    3: "Passport",
    4: "Driver License",
    5: "Unknown"
}

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),  # Adjust size based on your model
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                       std=[0.229, 0.224, 0.225])
])

def preprocess_image(image):
    """Preprocess image for model input"""
    if image.mode != 'RGB':
        image = image.convert('RGB')
    return transform(image).unsqueeze(0).to(device)

def extract_bounding_boxes(prediction):
    """Extract bounding boxes from model prediction"""
    # This depends on your model architecture
    # Example for object detection models:
    boxes = []
    
    # If your model returns bounding box coordinates
    # Adjust this based on your model's output format
    if isinstance(prediction, dict) and 'boxes' in prediction:
        for box in prediction['boxes']:
            boxes.append({
                'x': float(box[0]),
                'y': float(box[1]),
                'width': float(box[2] - box[0]),
                'height': float(box[3] - box[1])
            })
    else:
        # Default boxes if model doesn't provide them
        boxes = [
            {'x': 0.1, 'y': 0.1, 'width': 0.8, 'height': 0.15},
            {'x': 0.1, 'y': 0.3, 'width': 0.6, 'height': 0.1},
        ]
    
    return boxes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'device': str(device)
    })

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_mock_detections():
    """Generate mock detections for testing"""
    return [
        {'x': 0.1, 'y': 0.1, 'width': 0.8, 'height': 0.15},
        {'x': 0.1, 'y': 0.3, 'width': 0.6, 'height': 0.1},
    ]

def run_inference(image):
    """
    Run YOLOv8 model inference
    Args:
        image: PIL Image
    Returns:
        dict with prediction results
    """
    try:
        if model is None:
            raise ValueError("Model not loaded")
        # Run inference
        results = model.predict(image, imgsz=640, device=device.index if device.type == 'cuda' else 'cpu')
        print(f"✅ Inference results: {results}")
        detections = []
        for r in results:
            boxes = r.boxes
            for idx, box in enumerate(boxes):
                cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                score = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                class_name = DOCUMENT_TYPES.get(cls_id, "Unknown")
                detections.append({
                    "id": f"{cls_id}-{idx}",
                    "category": class_name,
                    "text": class_name,
                    "confidence": score,
                    "risk": "High",  # Optionally map per class
                    "boundingBox": {
                        "x": x1,
                        "y": y1,
                        "width": x2 - x1,
                        "height": y2 - y1,
                    },
                    "recommendation": f"{class_name} detected. Consider redacting."
                })
        # Pick top detection for summary
        if detections:
            top = max(detections, key=lambda d: d["confidence"])
            document_type = top["category"]
            confidence = top["confidence"]
        else:
            document_type = "Unknown"
            confidence = 0.0
        return {
            'document_type': document_type,
            'confidence': confidence,
            'detections': detections,
            'image_size': {
                'width': image.width,
                'height': image.height
            }
        }
    except Exception as e:
        print(f"❌ Error in inference: {e}")
        traceback.print_exc()
        raise

@app.route('/detect', methods=['POST', 'OPTIONS'])
def detect_pii():
    """Main detection endpoint with comprehensive error handling"""

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200

    print("\n" + "="*60)
    print("📸 NEW DETECTION REQUEST")
    print("="*60)

    try:
        # Step 1: Validate request
        if 'image' not in request.files:
            print("❌ No image in request")
            return jsonify({
                'error': 'No image file provided',
                'details': 'Request must include an "image" file'
            }), 400

        file = request.files['image']
        print(f"📄 File: {file.filename}")

        # Step 2: Validate filename
        if file.filename == '':
            print("❌ Empty filename")
            return jsonify({
                'error': 'Empty filename',
                'details': 'File must have a valid name'
            }), 400

        # Step 3: Validate file extension
        if not allowed_file(file.filename):
            print(f"❌ Invalid file type: {file.filename}")
            return jsonify({
                'error': 'Invalid file type',
                'details': f'Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400

        # Step 4: Read and validate image
        try:
            image_bytes = file.read()
            file_size = len(image_bytes)
            print(f"📦 File size: {file_size:,} bytes ({file_size/1024:.2f} KB)")

            if file_size > MAX_FILE_SIZE:
                return jsonify({
                    'error': 'File too large',
                    'details': f'Maximum file size is {MAX_FILE_SIZE/1024/1024}MB'
                }), 400

            if file_size == 0:
                return jsonify({
                    'error': 'Empty file',
                    'details': 'File has no content'
                }), 400

        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return jsonify({
                'error': 'Failed to read file',
                'details': str(e)
            }), 400

        # Step 5: Open and validate image
        try:
            image = Image.open(io.BytesIO(image_bytes))
            print(f"🖼️  Image: {image.size[0]}x{image.size[1]} {image.mode}")
        except Exception as e:
            print(f"❌ Invalid image: {e}")
            return jsonify({
                'error': 'Invalid image file',
                'details': 'File could not be opened as an image'
            }), 400

        # Step 6: Run inference if model is loaded
        if model is None:
            print("⚠️  Model not loaded - using mock response")
            # Generate mock detections in the new format
            mock_detections = []
            for idx, box in enumerate(generate_mock_detections()):
                class_name = "Unknown"
                mock_detections.append({
                    "id": f"0-{idx}",
                    "category": class_name,
                    "text": class_name,
                    "confidence": 0.0,
                    "risk": "High",
                    "boundingBox": {
                        "x": box["x"],
                        "y": box["y"],
                        "width": box["width"],
                        "height": box["height"]
                    },
                    "recommendation": f"{class_name} detected. Consider redacting."
                })
            result = {
                'document_type': 'Unknown',
                'confidence': 0.0,
                'detections': mock_detections,
                'image_size': {
                    'width': image.width,
                    'height': image.height
                },
                'warning': 'Model not loaded. Place model.pt in backend/models/'
            }
        else:
            try:
                print("🤖 Running YOLOv8 model inference...")
                result = run_inference(image)
            except Exception as e:
                print(f"❌ Inference error: {e}")
                return jsonify({
                    'error': 'Model inference failed',
                    'details': str(e),
                    'type': type(e).__name__
                }), 500

        print(f"✅ Success: {result['document_type']} ({result['confidence']:.2%})")
        print("="*60 + "\n")

        return jsonify(result)

    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        traceback.print_exc()
        print("="*60 + "\n")

        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'type': type(e).__name__
        }), 500

if __name__ == '__main__':
    # Run on port 5002 to avoid conflicts with other services on macOS
    app.run(host='0.0.0.0', port=5002, debug=True)
