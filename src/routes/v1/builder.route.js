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
router.get('/generate_graph', aiController.tryGraphMaking);
router.get('/returnCode',aiController.returnCode);
router.get('/fetchAssistant', aiController.getAssistantAI);
router.post('/enhancePrompt',builderController.enhancePrompt);
router.post('/validatePrompt',builderController.validatePrompt);
router.get('/get_app/:url',auth, builderController.getAppByUrl);
router.post('/update_app/:id',auth, builderController.updateApp);
router.post('/check_unique_app_name',auth, builderController.checkUniqueAppName);
router.post('/check_unique_url', auth,builderController.checkUniqueUrl);
router.post('/liveApp/:appId',auth,builderController.liveApp);
router.get('/getPreviewApp/:appId', auth,builderController.getPreviewApp);
router.post('/fixError', auth,builderController.fixError);
router.get('/callAPI', builderController.callAPI);
router.post('/callAI/:appId', builderController.callAI);
router.post('/callAI', builderController.callAI);
router.post('/tool_enhance',auth, builderController.toolEnhance)
router.post('/brand_guide',auth, builderController.getBrandGuide);
router.post('/upload_file_aws',auth,upload.single("image"),builderController.uploadFile);
router.patch('/update_brand_guide',auth, builderController.updateBrandGuide);
router.post('/logout',auth, builderController.logoutUser);
//payment details
router.post('/create_stripe_checkout_session', builderController.createStripeCheckoutSession);
router.get('/retrieve_stripe_checkout_session', builderController.retrieveStripeCheckoutSession);
router.post('/save_transaction_details', builderController.saveTransactionDetails);



module.exports = router;