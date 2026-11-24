import { useEffect, useMemo, useState } from "react";
import {
  api, errorMessage, STATUSES,
  type Application, type ApplicationInput, type Status,
} from "../api";
import { useAuth } from "../auth";
import ApplicationModal from "../components/ApplicationModal";

const toInput = (a: Application, status: Status = a.status): ApplicationInput => ({
  company: a.company,
  role: a.role,
  source: a.source,
  status,
  appliedOn: a.appliedOn.slice(0, 10),
  offeredCtc: a.offeredCtc,
  notes: a.notes,
});

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short",year: "2-digit" });

export default function ApplicationsPage() {
  const { email, role, logout } = useAuth();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);

  const load = async () => {
    try {
      const res = await api.get<Application[]>("/Applications");
      setItems(res.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const count = (s: Status) => items.filter((a) => a.status === s).length;
    return {
      total: items.length,
      applied: count("Applied"),
      interview: count("Interview"),
      offer: count("Offer"),
      rejected: count("Rejected"),
    };
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (a) => !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
  }, [items, query]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a: Application) => { setEditing(a); setModalOpen(true); };

  const save = async (data: ApplicationInput) => {
    if (editing) await api.put(`/Applications/${editing.id}`, data);
    else await api.post("/Applications", data);
    setModalOpen(false);
    await load();
  };

  const remove = async (a: Application) => {
    if (!window.confirm(`Delete ${a.company} - ${a.role}?`)) return;
    try {
      await api.delete(`/Applications/${a.id}`);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // optimistic update: change the card at once, roll back if the API fails
  const changeStatus = async (a: Application, status: Status) => {
    const before = items;
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, status } : x)));
    try {
      await api.put(`/Applications/${a.id}`, toInput(a, status));
    } catch (err) {
      setItems(before);
      setError(errorMessage(err));
    }
  };

  const columns = filter === "All" ? STATUSES : [filter];

  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="logo">&#10022;</span>Job Tracker</div>
        <div className="user-chip">
          {email} <span className="role-pill">{role}</span>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div className="stats">
          <div className="stat"><div className="num">{stats.total}</div><div className="label">Total applications</div></div>
          <div className="stat applied"><div className="num">{stats.applied}</div><div className="label">Applied</div></div>
          <div className="stat interview"><div className="num">{stats.interview}</div><div className="label">In interview</div></div>
          <div className="stat offer"><div className="num">{stats.offer}</div><div className="label">Offers</div></div>
          <div className="stat rejected"><div className="num">{stats.rejected}</div><div className="label">Rejected</div></div>
        </div>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Search company or role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="chips">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                className={`chip ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ New application</button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        {!loading && (
          <div className="board">
            {columns.map((status) => {
              const cards = visible.filter((a) => a.status === status);
              return (
                <div className="column" key={status}>
                  <div className="column-head">
                    <span><span className={`dot ${status.toLowerCase()}`} />{status}</span>
                    <span className="count">{cards.length}</span>
                  </div>
                  {cards.length === 0 && <div className="empty">Nothing here yet</div>}
                  {cards.map((a) => (
                    <article className={`card ${a.status.toLowerCase()}`} key={a.id}>
                      <div className="card-top">
                        <h4>{a.company}</h4>
                        <span className="date">{formatDate(a.appliedOn)}</span>
                      </div>
                      <p className="role">{a.role}</p>
                      <div className="meta">
                        <span className="tag">{a.source}</span>
                        {a.offeredCtc != null && <span className="ctc">{a.offeredCtc} LPA</span>}
                      </div>
                      {a.notes && <p className="notes">{a.notes}</p>}
                      <div className="card-actions">
                        <select
                          value={a.status}
                          onChange={(e) => changeStatus(a, e.target.value as Status)}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <button className="icon" onClick={() => openEdit(a)}>Edit</button>
                        <button className="icon danger" onClick={() => remove(a)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <ApplicationModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      )}
    </>
  );
}