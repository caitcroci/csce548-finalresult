import { useEffect, useState } from "react";
import {
  getSkills,
  getInterests,
  getCareers,
  getAllRequirements,
  scoreAndRankCareers,
} from "../api";
import CareerCard from "../components/CareerCard";

const WORK_STYLES = [
  { key: "software",   emoji: "💻", label: "Software"   },
  { key: "hands-on",   emoji: "🔧", label: "Hands-On"   },
  { key: "research",   emoji: "🔬", label: "Research"    },
  { key: "leadership", emoji: "🎯", label: "Leadership"  },
];

function MatchPage() {
  const [skills,    setSkills]    = useState([]);
  const [interests, setInterests] = useState([]);
  const [careers,   setCareers]   = useState([]);
  const [requirements, setRequirements] = useState([]);

  const [selectedSkills,    setSelectedSkills]    = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [workStyle, setWorkStyle] = useState("");

  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [running,  setRunning]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sk, int, car] = await Promise.all([
          getSkills(), getInterests(), getCareers(),
        ]);
        setSkills(Array.isArray(sk)  ? sk  : []);
        setInterests(Array.isArray(int) ? int : []);
        setCareers(Array.isArray(car)  ? car  : []);
        const reqs = await getAllRequirements(Array.isArray(car) ? car : []);
        setRequirements(reqs);
      } catch (e) {
        setError(
          "Could not connect to the API at http://localhost:4567. " +
          "Make sure your Spark server is running: mvn exec:java \"-Dexec.mainClass=ApiServer\""
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id, list, setter) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleMatch = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 350)); // brief suspense
    const ranked = scoreAndRankCareers(
      careers, requirements, skills, interests,
      selectedSkills, selectedInterests, workStyle
    );
    setResults(ranked);
    setRunning(false);
  };

  const canRun = selectedSkills.length > 0 || selectedInterests.length > 0;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading skills, interests & careers from database…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Find Your <em>Career Path</em></h1>
        <p>Select what you know and what you love — the algorithm does the rest.</p>
      </div>

      {error && (
        <div className="error-bar">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1 — Skills */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">1</span>Your Skills</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--ink2)" }}>Select all that apply</span>
        </div>
        <div className="card-body">
          <div className="pill-grid">
            {skills.map((s) => (
              <div
                key={s.skillId}
                className={`pill ${selectedSkills.includes(s.skillId) ? "selected-skill" : ""}`}
                onClick={() => toggle(s.skillId, selectedSkills, setSelectedSkills)}
              >
                {s.skillName}
              </div>
            ))}
            {skills.length === 0 && (
              <span style={{ color: "var(--ink2)", fontSize: "0.8rem" }}>
                No skills found in database.
              </span>
            )}
          </div>
          <div className="count-label">
            <strong>{selectedSkills.length}</strong> selected
          </div>
        </div>
      </div>

      {/* Step 2 — Interests */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">2</span>Your Interests</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--ink2)" }}>Select all that apply</span>
        </div>
        <div className="card-body">
          <div className="pill-grid">
            {interests.map((i) => (
              <div
                key={i.interestId}
                className={`pill ${selectedInterests.includes(i.interestId) ? "selected-interest" : ""}`}
                onClick={() => toggle(i.interestId, selectedInterests, setSelectedInterests)}
              >
                {i.interestName}
              </div>
            ))}
            {interests.length === 0 && (
              <span style={{ color: "var(--ink2)", fontSize: "0.8rem" }}>
                No interests found in database.
              </span>
            )}
          </div>
          <div className="count-label">
            <strong>{selectedInterests.length}</strong> selected
          </div>
        </div>
      </div>

      {/* Step 3 — Work Style */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">3</span>Preferred Work Style</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--ink2)" }}>Optional — boosts matching</span>
        </div>
        <div className="card-body">
          <div className="style-grid">
            {WORK_STYLES.map((ws) => (
              <div
                key={ws.key}
                className={`style-card ${workStyle === ws.key ? "selected" : ""}`}
                onClick={() => setWorkStyle(workStyle === ws.key ? "" : ws.key)}
              >
                <span className="style-emoji">{ws.emoji}</span>
                {ws.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Run */}
      <button className="run-btn" onClick={handleMatch} disabled={!canRun || running}>
        {running ? (
          <><span className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Calculating…</>
        ) : (
          "→ Find Career Matches"
        )}
      </button>

      {/* Results */}
      {results !== null && (
        <div className="results-section">
          <div className="results-heading">
            Top Matches
            <span className="results-count">{results.length} found</span>
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">🔍</span>
              No matches found. Try selecting more skills or interests.
            </div>
          ) : (
            <div className="career-grid">
              {results.map((career, idx) => (
                <CareerCard key={career.careerId} career={career} rank={idx + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MatchPage;