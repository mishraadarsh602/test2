const express = require("express");
const router = express.Router();
const builderController = require('../../controllers/builder');
const aiController = require('../../controllers/ai');
const auth = require('../../middleware/auth');
router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "builder#index" });
});

router.post('/create_user', builderController.createUser);
router.get('/get_user',auth, builderController.getUserDetail);
router.post('/create_app',auth, builderController.createApp);
router.post('/create_app_by_AI', aiController.createAppByAI);
router.get('/get_app/:appId',auth, builderController.getAppById);
router.post('/update_app/:appId',auth, builderController.updateApp);
router.delete('/delete_app/:appId', builderController.deleteApp);
router.get('/get_all_apps',auth, builderController.getAllAppsOfUser);
router.get('/check_unique_app_name/:name/:appId', builderController.checkUniqueApp);
router.post('/liveApp',auth, builderController.liveApp);

module.exports = router;