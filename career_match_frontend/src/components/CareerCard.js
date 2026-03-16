import { useState } from "react";
import { updateCareer } from "../api";

function CareerCard({ career, rank, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(career.title);
  const [cat,     setCat]     = useState(career.category || "");
  const [desc,    setDesc]    = useState(career.description || "");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState(null);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await updateCareer(career.careerId, title.trim(), cat.trim(), desc.trim());
      onUpdate?.(updated);
      setEditing(false);
    } catch (e) {
      setErr("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(career.title);
    setCat(career.category || "");
    setDesc(career.description || "");
    setErr(null);
    setEditing(false);
  };

  const inputStyle = {
    padding: "0.35rem 0.55rem",
    borderRadius: 6,
    border: "1px solid var(--ink3)",
    fontSize: "0.82rem",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className={`career-card ${rank === 1 ? "rank-1" : ""}`}>
      <div className="rank-box">#{rank}</div>

      <div style={{ flex: 1 }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <input
              style={inputStyle}
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Category"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            />
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
              placeholder="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            {err && <span style={{ color: "#c0392b", fontSize: "0.75rem" }}>{err}</span>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                style={{
                  padding: "0.3rem 0.8rem", borderRadius: 6, fontSize: "0.8rem",
                  background: "var(--accent, #2563eb)", color: "#fff", border: "none", cursor: "pointer",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "0.3rem 0.8rem", borderRadius: 6, fontSize: "0.8rem",
                  background: "transparent", border: "1px solid var(--ink3)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="career-title">{career.title}</div>
              <button
                onClick={() => setEditing(true)}
                title="Edit career"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.85rem", padding: "0 0.2rem", opacity: 0.55,
                }}
              >
                ✏️
              </button>
            </div>
            <span className="career-cat">{career.category}</span>
            {career.description && (
              <p className="career-desc">{career.description}</p>
            )}
            <div className="match-tags">
              {career.matchedSkills?.map((s) => (
                <span key={s} className="tag tag-skill">✦ {s}</span>
              ))}
              {career.matchedInterests?.map((i) => (
                <span key={i} className="tag tag-interest">◆ {i}</span>
              ))}
              {!career.matchedSkills?.length && !career.matchedInterests?.length && (
                <span className="tag tag-skill">✦ Category match</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="score-box">
        <div className="score-num">{career.score}</div>
        <div className="score-label">pts</div>
      </div>
    </div>
  );
}

export default CareerCard;