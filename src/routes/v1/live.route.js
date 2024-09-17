const express = require("express");
const router = express.Router();
const liveController = require('../../controllers/live');
const auth = require('../../middleware/auth');
router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "live#index" });
});

router.post('/geLiveapp/:parentId', auth,liveController.getLiveApp);
module.exports = router;