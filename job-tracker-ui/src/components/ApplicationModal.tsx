import { useState, type FormEvent } from "react";
import { STATUSES, errorMessage, type Application, type ApplicationInput, type Status } from "../api";

interface Props {
  initial: Application | null;
  onClose: () => void;
  onSave: (data: ApplicationInput) => Promise<void>;
}

const SOURCES = ["Naukri", "LinkedIn", "Referral", "Agency", "Company site", "Other"];

export default function ApplicationModal({ initial, onClose, onSave }: Props) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [source, setSource] = useState(initial?.source ?? "Naukri");
  const [status, setStatus] = useState<Status>(initial?.status ?? "Applied");
  const [appliedOn, setAppliedOn] = useState(
    initial?.appliedOn.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [ctc, setCtc] = useState(initial?.offeredCtc?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("Company and role are required.");
      return;
    }
    const ctcNum = ctc.trim() === "" ? null : Number(ctc);
    if (ctcNum !== null && (Number.isNaN(ctcNum) || ctcNum < 0 || ctcNum > 1000)) {
      setError("Offered CTC must be a number between 0 and 1000 (LPA).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({
        company: company.trim(),
        role: role.trim(),
        source,
        status,
        appliedOn,
        offeredCtc: ctcNum,
        notes: notes.trim() === "" ? null : notes.trim(),
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{initial ? "Edit application" : "New application"}</h3>
        <div className="form-grid">
          <div className="field">
            <label>Company *</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} />
          </div>
          <div className="field">
            <label>Role *</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={100} />
          </div>
          <div className="field">
            <label>Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Applied on</label>
            <input type="date" value={appliedOn} onChange={(e) => setAppliedOn(e.target.value)} />
          </div>
          <div className="field">
            <label>Offered CTC (LPA)</label>
            <input value={ctc} onChange={(e) => setCtc(e.target.value)} placeholder="e.g. 14" />
          </div>
          <div className="field full">
            <label>Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </div>
        </div>
        {error && <p className="err">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}