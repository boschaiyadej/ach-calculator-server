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

/**
 * @swagger
 * components:
 *   schemas:
 *     ACH:
 *       type: object
 *       required:
 *         - roomName
 *         - roomVolume
 *         - airflowRate
 *         - ach
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the ACH record
 *         roomName:
 *           type: string
 *           description: The name of the room
 *         roomVolume:
 *           type: number
 *           description: The volume of the room in cubic meters
 *         airflowRate:
 *           type: number
 *           description: The airflow rate in cubic meters per hour
 *         ach:
 *           type: number
 *           description: Air changes per hour
 *       example:
 *         roomName: "Conference Room"
 *         roomVolume: 150.0
 *         airflowRate: 3000.0
 *         ach: 20.0
 */

/**
 * @swagger
 * tags:
 *   name: ACH
 *   description: ACH management API
 */

/**
 * @swagger
 * /ach:
 *   get:
 *     summary: Returns a list of all ACH data
 *     tags: [ACH]
 *     responses:
 *       200:
 *         description: The list of ACH data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ACH'
 */
router.get("/", async (req, res) => {
  try {
    const data = await db.any("SELECT * FROM ach_data");
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

/**
 * @swagger
 * /ach/{id}:
 *   get:
 *     summary: Get a specific ACH record by ID
 *     tags: [ACH]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ACH record ID
 *     responses:
 *       200:
 *         description: The ACH record description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ACH'
 *       404:
 *         description: ACH record not found
 */
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

/**
 * @swagger
 * /ach:
 *   post:
 *     summary: Create a new ACH record
 *     tags: [ACH]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ACH'
 *     responses:
 *       201:
 *         description: The ACH record was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ACH'
 *       400:
 *         description: Some fields are missing or incorrect
 */
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

/**
 * @swagger
 * /ach/{id}:
 *   put:
 *     summary: Update an ACH record by ID
 *     tags: [ACH]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ACH record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ACH'
 *     responses:
 *       200:
 *         description: The ACH record was successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ACH'
 *       400:
 *         description: Some fields are missing or incorrect
 *       404:
 *         description: ACH record not found
 */
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

/**
 * @swagger
 * /ach/{id}:
 *   delete:
 *     summary: Delete an ACH record by ID
 *     tags: [ACH]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ACH record ID
 *     responses:
 *       204:
 *         description: ACH record successfully deleted
 *       404:
 *         description: ACH record not found
 */
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
