# AI-Powered PDF Question Answering System (RAG)

A full-stack RAG web application where authenticated users upload PDFs, ask questions, and receive accurate, page-cited answers grounded strictly in the document content.

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL + `pgvector`, Alembic, JWT (`python-jose`), `passlib[bcrypt]`, PyMuPDF
- **AI / RAG:** Google Gemini API (`gemini-embedding-001`, `gemini-3.8-flash` with fallback), `langchain-text-splitters`
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Axios, `react-hot-toast`, `lucide-react`

---

## Local Setup

### 1. Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env   # Fill in DATABASE_URL, GEMINI_API_KEY, JWT_SECRET_KEY
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```
API docs: `http://localhost:8000/docs`

### 2. Frontend
```powershell
cd frontend
npm install
copy .env.example .env.local   # Set NEXT_PUBLIC_API_URL=http://localhost:8000 (or Render URL)
npm run dev
```
Frontend: `http://localhost:3000`
