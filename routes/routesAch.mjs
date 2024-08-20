import express from "express";
import pgPromise from "pg-promise";
import dotenv from "dotenv";

const router = express.Router();
const pgp = pgPromise();

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const db = pgp(process.env.DATABASE_URL);

// GET endpoint to fetch all ACH data
router.get("/", async (req, res) => {
  try {
    const data = await db.any("SELECT * FROM ach_data");
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// GET endpoint to fetch a specific ACH record
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await db.oneOrNone("SELECT * FROM ach_data WHERE id = $1", id);

    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Record not found" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// POST endpoint to submit ACH data
router.post("/", async (req, res) => {
  const { roomName, roomVolume, airflowRate, ach } = req.body;

  if (!roomName || !roomVolume || !airflowRate || !ach) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newEntry = await db.one(
      "INSERT INTO ach_data(room_name, room_volume, airflow_rate, ach) VALUES($1, $2, $3, $4) RETURNING *",
      [roomName, roomVolume, airflowRate, ach]
    );
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error submitting data:", error);
    res.status(500).json({ message: "Error submitting data" });
  }
});

// PUT endpoint to update ACH data
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { roomName, roomVolume, airflowRate, ach } = req.body;

  if (!roomName || !roomVolume || !airflowRate || !ach) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const updatedEntry = await db.one(
      "UPDATE ach_data SET room_name = $1, room_volume = $2, airflow_rate = $3, ach = $4 WHERE id = $5 RETURNING *",
      [roomName, roomVolume, airflowRate, ach, id]
    );
    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ message: "Error updating data" });
  }
});

// DELETE endpoint to remove ACH data
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.result("DELETE FROM ach_data WHERE id = $1", id);

    if (result.rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Record not found" });
    }
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ message: "Error deleting data" });
  }
});

export default router;
