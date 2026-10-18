import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, BarChart3, Check, ChevronRight, CircleHelp,
  Database, FileSpreadsheet, FileUp, Gauge, Layers3, LoaderCircle, RefreshCw,
  Search, ShieldCheck, Sparkles, Table2, UploadCloud, Workflow, X
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const money = (n) => n == null ? "—" : new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(n) || 0);
const number = (n) => new Intl.NumberFormat("en-IN").format(Number(n) || 0);
const API = "";

const demoAnalysis = {
  kpis: { revenue: 51664, orders: 12, average_order_value: 4305, profit: 7483, margin: 14.49, rows: 12, columns: 9 },
  monthly: [
    { month: "Jan", revenue: 2897 }, { month: "Feb", revenue: 3392 },
    { month: "Mar", revenue: 9097 }, { month: "Apr", revenue: 14590 },
    { month: "May", revenue: 7093 }, { month: "Jun", revenue: 7295 }
  ],
  categories: [
    { name: "Furniture", revenue: 19496 }, { name: "Electronics", revenue: 7191 },
    { name: "Home", revenue: 7794 }, { name: "Stationery", revenue: 3383 }
  ],
  regions: [
    { name: "North", revenue: 27494 }, { name: "West", revenue: 7794 },
    { name: "East", revenue: 9695 }, { name: "South", revenue: 3383 }
  ],
  products: [
    { name: "Office Chair", revenue: 25996 }, { name: "Desk Lamp", revenue: 7794 },
    { name: "Wireless Mouse", revenue: 7191 }, { name: "Notebook Set", revenue: 3383 }
  ],
  detected_fields: { order_date: "Order Date", order_id: "Order ID", product: "Product", category: "Category", region: "Region", quantity: "Quantity", unit_price: "Unit Price", sales: "Sales", profit: "Profit" }
};
const demoReport = {
  original_rows: 12, cleaned_rows: 12, original_columns: 9, cleaned_columns: 9,
  duplicates_removed: 0, missing_cells_before_fill: 0, missing_cells_after_fill: 0,
  quality_score: 100, columns: ["order_date", "order_id", "product", "category", "region", "quantity", "unit_price", "sales", "profit"]
};
const demoRows = [
  { "Order Date": "2026-01-05", "Order ID": "R-1001", Product: "Wireless Mouse", Category: "Electronics", Region: "North", Quantity: 2, "Unit Price": 799, Sales: 1598, Profit: 320 },
  { "Order Date": "2026-01-12", "Order ID": "R-1002", Product: "Desk Lamp", Category: "Home", Region: "West", Quantity: 1, "Unit Price": 1299, Sales: 1299, Profit: 260 },
  { "Order Date": "2026-02-02", "Order ID": "R-1003", Product: "Notebook Set", Category: "Stationery", Region: "South", Quantity: 5, "Unit Price": 199, Sales: 995, Profit: 250 },
  { "Order Date": "2026-02-19", "Order ID": "R-1004", Product: "Wireless Mouse", Category: "Electronics", Region: "North", Quantity: 3, "Unit Price": 799, Sales: 2397, Profit: 479 }
];
const pipeline = [
  { name: "Excel / CSV", detail: "Ingestion & profiling", icon: FileSpreadsheet },
  { name: "Python", detail: "Pandas + NumPy cleaning", icon: Activity },
  { name: "SQL", detail: "Business queries", icon: Database },
  { name: "Power BI", detail: "Reporting & decisions", icon: BarChart3 }
];
const colors = ["#56d6bd", "#7c8cff", "#ffbf69", "#e58de7", "#76b8ff", "#f08b8b"];

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(demoRows);
  const [analysis, setAnalysis] = useState(demoAnalysis);
  const [report, setReport] = useState(demoReport);
  const [fileName, setFileName] = useState("retailiq_demo_data.csv");
  const [loaded, setLoaded] = useState(true);
  const [cleaned, setCleaned] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [powerbiUrl, setPowerbiUrl] = useState("");
  const [showPowerBI, setShowPowerBI] = useState(false);

  const preview = useMemo(() => data.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [data, query]);
  const k = analysis?.kpis || {};
  const isDemo = fileName.includes("demo");

  async function loadDemo() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API}/api/demo`, { method: "POST" });
      if (!res.ok) throw new Error("Backend isn't running; demo preview loaded locally instead.");
      const payload = await res.json();
      setData(payload.preview || demoRows); setFileName(payload.filename || "retailiq_demo_data.csv");
      setLoaded(true); setCleaned(false); setAnalysis(null); setReport(null);
    } catch (e) {
      setData(demoRows); setFileName("retailiq_demo_data.csv"); setLoaded(true);
      setCleaned(true); setAnalysis(demoAnalysis); setReport(demoReport);
      setError(e.message);
    } finally { setBusy(false); }
  }

  async function uploadFile() {
    if (!file) { setError("Choose a CSV or Excel file first."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Upload failed.");
      setData(payload.preview || []); setFileName(payload.filename);
      setLoaded(true); setCleaned(false); setAnalysis(null); setReport(null);
      setActiveTab("data");
    } catch (e) { setError(`${e.message} If the backend is not running, start it in the backend folder.`); }
    finally { setBusy(false); }
  }

  async function cleanAndAnalyse() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API}/api/clean`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Cleaning failed.");
      setData(payload.preview || []); setAnalysis(payload.analysis); setReport(payload.report);
      setCleaned(true); setActiveTab("overview");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function loadDemoLocally() {
    setData(demoRows); setFileName("retailiq_demo_data.csv"); setLoaded(true);
    setCleaned(true); setAnalysis(demoAnalysis); setReport(demoReport); setError("");
  }

  async function download(path, fallbackName) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("Download requires the backend and a cleaned dataset.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fallbackName; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => {
    fetch("/api/health").catch(() => {});
  }, []);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><BarChart3 size={22} /></div>
        <div><div className="brand-name">Retail<span>IQ</span></div><div className="brand-caption">ANALYTICS STUDIO</div></div>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}><Gauge size={18}/> Overview</button>
      <button className={`nav-item ${activeTab === "pipeline" ? "active" : ""}`} onClick={() => setActiveTab("pipeline")}><Workflow size={18}/> Data pipeline <span className="nav-count">4</span></button>
      <button className={`nav-item ${activeTab === "data" ? "active" : ""}`} onClick={() => setActiveTab("data")}><Table2 size={18}/> Data preview</button>
      <button className={`nav-item ${activeTab === "powerbi" ? "active" : ""}`} onClick={() => setActiveTab("powerbi")}><Layers3 size={18}/> Power BI report</button>
      <div className="sidebar-bottom">
        <div className="status-card"><div className="status-dot"/><div><b>Analytics engine</b><span>{cleaned ? "Ready for insights" : loaded ? "Awaiting clean + analyse" : "Waiting for data"}</span></div></div>
        <div className="sidebar-foot">PORTFOLIO PROJECT <span>v1.0</span></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="crumbs">Workspace <ChevronRight size={14}/> <b>{activeTab === "overview" ? "Overview" : activeTab === "pipeline" ? "Data pipeline" : activeTab === "data" ? "Data preview" : "Power BI report"}</b></div>
        <div className="topbar-right"><span className="live-dot"/><span>Local workspace</span><div className="avatar">RI</div></div>
      </header>

      <div className="page-content">
        <section className="welcome-row">
          <div><div className="eyebrow"><Sparkles size={14}/> END-TO-END BUSINESS INTELLIGENCE</div><h1>Retail performance, <span>made clear.</span></h1><p>From messy spreadsheets to decisions you can act on.</p></div>
          <div className="welcome-actions"><button className="btn btn-secondary" onClick={() => download("/api/download/cleaned.csv", "retailiq_cleaned.csv")}><ArrowDownToLine size={16}/> Export cleaned CSV</button><button className="btn btn-primary" onClick={cleanAndAnalyse} disabled={busy || !loaded}><RefreshCw size={16} className={busy ? "spin" : ""}/>{busy ? "Processing..." : "Clean + analyse"}</button></div>
        </section>

        {error && <div className="alert"><CircleHelp size={17}/><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}

        {activeTab === "overview" && <>
          <section className="pipeline-strip">
            {pipeline.map((p, i) => <React.Fragment key={p.name}><button className={`pipeline-step ${i === 3 ? "last" : ""}`} onClick={() => setActiveTab(i === 0 ? "data" : i === 3 ? "powerbi" : "pipeline")}><div className={`pipeline-icon p${i}`}><p.icon size={18}/></div><div className="pipeline-copy"><b>{p.name}</b><span>{p.detail}</span></div><div className={`step-check ${i < (cleaned ? 4 : loaded ? 1 : 0) ? "done" : ""}`}>{i < (cleaned ? 4 : loaded ? 1 : 0) ? <Check size={12}/> : i+1}</div></button>{i < 3 && <ChevronRight className="pipeline-chevron" size={15}/>}</React.Fragment>)}
          </section>

          <div className="section-heading"><div><h2>Business overview</h2><p>{isDemo ? "Illustrative demo dataset · Replace with your own workbook" : `Current dataset: ${fileName}`}</p></div><span className="updated"><span className="live-dot"/>{cleaned ? "Analysis complete" : "Analysis pending"}</span></div>

          <section className="kpi-grid">
            <Kpi title="Total revenue" value={analysis ? money(k.revenue) : "—"} change="Sales value" icon={BarChart3} tone="teal"/>
            <Kpi title="Orders analysed" value={analysis ? number(k.orders) : "—"} change={`${number(report?.cleaned_rows || data.length)} rows`} icon={FileSpreadsheet} tone="blue"/>
            <Kpi title="Total profit" value={analysis && k.profit != null ? money(k.profit) : "—"} change={k.margin != null && analysis ? `${k.margin}% profit margin` : "Profit column optional"} icon={Activity} tone="amber"/>
            <Kpi title="Data quality score" value={report ? `${report.quality_score}%` : "—"} change={report ? `${report.duplicates_removed} duplicate rows removed` : "Run cleaning to calculate"} icon={ShieldCheck} tone="purple"/>
          </section>

          <section className="chart-grid">
            <div className="panel revenue-panel"><div className="panel-head"><div><h3>Revenue over time</h3><p>Monthly sales performance</p></div><span className="chart-tag">SQL AGGREGATION</span></div>
              {analysis?.monthly?.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analysis.monthly} margin={{top: 12, right: 12, left: 0, bottom: 0}}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#56d6bd" stopOpacity={0.24}/><stop offset="95%" stopColor="#56d6bd" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#25344b" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="month" tick={{fill:"#8392aa",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{fill:"#8392aa",fontSize:11}} axisLine={false} tickLine={false} width={40}/><Tooltip contentStyle={{background:"#111d30",border:"1px solid #2c3b53",borderRadius:12,color:"#fff"}} formatter={v => [money(v), "Revenue"]}/><Area type="monotone" dataKey="revenue" stroke="#56d6bd" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{r:5,fill:"#56d6bd",stroke:"#111d30",strokeWidth:2}}/></AreaChart></ResponsiveContainer></div> : <EmptyChart text="No date + sales fields detected. Check the uploaded column names."/>}
            </div>
            <div className="panel category-panel"><div className="panel-head"><div><h3>Revenue by category</h3><p>Category contribution</p></div><span className="mini-icon"><BarChart3 size={17}/></span></div>
              {analysis?.categories?.length ? <><div className="chart-wrap donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analysis.categories} dataKey="revenue" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={3} stroke="none">{analysis.categories.map((x,i)=><Cell key={x.name} fill={colors[i%colors.length]}/>)}</Pie><Tooltip contentStyle={{background:"#111d30",border:"1px solid #2c3b53",borderRadius:12,color:"#fff"}} formatter={v => money(v)}/></PieChart></ResponsiveContainer></div><div className="legend">{analysis.categories.slice(0,4).map((x,i)=><div key={x.name}><span style={{background:colors[i%colors.length]}}/>{x.name}<b>{money(x.revenue)}</b></div>)}</div></> : <EmptyChart text="Category + sales fields needed for this chart."/>}
            </div>
          </section>

          <section className="lower-grid">
            <div className="panel"><div className="panel-head"><div><h3>Top products</h3><p>Ranked by total revenue</p></div><span className="chart-tag">TOP 10</span></div>
              {analysis?.products?.length ? <div className="product-bars">{analysis.products.slice(0,5).map((p,i)=><div className="product-row" key={p.name}><div className="product-label"><span>{String(i+1).padStart(2,"0")}</span><b>{p.name}</b><strong>{money(p.revenue)}</strong></div><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(3,p.revenue/Math.max(...analysis.products.map(x=>x.revenue),1)*100)}%`,background:colors[i%colors.length]}}/></div></div>)}</div> : <EmptyChart text="Product + sales fields needed."/>}
            </div>
            <div className="panel"><div className="panel-head"><div><h3>Data health</h3><p>Python cleaning report</p></div><span className="mini-icon"><ShieldCheck size={17}/></span></div>
              <div className="health-score"><div className="score-ring"><b>{report?.quality_score ?? "—"}<small>{report ? "%" : ""}</small></b></div><div><b>{cleaned ? "Cleaning complete" : "Ready to clean"}</b><p>{report ? "Quality score is a simple indicator based on detected duplicates and missing cells." : "Upload data and run the cleaning pipeline."}</p></div></div>
              <div className="health-stats"><div><span>Duplicate rows</span><b>{report?.duplicates_removed ?? "—"}</b></div><div><span>Missing cells before fill</span><b>{report?.missing_cells_before_fill ?? "—"}</b></div><div><span>Rows retained</span><b>{report ? `${report.cleaned_rows} / ${report.original_rows}` : "—"}</b></div></div>
            </div>
          </section>
        </>}

        {activeTab === "pipeline" && <section className="workflow-page">
          <div className="section-heading"><div><h2>Your data pipeline</h2><p>Inspect each stage from ingestion to reporting.</p></div></div>
          <div className="stage-list">{pipeline.map((p,i)=><div className="stage-card" key={p.name}><div className={`stage-icon p${i}`}><p.icon size={22}/></div><div className="stage-body"><span className="stage-number">STAGE 0{i+1}</span><h3>{p.name}</h3><p>{["Import raw Excel or CSV data and inspect columns, nulls and duplicate records.","Clean data with Pandas and NumPy: standardise headers, parse dates, coerce numeric fields and fill missing values.","Load curated records into SQLite and calculate revenue, profit, category, region and product summaries with SQL.","Build an interactive report in Power BI Desktop. Publish or embed only with appropriate access controls."][i]}</p><div className="stage-output"><Check size={14}/>{["Raw file + data profile","Cleaned dataframe + quality report","SQL summary tables","Interactive report"][i]}</div></div><div className="stage-status">{i === 0 && loaded ? "DATA LOADED" : i < 3 && cleaned ? "COMPLETE" : i===3 ? "CONNECT REPORT" : "READY"}</div></div>)}</div>
          <div className="panel code-panel"><div className="panel-head"><div><h3>Example SQL query</h3><p>Monthly revenue trend</p></div><Database size={18}/></div><pre>{`SELECT
  substr(CAST("order_date" AS TEXT), 1, 7) AS month,
  ROUND(SUM("sales"), 2) AS revenue
FROM retail_sales
GROUP BY month
ORDER BY month;`}</pre><p className="code-note">The backend uses SQLite for a zero-setup demo. You can adapt the same query pattern to MySQL or PostgreSQL.</p></div>
        </section>}

        {activeTab === "data" && <section className="data-page">
          <div className="section-heading"><div><h2>Dataset explorer</h2><p>Upload a file, inspect the preview, and clean it with Python.</p></div></div>
          <div className="upload-grid">
            <div className="panel upload-panel"><div className="upload-icon"><UploadCloud size={24}/></div><h3>Bring your sales data</h3><p>Supports CSV, XLSX and XLS up to 25 MB.</p><label className="file-drop"><input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files?.[0] || null)}/><FileUp size={20}/><b>{file?.name || "Choose a file to upload"}</b><span>Click to browse your computer</span></label><button className="btn btn-primary full" onClick={uploadFile} disabled={busy || !file}>{busy ? <LoaderCircle className="spin" size={16}/> : <FileUp size={16}/>} Upload dataset</button><button className="btn btn-secondary full" onClick={loadDemo}>Load demo dataset</button><div className="privacy-note"><ShieldCheck size={15}/> File processing runs on your local backend.</div></div>
            <div className="panel"><div className="panel-head"><div><h3>Cleaning report</h3><p>Before and after comparison</p></div><span className="chart-tag">PANDAS + NUMPY</span></div><div className="report-rows">{[["Input rows",report?.original_rows],["Output rows",report?.cleaned_rows],["Duplicate rows removed",report?.duplicates_removed],["Missing cells detected",report?.missing_cells_before_fill],["Missing cells remaining",report?.missing_cells_after_fill],["Output columns",report?.cleaned_columns]].map(([label,val])=><div key={label}><span>{label}</span><b>{val ?? "Run clean + analyse"}</b></div>)}</div><button className="btn btn-primary full" onClick={cleanAndAnalyse} disabled={busy || !loaded}><RefreshCw size={16}/>{busy ? "Processing..." : "Clean + analyse dataset"}</button></div>
          </div>
          <div className="panel table-panel"><div className="panel-head"><div><h3>Data preview</h3><p>Showing {preview.length} matching preview rows</p></div><div className="search-box"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search preview..."/></div></div><DataTable rows={preview} /></div>
        </section>}

        {activeTab === "powerbi" && <section className="powerbi-page">
          <div className="section-heading"><div><h2>Power BI report</h2><p>Connect your portfolio dashboard to a Power BI report.</p></div><span className="chart-tag">OPTIONAL INTEGRATION</span></div>
          <div className="powerbi-hero"><div className="powerbi-logo">P<span>BI</span></div><div><h3>Bring the report into RetailIQ</h3><p>Build your report in Power BI Desktop using the cleaned CSV or SQLite data. Then add a secure embed link below.</p></div></div>
          <div className="panel embed-panel"><label>Power BI secure embed URL</label><input className="text-input" value={powerbiUrl} onChange={e=>setPowerbiUrl(e.target.value)} placeholder="Paste your report embed URL here"/><div className="embed-actions"><button className="btn btn-primary" onClick={()=>setShowPowerBI(true)} disabled={!powerbiUrl.trim()}>Show report</button><a className="text-link" href="../../powerbi/POWER_BI_GUIDE.md" target="_blank" rel="noreferrer">Read setup guide ↗</a></div><p className="code-note">For a production app, use Power BI Embedded with server-side token generation. Do not expose access tokens or secrets in frontend code.</p></div>
          {showPowerBI && powerbiUrl && <div className="panel iframe-panel"><iframe title="Power BI report" src={powerbiUrl} allowFullScreen/><p>If the report does not load, check the embed URL and your Power BI tenant permissions.</p></div>}
          <div className="lower-grid powerbi-cards"><div className="panel"><FileSpreadsheet size={22}/><h3>1. Prepare data</h3><p>Export the cleaned CSV or connect Power BI Desktop to your database.</p></div><div className="panel"><BarChart3 size={22}/><h3>2. Build report</h3><p>Add cards for revenue, orders and profit, plus date, region and category slicers.</p></div><div className="panel"><Layers3 size={22}/><h3>3. Publish securely</h3><p>Publish to your workspace and use the supported embed flow for your audience.</p></div></div>
        </section>}

        <footer className="footer"><div><div className="footer-mark"><BarChart3 size={15}/></div><span>RetailIQ Analytics</span><i>Built for data-driven decisions</i></div><span>Python · SQL · Power BI · React</span></footer>
      </div>
    </main>
  </div>;
}

function Kpi({title,value,change,icon:Icon,tone}) {
  return <div className="kpi-card"><div className="kpi-top"><span>{title}</span><div className={`kpi-icon ${tone}`}><Icon size={18}/></div></div><div className="kpi-value">{value}</div><div className="kpi-bottom"><span className="kpi-bullet"/> {change}</div></div>;
}
function EmptyChart({text}) { return <div className="empty-chart"><BarChart3 size={28}/><span>{text}</span></div>; }
function DataTable({rows}) {
  if (!rows?.length) return <div className="empty-table">No rows match your search. Upload data or load the demo dataset.</div>;
  const cols = Object.keys(rows[0]);
  return <div className="table-scroll"><table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{cols.map(c=><td key={c}>{r[c] == null ? <span className="null-value">null</span> : String(r[c])}</td>)}</tr>)}</tbody></table></div>;
}

export default App;
