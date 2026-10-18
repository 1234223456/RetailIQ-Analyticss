# Power BI integration guide

## Goal
Use Power BI for the final reporting layer while RetailIQ handles ingestion, Python cleaning and SQL analysis.

## Option A — easiest for a portfolio
1. Start the backend and upload/clean your file in RetailIQ.
2. Click **Export cleaned CSV**.
3. Open Power BI Desktop → **Get data → Text/CSV**.
4. Choose `retailiq_cleaned.csv`, inspect data types, then **Load**.
5. Create measures such as:

```DAX
Total Revenue = SUM(retail_sales[sales])

Total Profit = SUM(retail_sales[profit])

Profit Margin % = DIVIDE([Total Profit], [Total Revenue], 0)

Orders = DISTINCTCOUNT(retail_sales[order_id])

Average Order Value = DIVIDE([Total Revenue], [Orders], 0)
```

Replace table/column names with the names Power BI shows after import.

6. Add visuals:
   - KPI cards: Total Revenue, Total Profit, Orders, Profit Margin %
   - Line chart: month vs Total Revenue
   - Bar chart: Category vs Total Revenue
   - Bar chart: Region vs Total Revenue
   - Table: Product, Total Revenue, Total Profit
   - Slicers: Order Date, Region, Category
7. Save as `RetailIQ.pbix`.
8. For a portfolio, include screenshots of the report in your GitHub README. Avoid publishing private customer data.

## Option B — connect to SQLite
Power BI Desktop may require an appropriate SQLite ODBC driver/connector. If not installed, use Option A or move the data into a supported database such as SQL Server/PostgreSQL. The project intentionally uses SQLite to keep the local demo easy to run.

## Embed in the React UI
The **Power BI report** section provides a URL field for an embed URL. This is a UI convenience, not a complete production authentication implementation.

- For private reports, use Power BI Embedded or the supported secure embedding approach for your tenant and audience.
- For public portfolio demonstrations, Power BI's publish-to-web option may be available, but it makes the report and underlying data publicly accessible. Never use it for confidential data.
- Never put client secrets, access tokens, or service-principal credentials in React code.
- A production implementation should request an embed token from a protected backend and use the official Power BI JavaScript client.

## Interview explanation
“I used Python to standardise and validate source data, SQL to calculate business KPIs and aggregations, and Power BI to communicate trends with interactive filters. React acts as a lightweight project portal showing the pipeline and dataset quality.”
