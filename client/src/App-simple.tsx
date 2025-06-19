import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("admin@system.local");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMessage(`Login failed: ${result.error || result.message || "Unknown error"}`);
      }
    } catch (error) {
      setMessage(`Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

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
        
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>
        
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: loading ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        {message && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "4px",
            backgroundColor: message.includes("successful") ? "#dcfce7" : "#fef2f2",
            color: message.includes("successful") ? "#166534" : "#dc2626",
            border: `1px solid ${message.includes("successful") ? "#bbf7d0" : "#fecaca"}`
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}