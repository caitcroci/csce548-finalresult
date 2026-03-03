import { useEffect, useState, useCallback } from "react";
import { getStudents, getSkills, getInterests, getCareers } from "../api";

function Table({ title, icon, data, columns, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>
          {icon} {title}
          <span className="row-badge" style={{ marginLeft: 8 }}>{data.length} rows</span>
        </h2>
        {loading && <span className="spinner" />}
      </div>
      <div className="table-scroll">
        {data.length === 0 && !loading ? (
          <div className="table-empty">No records found.</div>
        ) : (
          <table>
            <thead>
              <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DataPage() {
  const [data,    setData]    = useState({ students: [], skills: [], interests: [], careers: [] });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [students, skills, interests, careers] = await Promise.all([
        getStudents(), getSkills(), getInterests(), getCareers(),
      ]);
      setData({
        students:  Array.isArray(students)  ? students  : [],
        skills:    Array.isArray(skills)    ? skills    : [],
        interests: Array.isArray(interests) ? interests : [],
        careers:   Array.isArray(careers)   ? careers   : [],
      });
    } catch (e) {
      setError("Cannot reach API. Make sure your Spark server is running on port 4567.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const idCell  = (v) => <span className="td-id">{v}</span>;
  const catCell = (v) => v ? <span className="td-cat">{v}</span> : "—";
  const descCell = (v) =>
    v ? <span className="td-desc">{v.length > 90 ? v.slice(0, 90) + "…" : v}</span> : "—";

  return (
    <div>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h1>Database <em>Explorer</em></h1>
          <p>Live read of all records from your MySQL tables via the REST API.</p>
        </div>
        <button className="refresh-btn" onClick={load}>↻ Refresh All</button>
      </div>

      {error && (
        <div className="error-bar">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="explorer-grid">
        <Table
          title="Students" icon="👤"
          data={data.students} loading={loading}
          columns={[
            { key: "studentId",   label: "ID",   render: idCell },
            { key: "name",        label: "Name" },
          ]}
        />
        <Table
          title="Skills" icon="⚡"
          data={data.skills} loading={loading}
          columns={[
            { key: "skillId",   label: "ID",         render: idCell },
            { key: "skillName", label: "Skill Name" },
          ]}
        />
        <Table
          title="Interests" icon="🔬"
          data={data.interests} loading={loading}
          columns={[
            { key: "interestId",   label: "ID",            render: idCell },
            { key: "interestName", label: "Interest Name" },
          ]}
        />
        <Table
          title="Careers" icon="🎯"
          data={data.careers} loading={loading}
          columns={[
            { key: "careerId",     label: "ID",          render: idCell  },
            { key: "title",        label: "Title"                         },
            { key: "category",     label: "Category",    render: catCell  },
            { key: "description",  label: "Description", render: descCell },
          ]}
        />
      </div>
    </div>
  );
}

export default DataPage;