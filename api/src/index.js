import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25Mb" }));

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor arrancado en http://localhost:${port}`);
});

app.get("/", (req, res) => {
  res.send("Está todo ok");
});
