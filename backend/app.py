from pathlib import Path
import io
import json
import os

import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from analytics import clean_dataframe, analyse_dataframe

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
BASE = Path(__file__).resolve().parent
STATE = {"raw": None, "cleaned": None, "report": None, "analysis": None}

def read_upload(file):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix == ".csv":
        # utf-8-sig handles common Excel-exported CSV files.
        return pd.read_csv(file, encoding="utf-8-sig")
    if suffix in (".xlsx", ".xls"):
        return pd.read_excel(file)
    raise ValueError("Please upload a .csv, .xlsx, or .xls file.")

@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "RetailIQ Analytics API"})

@app.post("/api/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"error": "Choose an Excel or CSV file first."}), 400
    file = request.files["file"]
    try:
        df = read_upload(file)
        if df.empty:
            return jsonify({"error": "The uploaded file has no data rows."}), 400
        if len(df.columns) > 200:
            return jsonify({"error": "The file has too many columns (maximum 200)."}), 400
        STATE.update({"raw": df, "cleaned": None, "report": None, "analysis": None})
        return jsonify({
            "filename": file.filename,
            "rows": int(len(df)),
            "columns": list(map(str, df.columns)),
            "preview": df.head(8).where(pd.notna(df.head(8)), None).to_dict(orient="records"),
            "missing_cells": int(df.isna().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
        })
    except Exception as exc:
        return jsonify({"error": f"Could not read file: {str(exc)}"}), 400

@app.post("/api/demo")
def demo():
    df = pd.DataFrame([
        {"Order Date":"2026-01-05","Order ID":"R-1001","Product":"Wireless Mouse","Category":"Electronics","Region":"North","Quantity":2,"Unit Price":799,"Sales":1598,"Profit":320},
        {"Order Date":"2026-01-12","Order ID":"R-1002","Product":"Desk Lamp","Category":"Home","Region":"West","Quantity":1,"Unit Price":1299,"Sales":1299,"Profit":260},
        {"Order Date":"2026-02-02","Order ID":"R-1003","Product":"Notebook Set","Category":"Stationery","Region":"South","Quantity":5,"Unit Price":199,"Sales":995,"Profit":250},
        {"Order Date":"2026-02-19","Order ID":"R-1004","Product":"Wireless Mouse","Category":"Electronics","Region":"North","Quantity":3,"Unit Price":799,"Sales":2397,"Profit":479},
        {"Order Date":"2026-03-08","Order ID":"R-1005","Product":"Office Chair","Category":"Furniture","Region":"East","Quantity":1,"Unit Price":6499,"Sales":6499,"Profit":910},
        {"Order Date":"2026-03-14","Order ID":"R-1006","Product":"Desk Lamp","Category":"Home","Region":"West","Quantity":2,"Unit Price":1299,"Sales":2598,"Profit":520},
        {"Order Date":"2026-04-03","Order ID":"R-1007","Product":"Notebook Set","Category":"Stationery","Region":"South","Quantity":8,"Unit Price":199,"Sales":1592,"Profit":398},
        {"Order Date":"2026-04-20","Order ID":"R-1008","Product":"Office Chair","Category":"Furniture","Region":"North","Quantity":2,"Unit Price":6499,"Sales":12998,"Profit":1819},
        {"Order Date":"2026-05-11","Order ID":"R-1009","Product":"Wireless Mouse","Category":"Electronics","Region":"East","Quantity":4,"Unit Price":799,"Sales":3196,"Profit":639},
        {"Order Date":"2026-05-25","Order ID":"R-1010","Product":"Desk Lamp","Category":"Home","Region":"West","Quantity":3,"Unit Price":1299,"Sales":3897,"Profit":779},
        {"Order Date":"2026-06-04","Order ID":"R-1011","Product":"Office Chair","Category":"Furniture","Region":"North","Quantity":1,"Unit Price":6499,"Sales":6499,"Profit":910},
        {"Order Date":"2026-06-18","Order ID":"R-1012","Product":"Notebook Set","Category":"Stationery","Region":"South","Quantity":4,"Unit Price":199,"Sales":796,"Profit":199},
    ])
    STATE.update({"raw": df, "cleaned": None, "report": None, "analysis": None})
    return jsonify({
        "filename": "retailiq_demo_data.csv",
        "rows": len(df),
        "columns": list(df.columns),
        "preview": df.head(8).to_dict(orient="records"),
        "missing_cells": int(df.isna().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "demo": True
    })

@app.post("/api/clean")
def clean():
    if STATE["raw"] is None:
        return jsonify({"error": "Upload a file or load demo data first."}), 400
    try:
        cleaned, report = clean_dataframe(STATE["raw"])
        analysis = analyse_dataframe(cleaned)
        STATE.update({"cleaned": cleaned, "report": report, "analysis": analysis})
        return jsonify({
            "report": report,
            "analysis": analysis,
            "preview": cleaned.head(8).where(pd.notna(cleaned.head(8)), None).to_dict(orient="records"),
        })
    except Exception as exc:
        return jsonify({"error": f"Cleaning or analysis failed: {str(exc)}"}), 500

@app.get("/api/state")
def state():
    if STATE["raw"] is None:
        return jsonify({"loaded": False})
    df = STATE["cleaned"] if STATE["cleaned"] is not None else STATE["raw"]
    return jsonify({
        "loaded": True,
        "cleaned": STATE["cleaned"] is not None,
        "rows": int(len(df)),
        "columns": list(map(str, df.columns)),
        "preview": df.head(8).where(pd.notna(df.head(8)), None).to_dict(orient="records"),
        "report": STATE["report"],
        "analysis": STATE["analysis"],
    })

@app.get("/api/download/cleaned.csv")
def download_cleaned():
    if STATE["cleaned"] is None:
        return jsonify({"error": "Clean the dataset before downloading."}), 400
    buffer = io.BytesIO(STATE["cleaned"].to_csv(index=False).encode("utf-8-sig"))
    buffer.seek(0)
    return send_file(buffer, mimetype="text/csv", as_attachment=True, download_name="retailiq_cleaned.csv")

@app.get("/api/download/sql-results.json")
def download_results():
    if STATE["analysis"] is None:
        return jsonify({"error": "Run analysis first."}), 400
    buffer = io.BytesIO(json.dumps(STATE["analysis"], indent=2).encode("utf-8"))
    buffer.seek(0)
    return send_file(buffer, mimetype="application/json", as_attachment=True, download_name="retailiq_sql_results.json")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
