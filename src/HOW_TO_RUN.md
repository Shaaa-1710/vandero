# How to Run Civic Pulse

Follow these step-by-step instructions to set up and run both the backend API and frontend application.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher) & **npm**: [Download Node.js](https://nodejs.org/)
- **Python** (v3.10 or higher) & **pip**: [Download Python](https://www.python.org/)

---

## 🐍 1. Setting Up & Running the Backend (FastAPI)

1. Open your terminal / command prompt.
2. Navigate to the backend directory:
   ```bash
   cd d:\projects\civic-pulse\src\backend
   ```

3. *(Optional but Recommended)* Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     python -m venv venv
     .\venv\Scripts\activate.bat
     ```

4. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the backend development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

6. **Verify Backend:**
   - Open your browser and go to `http://localhost:8000/docs`.
   - You should see the FastAPI interactive Swagger API documentation.

---

## ⚛️ 2. Setting Up & Running the Frontend (React + Vite)

1. Open a **new / second** terminal window.
2. Navigate to the frontend directory:
   ```bash
   cd d:\projects\civic-pulse\src\frontend
   ```

3. Install the Node.js packages:
   ```bash
   npm install
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. **Verify Frontend:**
   - Open your browser and visit `http://localhost:5173`.
   - You should see the Civic Pulse application dashboard!

---

## 🔑 Test Credentials (Dev Mode)

### Registration / Signup (Citizen)
- Endpoint: `POST http://localhost:8000/auth/register`
- JSON Body:
  ```json
  {
    "username": "citizen1",
    "password": "password123",
    "name": "Lakshmi",
    "mobile_number": "9876543210",
    "email": "lakshmi@example.com"
  }
  ```

### Login (Citizen or Officer)
- Endpoint: `POST http://localhost:8000/auth/login`
- JSON Body:
  ```json
  {
    "username": "citizen1",
    "password": "password123",
    "role": "citizen"
  }
  ```
