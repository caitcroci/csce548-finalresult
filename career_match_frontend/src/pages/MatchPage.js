import { useEffect, useState } from "react";
import {
  getStudents, getSkills, getInterests, getCareers, getAllRequirements,
  scoreAndRankCareers, createStudent, createSkill, createInterest,
  createCareer, updateCareer, deleteCareer,
} from "../api";
import CareerCard from "../components/CareerCard";

const WORK_STYLES = [
  { key: "software",   emoji: "💻", label: "Software"   },
  { key: "hands-on",   emoji: "🔧", label: "Hands-On"   },
  { key: "research",   emoji: "🔬", label: "Research"    },
  { key: "leadership", emoji: "🎯", label: "Leadership"  },
];

const ADMIN_ID = -10;

const addBtnStyle = {
  padding: "0.35rem 0.8rem", borderRadius: 6, fontSize: "0.8rem",
  cursor: "pointer", border: "1px solid var(--ink3)", background: "transparent",
  whiteSpace: "nowrap",
};
const addInputStyle = {
  padding: "0.35rem 0.6rem", borderRadius: 6,
  border: "1px solid var(--ink3)", fontSize: "0.82rem", minWidth: 180,
};

/* ── Admin career editor sub-component ── */
function AdminCareerEditor({ careers, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [title,     setTitle]     = useState("");
  const [cat,       setCat]       = useState("");
  const [desc,      setDesc]      = useState("");
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState(null);

  const startEdit = (career) => {
    setEditingId(career.careerId);
    setTitle(career.title);
    setCat(career.category || "");
    setDesc(career.description || "");
    setErr(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setErr(null);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await updateCareer(editingId, title.trim(), cat.trim(), desc.trim());
      onUpdate(updated);
      setEditingId(null);
    } catch (e) {
      setErr("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2fr auto",
    gap: "0.5rem",
    alignItems: "center",
    padding: "0.4rem 0",
    borderBottom: "1px solid var(--ink3)",
    fontSize: "0.82rem",
  };

  const inputStyle = {
    padding: "0.3rem 0.5rem",
    borderRadius: 6,
    border: "1px solid var(--ink3)",
    fontSize: "0.82rem",
    width: "100%",
    boxSizing: "border-box",
  };

  const btnStyle = (color) => ({
    padding: "0.3rem 0.7rem",
    borderRadius: 6,
    fontSize: "0.78rem",
    cursor: "pointer",
    border: "none",
    background: color,
    color: "#fff",
    whiteSpace: "nowrap",
  });

  if (careers.length === 0) {
    return <p style={{ fontSize: "0.8rem", color: "var(--ink2)" }}>No careers in database.</p>;
  }

  return (
    <div style={{ maxHeight: 320, overflowY: "auto" }}>
      {/* Header row */}
      <div style={{ ...rowStyle, fontWeight: 600, borderBottom: "2px solid var(--ink3)" }}>
        <span>Title</span>
        <span>Category</span>
        <span>Description</span>
        <span></span>
      </div>

      {careers.map((career) =>
        editingId === career.careerId ? (
          <div key={career.careerId} style={{ ...rowStyle, background: "var(--surface2, #f8f9fa)", borderRadius: 6, padding: "0.5rem" }}>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
            <input style={inputStyle} value={cat}   onChange={(e) => setCat(e.target.value)}   placeholder="Category" />
            <input style={inputStyle} value={desc}  onChange={(e) => setDesc(e.target.value)}  placeholder="Description" />
            <div style={{ display: "flex", gap: "0.35rem", flexDirection: "column" }}>
              <button onClick={handleSave} disabled={saving || !title.trim()} style={btnStyle("#2563eb")}>
                {saving ? "…" : "Save"}
              </button>
              <button onClick={cancelEdit} style={btnStyle("#6b7280")}>Cancel</button>
              {err && <span style={{ color: "#c0392b", fontSize: "0.7rem" }}>{err}</span>}
            </div>
          </div>
        ) : (
          <div key={career.careerId} style={rowStyle}>
            <span style={{ fontWeight: 500 }}>{career.title}</span>
            <span style={{ color: "var(--ink2)" }}>{career.category || "—"}</span>
            <span style={{ color: "var(--ink2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {career.description
                ? career.description.length > 60
                  ? career.description.slice(0, 60) + "…"
                  : career.description
                : "—"}
            </span>
            <button onClick={() => startEdit(career)} style={btnStyle("#2563eb")}>✏️ Edit</button>
          </div>
        )
      )}
    </div>
  );
}

/* ── Main page ── */
function MatchPage() {
  const [students,  setStudents]  = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [newStudentName,  setNewStudentName]  = useState("");

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

  // Add skill
  const [newSkillName, setNewSkillName] = useState("");
  const [addingSkill,  setAddingSkill]  = useState(false);

  // Add interest
  const [newInterestName, setNewInterestName] = useState("");
  const [addingInterest,  setAddingInterest]  = useState(false);

  // Admin — add career
  const [newCareerTitle,    setNewCareerTitle]    = useState("");
  const [newCareerCategory, setNewCareerCategory] = useState("");
  const [newCareerDesc,     setNewCareerDesc]     = useState("");

  // Admin — delete career
  const [deleteCareerSelected, setDeleteCareerSelected] = useState("");

  const isAdmin = Number(selectedStudent) === ADMIN_ID;

  useEffect(() => {
    (async () => {
      try {
        const [st, sk, int, car] = await Promise.all([
          getStudents(), getSkills(), getInterests(), getCareers(),
        ]);
        setStudents(Array.isArray(st)  ? st  : []);
        setSkills(Array.isArray(sk)    ? sk  : []);
        setInterests(Array.isArray(int) ? int : []);
        setCareers(Array.isArray(car)  ? car  : []);
        const reqs = await getAllRequirements(Array.isArray(car) ? car : []);
        setRequirements(reqs);
      } catch (e) {
        setError(
          "Could not connect to the API at http://localhost:4567. " +
          "Make sure your Spark server is running."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id, list, setter) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleAddStudent = async () => {
    const name = newStudentName.trim();
    if (!name) return;
    try {
      const created = await createStudent(name);
      setStudents((prev) => [...prev, created]);
      setSelectedStudent(String(created.studentId));
      setNewStudentName("");
    } catch (e) { alert("Failed to add student: " + e.message); }
  };

  const handleAddSkill = async () => {
    const name = newSkillName.trim();
    if (!name) return;
    setAddingSkill(true);
    try {
      const created = await createSkill(name);
      setSkills((prev) => [...prev, created]);
      setNewSkillName("");
    } catch (e) { alert("Failed to add skill: " + e.message); }
    finally { setAddingSkill(false); }
  };

  const handleAddInterest = async () => {
    const name = newInterestName.trim();
    if (!name) return;
    setAddingInterest(true);
    try {
      const created = await createInterest(name);
      setInterests((prev) => [...prev, created]);
      setNewInterestName("");
    } catch (e) { alert("Failed to add interest: " + e.message); }
    finally { setAddingInterest(false); }
  };

  const handleAddCareer = async () => {
    const title = newCareerTitle.trim();
    if (!title) return;
    try {
      const created = await createCareer(title, newCareerCategory.trim(), newCareerDesc.trim());
      setCareers((prev) => [...prev, created]);
      setNewCareerTitle(""); setNewCareerCategory(""); setNewCareerDesc("");
    } catch (e) { alert("Failed to add career: " + e.message); }
  };

  const handleDeleteCareer = async () => {
    if (!deleteCareerSelected) return;
    if (!window.confirm("Delete this career?")) return;
    try {
      await deleteCareer(Number(deleteCareerSelected));
      setCareers((prev) => prev.filter((c) => String(c.careerId) !== deleteCareerSelected));
      setDeleteCareerSelected("");
    } catch (e) { alert("Failed to delete career: " + e.message); }
  };

  const handleCareerUpdate = (updated) => {
    setCareers((prev) => prev.map((c) => c.careerId === updated.careerId ? updated : c));
    setResults((prev) =>
      prev ? prev.map((c) => c.careerId === updated.careerId ? { ...c, ...updated } : c) : prev
    );
  };

  const handleMatch = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 350));
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
        <div className="error-bar"><span>⚠️</span><span>{error}</span></div>
      )}

      {/* ── Student selector ── */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">0</span>Who are you?</h2>
        </div>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--ink3)", fontSize: "0.85rem", minWidth: 180 }}
          >
            <option value="">— Select a student —</option>
            {students.map((s) => (
              <option key={s.studentId} value={s.studentId}>{s.name}</option>
            ))}
          </select>
          <input
            type="text" placeholder="New student name…"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
            style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--ink3)", fontSize: "0.85rem", minWidth: 180 }}
          />
          <button onClick={handleAddStudent} disabled={!newStudentName.trim()}
            style={{ padding: "0.4rem 0.9rem", borderRadius: 6, fontSize: "0.85rem", cursor: "pointer" }}>
            + Add Student
          </button>
        </div>
      </div>

      {/* ── Admin panel ── */}
      {isAdmin && (
        <div className="card" style={{ borderColor: "var(--accent, #e67e22)", borderWidth: 2 }}>
          <div className="card-header"><h2>🔒 Admin — Manage Careers</h2></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Add Career */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.85rem" }}>Add Career</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <input type="text" placeholder="Title *" value={newCareerTitle}
                  onChange={(e) => setNewCareerTitle(e.target.value)}
                  style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--ink3)", fontSize: "0.85rem", minWidth: 160 }} />
                <input type="text" placeholder="Category" value={newCareerCategory}
                  onChange={(e) => setNewCareerCategory(e.target.value)}
                  style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--ink3)", fontSize: "0.85rem", minWidth: 140 }} />
                <input type="text" placeholder="Description" value={newCareerDesc}
                  onChange={(e) => setNewCareerDesc(e.target.value)}
                  style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--ink3)", fontSize: "0.85rem", minWidth: 200 }} />
                <button onClick={handleAddCareer} disabled={!newCareerTitle.trim()}
                  style={{ padding: "0.4rem 0.9rem", borderRadius: 6, fontSize: "0.85rem", cursor: "pointer" }}>
                  + Add Career
                </button>
              </div>
            </div>

            {/* Edit Career */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.85rem" }}>Edit Career</div>
              <AdminCareerEditor careers={careers} onUpdate={handleCareerUpdate} />
            </div>

            {/* Delete Career */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.85rem" }}>Delete Career</div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <select value={deleteCareerSelected} onChange={(e) => setDeleteCareerSelected(e.target.value)}
                  style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--ink3)", fontSize: "0.85rem", minWidth: 200 }}>
                  <option value="">— Select career to delete —</option>
                  {careers.map((c) => <option key={c.careerId} value={c.careerId}>{c.title}</option>)}
                </select>
                <button onClick={handleDeleteCareer} disabled={!deleteCareerSelected}
                  style={{ padding: "0.4rem 0.9rem", borderRadius: 6, fontSize: "0.85rem", cursor: "pointer", background: "#c0392b", color: "#fff", border: "none" }}>
                  Delete Career
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Step 1: Skills ── */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">1</span>Your Skills</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--ink2)" }}>Select all that apply</span>
        </div>
        <div className="card-body">
          <div className="pill-grid">
            {skills.map((s) => (
              <div key={s.skillId}
                className={`pill ${selectedSkills.includes(s.skillId) ? "selected-skill" : ""}`}
                onClick={() => toggle(s.skillId, selectedSkills, setSelectedSkills)}>
                {s.skillName}
              </div>
            ))}
            {skills.length === 0 && (
              <span style={{ color: "var(--ink2)", fontSize: "0.8rem" }}>No skills found in database.</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <input
              type="text" placeholder="New skill name…"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              style={addInputStyle}
            />
            <button onClick={handleAddSkill} disabled={!newSkillName.trim() || addingSkill} style={addBtnStyle}>
              {addingSkill ? "Adding…" : "+ Add Skill"}
            </button>
          </div>
          <div className="count-label"><strong>{selectedSkills.length}</strong> selected</div>
        </div>
      </div>

      {/* ── Step 2: Interests ── */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">2</span>Your Interests</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--ink2)" }}>Select all that apply</span>
        </div>
        <div className="card-body">
          <div className="pill-grid">
            {interests.map((i) => (
              <div key={i.interestId}
                className={`pill ${selectedInterests.includes(i.interestId) ? "selected-interest" : ""}`}
                onClick={() => toggle(i.interestId, selectedInterests, setSelectedInterests)}>
                {i.interestName}
              </div>
            ))}
            {interests.length === 0 && (
              <span style={{ color: "var(--ink2)", fontSize: "0.8rem" }}>No interests found in database.</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <input
              type="text" placeholder="New interest name…"
              value={newInterestName}
              onChange={(e) => setNewInterestName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddInterest()}
              style={addInputStyle}
            />
            <button onClick={handleAddInterest} disabled={!newInterestName.trim() || addingInterest} style={addBtnStyle}>
              {addingInterest ? "Adding…" : "+ Add Interest"}
            </button>
          </div>
          <div className="count-label"><strong>{selectedInterests.length}</strong> selected</div>
        </div>
      </div>

      {/* ── Step 3: Work Style ── */}
      <div className="card">
        <div className="card-header">
          <h2><span className="step-badge">3</span>Preferred Work Style</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--ink2)" }}>Optional — boosts matching</span>
        </div>
        <div className="card-body">
          <div className="style-grid">
            {WORK_STYLES.map((ws) => (
              <div key={ws.key}
                className={`style-card ${workStyle === ws.key ? "selected" : ""}`}
                onClick={() => setWorkStyle(workStyle === ws.key ? "" : ws.key)}>
                <span className="style-emoji">{ws.emoji}</span>
                {ws.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Run ── */}
      <button className="run-btn" onClick={handleMatch} disabled={!canRun || running}>
        {running ? (
          <><span className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Calculating…</>
        ) : "→ Find Career Matches"}
      </button>

      {/* ── Results ── */}
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
                <CareerCard
                  key={career.careerId}
                  career={career}
                  rank={idx + 1}
                  onUpdate={handleCareerUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MatchPage;