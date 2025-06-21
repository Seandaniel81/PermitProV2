import { createRoot } from "react-dom/client";

function App() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#f3f4f6",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        width: "400px",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
          Permit Tracker Login
        </h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email: formData.get("email"),
              password: formData.get("password")
            }),
          }).then(async (res) => {
            const result = await res.json();
            if (res.ok && result.success) {
              window.location.href = "/dashboard";
            } else {
              alert(result.error || "Login failed");
            }
          }).catch(() => alert("Network error"));
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <input
              name="email"
              type="email"
              placeholder="Email"
              defaultValue="admin@system.local"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              defaultValue="admin123"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <button 
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
