const express = require("express");
const router = express.Router();
const builderController = require('../../controllers/builder');


router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "builder#index" });
});

router.post('/create_user', builderController.createUser);
router.post('/create_app', builderController.createApp);
router.get('/get_app/:appId', builderController.getAppById);
router.post('/update_app/:appId', builderController.updateApp);
router.delete('/delete_app/:appId', builderController.deleteApp);
router.post('/get_all_apps', builderController.getAllAppsOfUser);


module.exports = router;