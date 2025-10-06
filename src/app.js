import express from "express";

const app = express();

// Health check & later routes
app.get("/", (_, res) => res.send("OK"));

export default app;
