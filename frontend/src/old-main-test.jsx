import React from "react";
import ReactDOM from "react-dom/client";

// Simple test component
const TestApp = () => {
  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "800px", 
      margin: "0 auto", 
      fontFamily: "system-ui, sans-serif" 
    }}>
      <h1>Market Dashboard Test</h1>
      <p>If you can see this, the basic React setup is working.</p>
      <p>Let's try to troubleshoot the path issues.</p>
    </div>
  );
};

// Mount the test app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
