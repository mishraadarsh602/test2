const express = require("express");
const router = express.Router();
const frontendController = require('../../controllers/frontend');

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "frontend#index" });
});

router.post('/create_app', frontendController.createApp);
router.delete('/delete_app/:appId', frontendController.deleteApp);
router.post('/get_all_apps', frontendController.getAllAppsOfUser);
module.exports = router;