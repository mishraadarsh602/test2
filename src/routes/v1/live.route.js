const express = require("express");
const router = express.Router();
const liveController = require('../../controllers/live');

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "live#index" });
});

router.get('/geLiveapp/:parentId', liveController.getLiveApp);
module.exports = router;