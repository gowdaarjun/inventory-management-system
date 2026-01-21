import { useEffect, useState } from "react";
import {
  FaTrash, FaEdit, FaSave, FaBox,
  FaExclamationTriangle, FaTags,
  FaDownload, FaSearch
} from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement, CategoryScale,
  LinearScale, Tooltip, Legend
} from "chart.js";
import "./App.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API = "http://127.0.0.1:8000";

export default function App() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    total_units: 0,
    critical_stock: 0,
    item_groups: 0
  });

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: 0,
    threshold: 0,
    location: ""
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // -------- LOAD DATA ----------
  const load = async () => {
    try {
      const i = await fetch(`${API}/inventory`).then(r => r.json());
      const a = await fetch(`${API}/inventory/alerts`).then(r => r.json());
      const s = await fetch(`${API}/inventory/metrics`).then(r => r.json());

      setItems(Array.isArray(i) ? i : []);
      setAlerts(Array.isArray(a) ? a : []);
      setSummary({
        total_units: s.total_units || 0,
        critical_stock: s.critical_stock || 0,
        item_groups: s.item_groups || 0
      });
    } catch (err) {
      console.error("Load failed", err);
    }
  };

  useEffect(() => { load(); }, []);

  // -------- CRUD ----------
  const add = async () => {
    await fetch(`${API}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ name: "", category: "", quantity: 0, threshold: 0, location: "" });
    load();
  };

  const del = async (id) => {
    await fetch(`${API}/inventory/${id}`, { method: "DELETE" });
    load();
  };

  const save = async (id) => {
    await fetch(`${API}/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setEditId(null);
    load();
  };

  // -------- CSV ----------
  const exportCSV = () => {
    const csv = [
      ["Name", "Category", "Qty", "Threshold", "Location"],
      ...items.map(i => [i.name, i.category, i.quantity, i.threshold, i.location])
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inventory.csv";
    a.click();
  };

  const uploadCSV = (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const rows = reader.result.split("\n");
      for (let r of rows) {
        const [name, category, quantity, threshold, location] = r.split(",");
        if (name) {
          await fetch(`${API}/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              category,
              quantity: +quantity,
              threshold: +threshold,
              location
            })
          });
        }
      }
      load();
    };
    reader.readAsText(file);
  };

  // -------- FILTER + PAGINATION ----------
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="app">
      <h1>Manufacturing Inventory Dashboard</h1>

      <div className="cards">
        <div><FaBox /> Total {summary.total_units}</div>
        <div><FaExclamationTriangle /> Low {summary.critical_stock}</div>
        <div><FaTags /> Categories {summary.item_groups}</div>
      </div>

      <div className="topRow">
        <div className="chartBox">
          <h3>Stock Status</h3>
          <div className="chartWrap">
            <Bar
              options={{ responsive: true, maintainAspectRatio: false }}
              data={{
                labels: ["Safe", "Low"],
                datasets: [{
                  label: "Stock",
                  data: [
                    summary.total_units - summary.critical_stock,
                    summary.critical_stock
                  ],
                  backgroundColor: ["#00ffcc", "#ff4444"]
                }]
              }}
            />
          </div>
        </div>
      </div>

      <div className="toolbar">
        <FaSearch />
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={exportCSV}><FaDownload /> Export</button>
        <input type="file" accept=".csv" onChange={e => uploadCSV(e.target.files[0])} />
      </div>

      <div className="form">
        {["name", "category", "location"].map(k =>
          <input key={k} placeholder={k} value={form[k]}
            onChange={e => setForm({ ...form, [k]: e.target.value })} />
        )}
        {["quantity", "threshold"].map(k =>
          <input key={k} type="number" value={form[k]}
            onChange={e => setForm({ ...form, [k]: +e.target.value })} />
        )}
        <button onClick={add}>Add</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th><th>Category</th><th>Qty</th>
            <th>Threshold</th><th>Location</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(i => (
            <tr key={i.id} className={i.quantity < i.threshold ? "low" : ""}>
              {editId === i.id ? (
                <>
                  <td><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></td>
                  <td><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></td>
                  <td><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} /></td>
                  <td><input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: +e.target.value })} /></td>
                  <td><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></td>
                  <td><FaSave onClick={() => save(i.id)} /></td>
                </>
              ) : (
                <>
                  <td>{i.name}</td>
                  <td>{i.category}</td>
                  <td>{i.quantity}</td>
                  <td>{i.threshold}</td>
                  <td>{i.location}</td>
                  <td>
                    <FaEdit onClick={() => { setEditId(i.id); setForm(i); }} />
                    <FaTrash onClick={() => del(i.id)} />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pager">
        <button onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
      </div>

      <div className="alerts">
        <h3>Live Alerts</h3>
        {alerts.map(a => <p key={a.id}>⚠ {a.name} low</p>)}
      </div>
    </div>
  );
}