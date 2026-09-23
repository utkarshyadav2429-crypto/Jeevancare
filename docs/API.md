# Backend API Reference — JeevanCare v1.0.0

## 1. Overview

JeevanCare's Express backend (`server.ts`) serves both static SPA assets and backend API endpoints.

---

## 2. API Endpoints

### 2.1 Health Check
- **Endpoint**: `GET /api/health`
- **Authentication**: None
- **Purpose**: Liveness and readiness probe for container orchestrators.
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-08-28T20:15:00.000Z"
  }
  ```

---

### 2.2 AI Clinical Assistant Proxy
- **Endpoint**: `POST /api/ai/chat`
- **Authentication**: Bearer JWT / User Session
- **Purpose**: Proxies conversational health inquiries to Gemini using server-side credentials.
- **Request Body**:
  ```json
  {
    "message": "What should I know about taking Metformin 500mg?",
    "history": [],
    "userContext": {
      "activeMedications": ["Metformin 500mg"],
      "recentVitals": { "bloodSugar": "110 mg/dL" }
    }
  }
  ```
- **Response**:
  ```json
  {
    "reply": "Metformin is commonly prescribed for glycemic management...",
    "disclaimer": "This information is supportive and does not replace medical advice."
  }
  ```

---

### 2.3 Prescription OCR Vision Extraction
- **Endpoint**: `POST /api/ai/extract-prescription`
- **Authentication**: Bearer JWT / User Session
- **Purpose**: Extracts structured prescription data from uploaded document images using Gemini Vision.
- **Request Body**:
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "mimeType": "image/jpeg"
  }
  ```
- **Response**:
  ```json
  {
    "doctorName": "Dr. Ramesh Sharma",
    "date": "2026-08-15",
    "medicines": [
      {
        "name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "Three times daily",
        "duration": "5 days"
      }
    ],
    "confidence": 0.92
  }
  ```
