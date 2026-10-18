import re
import sqlite3
from pathlib import Path

import numpy as np
import pandas as pd

DB_PATH = Path(__file__).resolve().parent / "retailiq.sqlite3"

ALIASES = {
    "order_date": ["order date", "date", "orderdate", "transaction date", "invoice date"],
    "order_id": ["order id", "order_id", "orderid", "transaction id", "invoice id"],
    "product": ["product", "product name", "item", "item name", "sku name"],
    "category": ["category", "product category", "department"],
    "region": ["region", "state", "territory", "market", "city"],
    "quantity": ["quantity", "qty", "units", "units sold"],
    "unit_price": ["unit price", "price", "unit_price", "selling price", "rate"],
    "sales": ["sales", "revenue", "total sales", "amount", "net sales"],
    "profit": ["profit", "net profit", "gross profit", "margin amount"],
}

def canonical_key(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value).strip().lower()).strip()

def resolve_columns(df):
    lookup = {canonical_key(c): c for c in df.columns}
    resolved = {}
    for target, candidates in ALIASES.items():
        for candidate in candidates:
            if canonical_key(candidate) in lookup:
                resolved[target] = lookup[canonical_key(candidate)]
                break
    return resolved

def clean_dataframe(raw):
    df = raw.copy()
    original_rows = len(df)
    original_cols = len(df.columns)
    # Standardise headers and make them unique.
    headers = []
    seen = {}
    for c in df.columns:
        name = re.sub(r"[^a-zA-Z0-9]+", "_", str(c).strip().lower()).strip("_") or "column"
        seen[name] = seen.get(name, 0) + 1
        headers.append(name if seen[name] == 1 else f"{name}_{seen[name]}")
    df.columns = headers

    # Normalize whitespace and empty strings.
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype("string").str.strip().replace({"": pd.NA, "nan": pd.NA, "None": pd.NA})

    # Parse date-looking columns.
    for col in df.columns:
        if "date" in col or col.endswith("_at"):
            parsed = pd.to_datetime(df[col], errors="coerce")
            if parsed.notna().sum() > 0:
                df[col] = parsed.dt.strftime("%Y-%m-%d")

    # Coerce common numeric fields and numeric-looking columns.
    numeric_tokens = ("quantity", "qty", "price", "sales", "revenue", "profit", "cost", "amount", "discount", "units")
    for col in df.columns:
        if any(token in col for token in numeric_tokens):
            cleaned = df[col].astype("string").str.replace(r"[₹,$%]", "", regex=True).str.replace(",", "", regex=False)
            parsed = pd.to_numeric(cleaned, errors="coerce")
            if parsed.notna().sum() > 0:
                df[col] = parsed

    duplicates_removed = int(df.duplicated().sum())
    df = df.drop_duplicates().copy()

    # Conservative missing-value treatment: numeric columns -> median; text columns -> "Unknown".
    missing_before = int(df.isna().sum().sum())
    for col in df.columns:
        if df[col].isna().any():
            if pd.api.types.is_numeric_dtype(df[col]):
                median = df[col].median()
                df[col] = df[col].fillna(median if pd.notna(median) else 0)
            else:
                df[col] = df[col].fillna("Unknown")
    missing_after = int(df.isna().sum().sum())

    # Derived business fields when enough inputs are available.
    resolved = resolve_columns(df)
    # resolve after normalized headers: alias resolver handles common names.
    if "sales" not in resolved and "quantity" in resolved and "unit_price" in resolved:
        q, p = resolved["quantity"], resolved["unit_price"]
        df["sales"] = pd.to_numeric(df[q], errors="coerce") * pd.to_numeric(df[p], errors="coerce")
    elif "sales" in resolved:
        df["sales"] = pd.to_numeric(df[resolved["sales"]], errors="coerce").fillna(0)

    if "profit" in resolved:
        df["profit"] = pd.to_numeric(df[resolved["profit"]], errors="coerce").fillna(0)

    # Re-resolve after derived fields.
    resolved = resolve_columns(df)
    report = {
        "original_rows": original_rows,
        "cleaned_rows": int(len(df)),
        "original_columns": original_cols,
        "cleaned_columns": int(len(df.columns)),
        "duplicates_removed": duplicates_removed,
        "missing_cells_before_fill": missing_before,
        "missing_cells_after_fill": missing_after,
        "quality_score": round(max(0, 100 * (1 - (duplicates_removed + missing_before) / max(1, original_rows * max(1, original_cols)))), 1),
        "columns": list(df.columns),
        "resolved_columns": resolved,
    }
    return df, report

def _num(value):
    try:
        n = float(value)
        return 0 if not np.isfinite(n) else n
    except (TypeError, ValueError):
        return 0

def analyse_dataframe(df):
    conn = sqlite3.connect(DB_PATH)
    try:
        df.to_sql("retail_sales", conn, if_exists="replace", index=False)
        table_cols = list(df.columns)
        # Use safe resolved column names from actual dataframe columns.
        resolved = resolve_columns(df)
        sales_col = resolved.get("sales")
        profit_col = resolved.get("profit")
        date_col = resolved.get("order_date")
        category_col = resolved.get("category")
        region_col = resolved.get("region")
        product_col = resolved.get("product")
        quantity_col = resolved.get("quantity")

        def ident(col):
            # Only called with a column name returned by pandas.
            return '"' + str(col).replace('"', '""') + '"'

        result = {"kpis": {}, "monthly": [], "categories": [], "regions": [], "products": [], "sql_available": True}
        n = len(df)
        result["kpis"]["rows"] = int(n)
        result["kpis"]["columns"] = int(len(table_cols))
        result["kpis"]["orders"] = int(df[resolved["order_id"]].nunique()) if "order_id" in resolved else int(n)

        if sales_col:
            s = ident(sales_col)
            row = conn.execute(f"SELECT COALESCE(SUM({s}),0), COALESCE(AVG({s}),0) FROM retail_sales").fetchone()
            result["kpis"]["revenue"] = round(_num(row[0]), 2)
            result["kpis"]["average_order_value"] = round(_num(row[1]), 2)
        else:
            result["kpis"]["revenue"] = 0
            result["kpis"]["average_order_value"] = 0

        if profit_col:
            p = ident(profit_col)
            total_profit = conn.execute(f"SELECT COALESCE(SUM({p}),0) FROM retail_sales").fetchone()[0]
            result["kpis"]["profit"] = round(_num(total_profit), 2)
            result["kpis"]["margin"] = round((_num(total_profit) / result["kpis"]["revenue"] * 100), 2) if result["kpis"]["revenue"] else 0
        else:
            result["kpis"]["profit"] = None
            result["kpis"]["margin"] = None

        if date_col and sales_col:
            d, s = ident(date_col), ident(sales_col)
            query = f"""SELECT substr(CAST({d} AS TEXT),1,7) AS month,
                               ROUND(SUM({s}),2) AS revenue
                        FROM retail_sales
                        WHERE substr(CAST({d} AS TEXT),1,7) GLOB '????-??'
                        GROUP BY month ORDER BY month"""
            result["monthly"] = [{"month": r[0], "revenue": _num(r[1])} for r in conn.execute(query).fetchall() if r[0]]
        if category_col and sales_col:
            c, s = ident(category_col), ident(sales_col)
            q = f"SELECT CAST({c} AS TEXT), ROUND(SUM({s}),2) FROM retail_sales GROUP BY {c} ORDER BY SUM({s}) DESC LIMIT 10"
            result["categories"] = [{"name": str(r[0]), "revenue": _num(r[1])} for r in conn.execute(q).fetchall()]
        if region_col and sales_col:
            c, s = ident(region_col), ident(sales_col)
            q = f"SELECT CAST({c} AS TEXT), ROUND(SUM({s}),2) FROM retail_sales GROUP BY {c} ORDER BY SUM({s}) DESC LIMIT 10"
            result["regions"] = [{"name": str(r[0]), "revenue": _num(r[1])} for r in conn.execute(q).fetchall()]
        if product_col and sales_col:
            c, s = ident(product_col), ident(sales_col)
            q = f"SELECT CAST({c} AS TEXT), ROUND(SUM({s}),2) FROM retail_sales GROUP BY {c} ORDER BY SUM({s}) DESC LIMIT 10"
            result["products"] = [{"name": str(r[0]), "revenue": _num(r[1])} for r in conn.execute(q).fetchall()]
        result["detected_fields"] = resolved
        return result
    finally:
        conn.close()
