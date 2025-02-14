const express = require("express");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Create a new room and return the room ID
router.post("/create", (req, res) => {
  const roomId = uuidv4();
  res.json({ roomId });
});

module.exports = router;
