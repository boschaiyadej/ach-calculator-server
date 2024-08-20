import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routesAch from "./routes/routesAch.mjs";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ACH routes
app.use("/ach", routesAch);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
