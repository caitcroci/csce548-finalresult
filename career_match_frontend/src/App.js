import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import MatchPage from "./pages/MatchPage";
import DataPage  from "./pages/DataPage";
import "./index.css";

const API_BASE = "http://localhost:4567/api";

function Shell() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [apiLive, setApiLive] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/students`)
      .then(() => setApiLive(true))
      .catch(() => setApiLive(false));
  }, []);

  const on = (path) => location.pathname === path;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-mark" />
          Path<span>Finder</span>
        </div>
        <div className="api-pill">
          <div className={`api-pill-dot ${apiLive === true ? "live" : apiLive === false ? "dead" : ""}`} />
          {apiLive === true  ? "API LIVE"    :
           apiLive === false ? "API OFFLINE" : "CHECKING…"}
        </div>
      </header>

      {/* ── Nav ── */}
      <nav className="nav">
        <button
          className={`nav-link ${on("/") ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <span className="nav-num">1</span>
          Career Matcher
        </button>
        <button
          className={`nav-link ${on("/data") ? "active" : ""}`}
          onClick={() => navigate("/data")}
        >
          <span className="nav-num">2</span>
          Data Explorer
        </button>
      </nav>

      {/* ── Pages ── */}
      <main>
        <Routes>
          <Route path="/"     element={<MatchPage />} />
          <Route path="/data" element={<DataPage  />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;