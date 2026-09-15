<p align="center">
  <img src="https://img.shields.io/badge/DeepFlow_AI-Intelligent_Documents-00A859?style=for-the-badge&logo=data:image/svg+xml;base64,..." alt="DeepFlow AI" />
</p>

<h1 align="center">DeepFlow AI</h1>
<p align="center"><strong>Intelligent Documents. Smarter Workflows.</strong></p>
<p align="center">AI-powered document intelligence and workflow automation for modern enterprises.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.141-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## Overview

**DeepFlow AI** is an enterprise-grade web application that demonstrates end-to-end **Intelligent Document Processing (IDP)**, **Business Process Management (BPM)**, and **AI-Assisted Decision Support**.

Upload any business document — invoice, contract, purchase order, or resume — and watch the AI pipeline classify it, extract structured data, assess risk, assign priority, recommend an action, and route it through an automated approval workflow with full audit trail.

```
PDF / DOCX / TXT Upload
        ↓
AI Content Extraction & Classification
        ↓
Structured Field Extraction (vendor, amount, dates, terms)
        ↓
Risk Assessment (0–100 score + flags)
        ↓
SLA Priority Detection & AI Recommended Action
        ↓
Automated Workflow Routing & Human Approval
        ↓
Immutable Audit Log & Analytics Dashboard
```

---

## Features

| Category | Details |
|---|---|
| **AI Document Analysis** | PDF text extraction via PyMuPDF, document classification with confidence scores, structured field extraction, risk scoring, priority detection, and AI-recommended actions |
| **Grounded QA Chat** | Ask natural-language questions about any uploaded document — answers are grounded in the actual extracted text |
| **Workflow Automation** | Rule-based workflow routing with configurable nodes (AI Analysis → Validation → Approval → Notification → Assignment) |
| **Approval System** | Multi-role decision modal (Approve / Reject / Request Changes) with audit comment trails |
| **Analytics Dashboard** | Executive KPIs, 30-day document volume trends, automation rates, SLA compliance, and process bottleneck detection |
| **Audit Logs** | Immutable compliance event stream with filtering by action type, user, and timestamp |
| **AI Providers** | Built-in demo mode (no API key required), Google Gemini, and OpenAI GPT-4o support |
| **Enterprise UI** | Clean white + emerald green theme, responsive layout, Lucide icons, Recharts visualizations |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                               │
│  React 19 · Vite 8 · Tailwind CSS 4 · Lucide · Recharts│
└────────────────────────┬────────────────────────────────┘
                         │ REST API (proxy via Vite)
┌────────────────────────▼────────────────────────────────┐
│  Backend                                                │
│  Python 3.12 · FastAPI · Uvicorn · SQLAlchemy · Pydantic│
│  PyMuPDF · python-docx · Google GenAI · OpenAI SDK      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Database: SQLite (auto-seeded with demo data)          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
DeepFlow-AI/
├── main.py                  # Root entry point — starts the backend
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
├── .gitignore
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── api/
│   │   │   ├── auth.py      # Authentication routes
│   │   │   ├── documents.py # Document CRUD & AI analysis
│   │   │   ├── workflows.py # Workflow management
│   │   │   ├── analytics.py # Dashboard analytics
│   │   │   ├── audit_logs.py# Audit trail
│   │   │   ├── ai_chat.py   # Grounded QA chat
│   │   │   └── settings.py  # App settings
│   │   ├── database/
│   │   │   ├── database.py  # SQLAlchemy engine & session
│   │   │   ├── models.py    # ORM models
│   │   │   └── seed.py      # Demo data seeder
│   │   └── services/
│   │       ├── ai_service.py        # AI analysis logic
│   │       └── document_processor.py # Text extraction
│   └── uploads/             # User-uploaded files (gitignored)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api.js           # Axios/fetch API client
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Header.jsx
        │   ├── UploadModal.jsx
        │   └── ApprovalModal.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Documents.jsx
            ├── DocumentAnalyzer.jsx
            ├── Workflows.jsx
            ├── Analytics.jsx
            ├── AuditLogs.jsx
            └── Settings.jsx
```

---

## Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ & npm

### 1. Clone the repository

```bash
git clone https://github.com/imdeepx11/Deepflow-AI.git
cd Deepflow-AI
```

### 2. Set up the backend

```bash
# Create and activate virtual environment
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure environment (optional)

```bash
cp .env.example .env
# Edit .env to add your Gemini or OpenAI API key (optional — demo mode works without it)
```

### 4. Start the backend

```bash
python main.py
```

The API server starts at **http://127.0.0.1:8000** with auto-reload enabled.
- Swagger docs: **http://127.0.0.1:8000/docs**

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Demo Credentials

Click **"Use Demo Account"** on the login page, or enter manually:

| Field | Value |
|---|---|
| Email | `demo@deepflow.ai` |
| Password | `demo123` |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Backend server port |
| `HOST` | `127.0.0.1` | Backend server host |
| `AI_PROVIDER` | `demo` | AI engine: `demo`, `gemini`, or `openai` |
| `GEMINI_API_KEY` | — | Google Gemini API key (required if `AI_PROVIDER=gemini`) |
| `OPENAI_API_KEY` | — | OpenAI API key (required if `AI_PROVIDER=openai`) |
| `DATABASE_URL` | `sqlite:///intelliflow.db` | SQLAlchemy database connection string |

---

## Demo Walkthrough

> Recommended flow when presenting DeepFlow AI in an interview or product demo.

1. **Login** → Click "Use Demo Account" for instant access
2. **Dashboard** → Show executive KPIs, 30-day volume chart, and recent documents
3. **Documents** → Browse the pre-seeded document library
4. **Upload** → Upload a sample PDF invoice
5. **AI Analyzer** → Click "Analyze with AI" and walk through:
   - Document classification with confidence score
   - Extracted fields (vendor, invoice number, amounts, dates, payment status)
   - Risk assessment score and flags
   - AI recommended action
   - Grounded QA chat ("What is the total amount?", "When is the due date?")
6. **Approval** → Submit an approval decision with comments
7. **Workflows** → Observe the workflow timeline update
8. **Analytics** → Show process intelligence and bottleneck insights
9. **Audit Logs** → Demonstrate the immutable compliance trail

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | User authentication |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/documents` | List all documents |
| `POST` | `/api/documents/upload` | Upload a document |
| `POST` | `/api/documents/{id}/analyze` | Trigger AI analysis |
| `GET` | `/api/workflows` | List workflows |
| `POST` | `/api/workflows/{id}/approve` | Submit approval decision |
| `GET` | `/api/analytics/dashboard` | Dashboard statistics |
| `GET` | `/api/audit-logs` | Audit log entries |
| `POST` | `/api/ai-chat` | Grounded QA chat |

---

## License

MIT License — DeepFlow AI © 2026

---

<p align="center">
  Built by <strong>Deepak Gupta</strong>
</p>
