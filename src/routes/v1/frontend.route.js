const express = require("express");
const router = express.Router();
const frontendController = require('../../controllers/frontend');
const auth = require('../../middleware/auth');

router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "frontend#index" });
});

router.post('/create_app',auth, frontendController.createApp);
router.get('/get_user',auth, frontendController.getUserDetail);
router.delete('/delete_app/:appId', auth,frontendController.deleteApp);
router.post('/get_all_apps',auth, frontendController.getAllAppsOfUser);
router.get('/getfeatureLists',auth,frontendController.getFeatureLists);

module.exports = router;