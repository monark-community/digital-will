import express from "express";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Express API is running", timestamp: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
