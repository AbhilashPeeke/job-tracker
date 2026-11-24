import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { errorMessage } from "../api";

export default function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

    return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="logo">&#10022;</span>Job Tracker</div>
        <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
        <form onSubmit={submit}>
            <label className="field-label" htmlFor="email">Email</label>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
            <label className="field-label" htmlFor="password">Password</label>

          <input type="password" placeholder="Password (8+ characters)" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}
          </button>
        </form>
        {error && <p className="err">{error}</p>}
        <p className="auth-switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" className="link-btn"
            onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}