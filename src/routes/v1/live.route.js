const express = require("express");
const router = express.Router();
const liveController = require('../../controllers/live');
const auth = require('../../middleware/auth');
router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "live#index" });
});

router.post('/gen_visitor', auth,liveController.generateVisitor);
router.get('/:appName', auth,liveController.getLivePreview);
router.post('/saveLead/:appId', auth,liveController.saveLead);
module.exports = router;