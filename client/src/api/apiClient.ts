export const serverUrl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:8000"
    : "https://digicritics-server.onrender.com";
