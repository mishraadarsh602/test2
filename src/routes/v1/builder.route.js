const express = require("express");
const router = express.Router();
const builderController = require('../../controllers/builder');
const aiController = require('../../controllers/ai');
const auth = require('../../middleware/auth');
const multer = require('multer');
const { memoryStorage } = multer;
const storage = memoryStorage();
const upload = multer({ storage: storage });
router.get("/", async (req, res) => {
  return res.status(200).json({ success: true, message: "builder#index" });
});
router.post('/create_user', builderController.createUser);
router.get('/get_user',auth, builderController.getUserDetail);
router.post('/create_app_by_AI', aiController.createAppByAI);
router.get('/create_assistant', aiController.createAssistant);
router.get('/get_assistant_conversatation', aiController.runAssistantConversation);
router.get('/generate_graph', aiController.tryGraphMaking);
router.get('/returnCode',aiController.returnCode);
router.get('/get_app/:url',auth, builderController.getAppByUrl);
router.post('/update_app/:appName',auth, builderController.updateApp);
router.delete('/delete_app/:appId', builderController.deleteApp);
router.get('/get_all_apps',auth, builderController.getAllAppsOfUser);
router.post('/check_unique_app_name',auth, builderController.checkUniqueApp);
router.post('/check_unique_url', builderController.checkUniqueUrl);
router.post('/liveApp/:appId',auth, builderController.liveApp);
router.get('/getOverView/:appId',auth,builderController.getOverViewDetails);
router.post('/visitor/delete',auth, builderController.deleteVisitors);
router.get('/getPreviewApp/:appId', auth,builderController.getPreviewApp);
router.post('/fixError', auth,builderController.fixError);
router.get('/callAPI', builderController.callAPI);
router.post('/brand_guide',auth, builderController.getBrandGuide);
router.post('/upload_file_aws',auth,upload.single("image"),builderController.uploadFile);
router.patch('/update_brand_guide',auth, builderController.updateBrandGuide);

module.exports = router;