from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
from io import BytesIO
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def apply_histogram_equalization(img):
    if img.ndim == 3:
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        ycrcb[:,:,0] = cv2.equalizeHist(ycrcb[:,:,0])
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    else:
        return cv2.equalizeHist(img)

def apply_sharpening(img, strength=2):
    kernel = np.array([[-1,-1,-1], 
                       [-1, 9+strength,-1],
                       [-1,-1,-1]])
    return cv2.filter2D(img, -1, kernel)

def apply_color_quantization(img, k=10):
    # Convert to float32 for k-means
    data = np.float32(img).reshape((-1, 3))
    
    # Define criteria and apply k-means
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    # Convert back to 8 bit values
    centers = np.uint8(centers)
    result = centers[labels.flatten()]
    return result.reshape(img.shape)

def apply_cartoon_effect(img, num_colors=4):
    # Step 1: Color quantization
    quantized = apply_color_quantization(img, num_colors)
    
    # Step 2: Edge enhancement
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    edges = cv2.adaptiveThreshold(gray, 255, 
                                cv2.ADAPTIVE_THRESH_MEAN_C, 
                                cv2.THRESH_BINARY, 9, 9)
    
    # Step 3: Combine edges with quantized image
    edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    return cv2.bitwise_and(quantized, edges)


def apply_fourier_transform(img):
    if img.ndim == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Applica la trasformata di Fourier
    dft = cv2.dft(np.float32(img), flags=cv2.DFT_COMPLEX_OUTPUT)
    dft_shift = np.fft.fftshift(dft)
    
    # Calcola lo spettro di magnitudine
    magnitude_spectrum = 20 * np.log(cv2.magnitude(dft_shift[:,:,0], dft_shift[:,:,1]))
    
    # Normalizza per la visualizzazione
    magnitude_spectrum = cv2.normalize(magnitude_spectrum, None, 0, 255, cv2.NORM_MINMAX)
    magnitude_spectrum = np.uint8(magnitude_spectrum)
    
    # Converti in BGR per la visualizzazione a colori
    return cv2.cvtColor(magnitude_spectrum, cv2.COLOR_GRAY2BGR)

def apply_edge_detection(img, method='sobel', ksize=3):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img
    
    if method == 'sobel':
        dx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
        dy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)
        edges = np.sqrt(dx**2 + dy**2)
    elif method == 'scharr':
        dx = cv2.Scharr(gray, cv2.CV_64F, 1, 0)
        dy = cv2.Scharr(gray, cv2.CV_64F, 0, 1)
        edges = np.sqrt(dx**2 + dy**2)
    elif method == 'laplacian':
        edges = cv2.Laplacian(gray, cv2.CV_64F, ksize=ksize)
    
    # Normalizza e converti
    edges = cv2.normalize(edges, None, 0, 255, cv2.NORM_MINMAX)
    return np.uint8(edges)

def apply_stylization(img, stylization_strength=100, edge_preserve=50):
    # Converti i parametri in range validi per OpenCV
    sigma_s = max(1, min(200, stylization_strength))
    sigma_r = max(0.01, min(1.0, edge_preserve/100))
    
    return cv2.stylization(img, sigma_s=sigma_s, sigma_r=sigma_r)

def apply_perspective_transform(img, points=None):
    h, w = img.shape[:2]
    
    # Punti di default per la trasformazione prospettica
    if points is None:
        points = {
            'tl': [0, 0],    # top-left
            'tr': [w-1, 0],   # top-right
            'br': [w-1, h-1], # bottom-right
            'bl': [0, h-1]    # bottom-left
        }
    
    # Punti di origine e destinazione
    src_points = np.float32([
        [0, 0], [w-1, 0], [w-1, h-1], [0, h-1]
    ])
    dst_points = np.float32([
        points['tl'], points['tr'], points['br'], points['bl']
    ])
    
    # Calcola la matrice di trasformazione
    M = cv2.getPerspectiveTransform(src_points, dst_points)
    
    # Applica la trasformazione
    return cv2.warpPerspective(img, M, (w, h))

@app.post("/process")
async def process_image(file: UploadFile = File(...), operations: str = Form(...)):
    try:
        contents = await file.read()
        img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Immagine non valida")

        ops = json.loads(operations)

        for op in ops:
            name = op.get("type", "").lower()
            params = op.get("params", {})

            if name == "grayscale":
                img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            elif name == "blur":
                ksize = int(params.get("kernelSize", 5))
                if ksize % 2 == 0:
                    ksize += 1
                img = cv2.GaussianBlur(img, (ksize, ksize), 0)

            elif name == "canny":
                if img.ndim == 3:
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                t1 = int(params.get("threshold1", 100))
                t2 = int(params.get("threshold2", 200))
                img = cv2.Canny(img, t1, t2)

            elif name == "threshold":
                if img.ndim == 3:
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                thresh = int(params.get("thresh", 127))
                maxval = int(params.get("maxval", 255))
                _, img = cv2.threshold(img, thresh, maxval, cv2.THRESH_BINARY)

            elif name in {"blue", "green", "red"}:
                if img.ndim == 3:
                    idx = {"blue": 0, "green": 1, "red": 2}[name]
                    img = img[:, :, idx]

            elif name == "rotate":
                angle = float(params.get("angle", 90))
                h, w = img.shape[:2]
                M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
                img = cv2.warpAffine(img, M, (w, h))
                
            # New functions
            elif name == "histogram_equalization":
                img = apply_histogram_equalization(img)
                
            elif name == "sharpen":
                strength = int(params.get("strength", 2))
                img = apply_sharpening(img, strength)
                
            elif name == "color_quantization":
                k = int(params.get("q_color", 10))
                img = apply_color_quantization(img, k)
                
            elif name == "cartoon":
                num_colors = int(params.get("c_color", 4))
                img = apply_cartoon_effect(img, num_colors)

            elif name == "fourier_transform":
                img = apply_fourier_transform(img)
                
            elif name == "edge_detection":
                method = params.get("method", "sobel")
                ksize = int(params.get("ksize", 3))
                img = apply_edge_detection(img, method, ksize)
                
            elif name == "stylization":
                stylization_strength = int(params.get("stylization_strength", 100))
                edge_preserve = int(params.get("edge_preserve", 50))
                img = apply_stylization(img, stylization_strength, edge_preserve)
                
            elif name == "perspective_transform":
                points = params.get("points")
                img = apply_perspective_transform(img, points)

        if img.ndim == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        success, buffer = cv2.imencode(".png", img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        if not success:
            raise RuntimeError("Errore nell'encoding PNG")
        return StreamingResponse(BytesIO(buffer.tobytes()), media_type="image/png")

    except Exception as e:
        print(f"[ERRORE] {str(e)}")
        return {"error": "Elaborazione fallita"}