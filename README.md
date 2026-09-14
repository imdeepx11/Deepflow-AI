# DeepFlow AI — Intelligent Documents. Smarter Workflows.

> **"Intelligent Documents. Smarter Workflows."**  
> *AI-powered document intelligence and workflow automation for modern enterprises.*

---

## 🌟 Overview

**DeepFlow AI** is a polished, enterprise-grade SaaS web application designed to demonstrate state-of-the-art **Intelligent Document Processing (IDP)**, **Business Process Management (BPM)**, and **AI-Assisted Decision Support**.

### Core Enterprise Value Flow:
```
Unstructured Business Document (PDF, DOCX, TXT)
       ↓
AI Content Ingestion & Classification (Invoice, PO, Contract, Resume, etc.)
       ↓
Dynamic Field Extraction & Risk Assessment (0-100 Score + Risk Flags)
       ↓
SLA Priority Detection & AI Recommended Action (Signoff Roles & SLAs)
       ↓
Automated Rule-Based Workflow Routing & Audit Signoff
       ↓
Enterprise Analytics & Process Intelligence Bottleneck Insights
```

---

## ✨ Key Features

1. **Enterprise Aesthetic**: Strictly styled in a modern **White, Emerald Green (#00A859), and Light-Green (#DCFCE7)** enterprise UI theme.
2. **Demo AI Mode (Zero API Key Requirement)**: Built-in deterministic smart AI analyzer that produces realistic extraction schema out-of-the-box without requiring external API keys. Supports OpenAI (GPT-4o) and Google Gemini (2.5 Flash) seamlessly when API keys are configured.
3. **Split-Screen AI Document Analyzer**:
   - **Left Side**: Raw extracted document text & interactive **Ask AI about this document** QA chat assistant.
   - **Right Side**: Visual confidence meter, extracted key fields, risk index (0-100), priority reasoning, **AI Recommended Action box**, dynamic workflow progress timeline, and 3-5 point executive summaries.
4. **Interactive Workflow Builder & Rule Engine**:
   - Customizable workflow nodes: `Start`, `AI Analysis`, `Document Validation`, `Approval`, `Condition`, `Notification`, `Assignment`, `End`.
   - Business Rule Builder (e.g., `IF Invoice Amount > ₹50,000 THEN Require Manager Approval`).
5. **Formal Approval Signoff System**: Multi-role decision modal (Approve, Reject, Request Changes) with audit comment trails.
6. **Process Intelligence Analytics**: Visual dashboards tracking automation rates, SLA compliance, document volume trends, and AI bottleneck detection insights.
7. **Immutable Audit Logs**: Comprehensive compliance event stream filtering across user actions, AI processing steps, and approvals.

---

## 🏗️ Architecture & Tech Stack

```
[ Frontend: React + Vite + Tailwind CSS + Lucide + Recharts ]
                             │  HTTP / REST
                             ▼
[ Backend: Python FastAPI + SQLAlchemy + SQLite (intelliflow.db) ]
              │                      │
   [ Document Processor ]     [ AI Service Layer ]
  (PyMuPDF, docx, txt)      (Demo AI / OpenAI / Gemini)
```

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts
- **Backend**: Python 3.12+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic, PyMuPDF (fitz), python-docx
- **Database**: SQLite (`intelliflow.db`) with automatic enterprise demo seed data
- **Security & Config**: Environment variables via `.env`, CORS middleware, input sanitization

---

## 🚀 Quick Setup & Run Instructions

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal in the root directory:
   ```bash
   cd backend
   ```
2. Activate virtual environment (if using virtualenv):
   ```bash
   # Windows PowerShell
   .\venv\Scripts\activate

   # Linux/macOS
   source venv/bin/activate
   ```
3. Run the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *The backend will automatically create `intelliflow.db` and seed 10 realistic enterprise documents.*

   - **API Base URL**: `http://127.0.0.1:8000`
   - **Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### Step 2: Start the Frontend (Vite + React)

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 🔑 Demo Account Credentials

Click the **"Use Demo Account"** button on the Login page or use:

- **Email**: `demo@deepflow.ai`
- **Password**: `demo123`

---

## ⚙️ Environment Variables (`.env.example`)

```ini
PORT=8000
HOST=127.0.0.1

# AI Provider (demo, openai, gemini)
AI_PROVIDER=demo

# Optional API Keys (Demo Mode active by default)
OPENAI_API_KEY=
GEMINI_API_KEY=

DATABASE_URL=sqlite:///intelliflow.db
```

---

## 📋 Recommended Interview Demo Flow

To demonstrate DeepFlow AI effectively to a product/engineering team (e.g. Newgen Software):

1. **Login**: Click **"Use Demo Account"** to sign in instantly.
2. **Dashboard Overview**: Show executive KPIs (+18.4% processed), 30-day volume chart, and recent documents stream.
3. **Upload Document**: Click **"Upload Document"**, drop a sample PDF/Invoice, and click **"Analyze with AI"**.
4. **Inspect AI Analyzer**:
   - Point out **AI Classification** (Invoice 96% confidence).
   - Review **Extracted Key Fields** (Vendor, Amount, Tax, Due Date, Payment Status).
   - Inspect **AI Risk Score** and risk verification flags.
   - Highlight **AI Recommended Action** card ("ARCHIVE / RECORD KEEPING").
   - Demo **Ask AI about this document** QA chat ("What is the total amount?").
5. **Submit Workflow Approval**: Click **"Approve"**, add audit comments, and confirm.
6. **Workflow Timeline**: Observe active step moving to **Completed**.
7. **Analytics**: Open **Analytics** page to demonstrate **Process Intelligence Bottleneck Insights**.
8. **Audit Trail**: Open **Audit Logs** to show that every action was recorded with timestamps and user roles.

---

## 📄 License
Enterprise MIT License — DeepFlow AI 2026.
