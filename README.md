#RetailIQ Analytics — End-to-End Data Analytics Project#

An end-to-end retail analytics project that transforms raw sales data into actionable business insights using Python, Pandas, NumPy, SQL, React, and Power BI.

Business Problem

Retail businesses generate sales data across products, categories, customers, and dates. Raw data may contain missing values, inconsistent formats, and duplicate records, making it difficult to monitor performance and identify improvement opportunities.

RetailIQ Analytics streamlines the data-cleaning and analysis process and presents key business metrics through an interactive dashboard.

Project Objectives

* Clean and validate raw retail data.
* Analyze sales, profit, and category-level performance.
* Use SQL to summarize business metrics.
* Visualize key performance indicators and trends.
* Export cleaned data for further analysis in Power BI.

Technology Stack

Technology	Purpose
Python	Backend processing
Pandas	Data cleaning and manipulation
NumPy	Numerical operations
SQLite / SQL	Business analysis and aggregations
Flask	Backend API
React	Interactive dashboard interface
Vite	Frontend development
Power BI	Business intelligence reporting
Git & GitHub	Version control and project hosting

Project Workflow

1. Data input: Upload a retail sales CSV or Excel file.
2. Data cleaning: Process missing values, standardize fields, and handle duplicate records where applicable.
3. SQL analysis: Calculate sales and profit summaries and analyze performance across categories and dates.
4. Dashboard: Display KPIs, trends, and category-level comparisons.
5. Export: Download cleaned data and analysis results for additional reporting.
6. Power BI: Use the cleaned dataset to build a business intelligence report.

Key Analytics

The project dashboard includes metrics and visualizations such as:

* Total sales revenue
* Total profit
* Number of orders
* Revenue by product category
* Profit by product category
* Revenue trends over time

These metrics can help identify strong-performing categories, track business performance, and investigate sales and profitability trends.

Project Structure

RetailIQ-Analytics/
├── backend/
│   ├── app.py
│   ├── analytics.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── powerbi/
│   ├── RetailIQ-Analytics.pbix
│   └── POWER_BI_GUIDE.md
├── .gitignore
└── README.md

How to Run Locally

1. Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd RetailIQ-Analytics

Replace YOUR_GITHUB_REPOSITORY_URL with your repository’s actual HTTPS URL.

2. Set up the Python backend

cd backend
python -m venv venv

Activate the environment on Windows:

.\venv\Scripts\Activate.ps1

Install dependencies and start the backend:

pip install -r requirements.txt
python app.py

3. Start the frontend

Open a second terminal from the project root:

cd frontend
npm install
npm run dev

Open the local URL displayed by Vite in your browser.

4. Open the Power BI report

Open powerbi/RetailIQ-Analytics.pbix using Power BI Desktop.

Skills Demonstrated

* Data cleaning and preprocessing
* Exploratory data analysis
* SQL aggregations and business metrics
* REST API integration
* Dashboard development
* Business intelligence and data visualization
* Git and GitHub version control

Future Improvements

* Add customer segmentation and repeat-purchase analysis.
* Introduce product-level profitability analysis.
* Add date, category, and region filters.
* Create automated data-quality reports.
* Deploy the application for public access.

⸻

Project: RetailIQ Analytics
Focus: Data Analytics | Business Intelligence | Dashboard Development
