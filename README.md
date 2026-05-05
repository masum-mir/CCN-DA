# CCN-DA — Content-Centric Networking Data Analyzer

A full-stack simulation analysis platform for **Content-Centric Networking (CCN)** experiments. CCN-DA automates the entire research pipeline: run ONE simulator scenarios, average results across seeds, and generate publication-quality plots — all from a single web interface.

---

## Project Structure

```
CCN-DA/
├── api/                  # Flask backend (Python)
│   ├── app.py            # Main API server  
│   ├── averager.py       # ReportAverager — 
│   └── analysis.py       # Plot generation  
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx       # Root component
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   └── package.json
├── simulator/            # ONE simulator binaries & scenario configs
│   ├── reports/          # Raw & averaged simulation output (.txt)
│   └── plots/            # Generated plot images
└── .gitignore
```
## Prerequisites

- **Python** 3.9+
- **Node.js** 18+
- **Java** (required by the ONE simulator)
---

## Installation

### 1. Backend (API)

```bash
cd api
pip install flask flask-cors numpy pandas matplotlib seaborn
python app.py
```

The Flask server starts at `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The React dev server starts at `http://localhost:5000` and proxies `/api` requests to the Flask backend.

---
