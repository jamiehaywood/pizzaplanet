import express from "express";
import { GetPingResponse } from "@mono/interfaces";

const app = express();
const port = 3001;

app.get("/api/ping", (req, res) => {
  const response: GetPingResponse = {
    data: "pong from mono-api 🏓👋",
  };
  res.json(response);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
