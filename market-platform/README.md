# AI-Powered Market Intelligence Platform

A comprehensive, production-ready platform for the Indian stock market (NSE) providing sector intelligence, relationship discovery, and ML-powered next-day predictions using XGBoost and K-Means.

## Tech Stack
*   **Backend:** Python 3.11, FastAPI, SQLite (via SQLAlchemy), APScheduler
*   **Machine Learning:** XGBoost, scikit-learn, SHAP
*   **Data Ingestion:** `yfinance` with `cachetools` for rate limiting
*   **Frontend:** React 18, Vite, Tailwind CSS, Recharts, D3.js

## Setup Instructions

### 1. Backend Setup
Open a terminal in the `market-platform` directory:
```bash
# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn backend.main:app --reload
```

### 2. Frontend Setup
Open a second terminal in the `market-platform/frontend` directory:
```bash
# Install Node modules
npm install

# Run the development server
npm run dev
```

The frontend will typically run at `http://localhost:5173`, and the backend API at `http://localhost:8000`.

## Architecture Overview
*   **Features Engine:** Calculates RSI, MACD, EMAs, ATR, Volatility, and Volume indicators live.
*   **Sector Intelligence:** Dynamically scores sectors based on momentum and relative strength against the `^NSEI` benchmark.
*   **Relationship Discovery:** Identifies stock leaders and followers using rolling Pearson and lag correlations.
*   **Opportunity Engine:** Outputs an explainable 0-100 score for every tracked stock.
*   **ML Predictor:** Trains on a 2-year rolling window to predict next-day bullish/bearish direction, providing SHAP feature attributions for transparency.
