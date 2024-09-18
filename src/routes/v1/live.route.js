const express = require("express");
const router = express.Router();
const liveController = require('../../controllers/live');
const auth = require('../../middleware/auth');
router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "live#index" });
});

router.post('/updateVisitorCount/:parentId', auth,liveController.updateVisitorCount);
router.get('/getLivePreview/:appId', auth,liveController.getLivePreview);
module.exports = router;