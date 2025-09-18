/**
 * Production Environment Debug Component
 * Add this temporarily to debug environment variables in production
 */
export function ProductionEnvDebug() {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_SPOONACULAR_API_KEY: import.meta.env.VITE_SPOONACULAR_API_KEY,
  };

  const allEnvVars = import.meta.env;

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        margin: "20px",
        border: "2px solid #ff6b6b",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      <h3 style={{ color: "#ff6b6b", marginTop: 0 }}>
        🔍 Production Environment Debug
      </h3>

      <div style={{ marginBottom: "20px" }}>
        <h4>Required Environment Variables:</h4>
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} style={{ margin: "5px 0" }}>
            <strong>{key}:</strong> {value ? "✅ Set" : "❌ Missing"}
            {value && (
              <span style={{ color: "#666", marginLeft: "10px" }}>
                ({value.length > 30 ? `${value.substring(0, 30)}...` : value})
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>All VITE_ Environment Variables:</h4>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
            overflow: "auto",
            maxHeight: "200px",
          }}
        >
          {JSON.stringify(
            Object.fromEntries(
              Object.entries(allEnvVars).filter(([key]) =>
                key.startsWith("VITE_")
              )
            ),
            null,
            2
          )}
        </pre>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>Environment Info:</h4>
        <ul>
          <li>Mode: {import.meta.env.MODE}</li>
          <li>Dev: {import.meta.env.DEV ? "Yes" : "No"}</li>
          <li>Prod: {import.meta.env.PROD ? "Yes" : "No"}</li>
          <li>Base URL: {import.meta.env.BASE_URL}</li>
        </ul>
      </div>

      <div
        style={{
          background: "#fff3cd",
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #ffeaa7",
        }}
      >
        <strong>⚠️ Remember to remove this component after debugging!</strong>
      </div>
    </div>
  );
}
