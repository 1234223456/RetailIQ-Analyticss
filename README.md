# RetailIQ Analytics — End-to-End Data Analytics Portfolio Project

RetailIQ demonstrates a practical workflow for Data Analyst / Decision Analyst roles:

**Excel/CSV → Python (Pandas + NumPy) → SQL (SQLite) → React dashboard → Power BI**

## Features
- Upload Excel (`.xlsx`, `.xls`) or CSV files.
- Preview raw data and run data-quality checks.
- Clean column names, normalize common text fields, parse date columns, coerce numeric columns, remove duplicate rows, and handle missing values.
- Load the cleaned data into SQLite.
- Run SQL-powered business summaries: revenue by month, category, region, and top products.
- Download cleaned CSV and query results.
- Power BI integration guide and an optional report embed slot.

> The dashboard starts with illustrative sample data so the UI is useful before uploading a file. Sample figures are labelled as demo data. Uploaded datasets replace the demo data.

## Project structure
```text
RetailIQ-Analytics/
├── backend/
│   ├── app.py
│   ├── analytics.py
│   ├── requirements.txt
│   └── uploads/                 # created automatically
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── styles.css
├── powerbi/
│   └── POWER_BI_GUIDE.md
└── README.md
```

## Requirements
- Python 3.10+
- Node.js 18+
- Power BI Desktop (optional, for the report stage)

## 1. Start the Python backend
From the project root:

```bash
cd backend
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**macOS/Linux**
```bash
source .venv/bin/activate
```

Install packages and start the API:

```bash
pip install -r requirements.txt
python app.py
```

API runs at `http://127.0.0.1:5000`. Health check: `http://127.0.0.1:5000/api/health`.

## 2. Start the React UI
Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## 3. Try the project
1. Click **Load demo data** to see the dashboard with clearly labelled example figures.
2. Upload a retail orders Excel or CSV file.
3. Review the raw preview and data-quality report.
4. Click **Clean + analyse**.
5. Review KPI cards, charts and SQL summaries.
6. Download the cleaned CSV.

### Recommended input columns
The app tries to infer common field names. For best results, include columns similar to:
- `Order Date`
- `Order ID`
- `Product`
- `Category`
- `Region`
- `Quantity`
- `Unit Price`
- `Sales` (optional; calculated as Quantity × Unit Price if missing)
- `Profit` (optional)

Column matching is case-insensitive and ignores spaces/underscores. If your column names differ, rename them in Excel before upload for the most accurate analysis.

## 4. Power BI integration
See `powerbi/POWER_BI_GUIDE.md`. Use Power BI Desktop to connect to the cleaned CSV or SQLite database and build a report. The React app includes a Power BI report section; paste a **Power BI secure embed URL** into the UI only if your organisation has configured the appropriate Power BI permissions. Do not publish sensitive data publicly.

## 5. Useful SQL questions
The backend runs SQLite queries for:
- Monthly revenue and profit
- Revenue by category
- Revenue by region
- Top products by revenue

Explore `backend/analytics.py` to see and explain the SQL.

## 6. Suggested resume bullet (only use after you have run and validated it)
**RetailIQ — End-to-End Retail Sales Analytics | Python, Pandas, NumPy, SQL, React, Power BI**
- Built an end-to-end analytics pipeline to ingest Excel/CSV sales data, profile data quality, clean missing values and duplicates using Pandas/NumPy, and load curated records into SQL.
- Wrote SQL aggregations to analyse monthly revenue, product/category performance and regional trends; designed an interactive React dashboard and Power BI reporting workflow to communicate business insights.

Do not claim performance improvements or dataset sizes unless you measure them yourself.
