const express = require("express");
const router = express.Router();
const adminController = require('../../../controllers/admin/dashboard');
const adminUserController = require('../../../controllers/admin/user');
const adminAuth = require('../../../middleware/adminauth');
const userController = require("../../../controllers/admin/userController");
const adminErrorLogsController = require("../../../controllers/admin/errorlog");
const { getApps } = require("../../../controllers/admin/searchAppController");
const {
  getLocale,
  createLocale,
  updateLocale,
  deleteLocale,
} = require("../../../controllers/localeController");
const plansController = require("../../../controllers/admin/plans");
router.get('/getfeatureLists',  adminAuth,  adminController.getFeatureLists);
router.get('/getVisitorsList', adminAuth, adminController.getVisitorsList);


router.post('/login',adminUserController.loginUser);
router.get('/checkUser', adminAuth, adminUserController.checkUser);
router.post("/logout", adminAuth, adminUserController.logoutUser);

router.get('/getfeatureList/:id', adminAuth, adminController.getFeatureListById);
router.post('/createFeatureList', adminAuth, adminController.createFeatureList);
router.put('/updateFeatureList/:id', adminAuth, adminController.updateFeatureList);
router.patch('/updateActiveStatus/:id', adminAuth, adminController.toggleActiveStatus);
router.get('/getAllCounts',adminAuth, adminController.getAllCounts);
router.get('/getCreationStats',adminAuth,adminController.getCreationStats);
router.post("/duplicateapp",adminAuth, adminController.duplicateApp);



router.get("/getusers", adminAuth,  userController.getAllUsers);

router.get("/getusers/:id", adminAuth, userController.getUserById);

router.put("/updateusers/:id", adminAuth,  userController.updateUserById);


router.get("/getErrorLogs", adminAuth, adminErrorLogsController.getErrorLogs);



router.post("/locale",adminAuth,  createLocale);

router.get("/locale/:langCode?", adminAuth, getLocale);

router.put("/locale/:langCode", adminAuth, updateLocale);

router.delete("/locale/:langCode", adminAuth, deleteLocale);

router.get("/getsearchapp", adminAuth, getApps);

router.get('/plans', adminAuth, plansController.getPlans);
router.get('/plan/:planName',adminAuth,plansController.getPlanByName);
router.put('/plan',adminAuth,plansController.updatePlanById);
router.post('/plan',adminAuth,plansController.createPlan);
router.post('/plan-features',adminAuth,plansController.getPlanFeatures);
router.put('/updateFeature',adminAuth,plansController.updateFeature)
router.delete('/removeFeature/:id',adminAuth,plansController.deletePlanFeature);

module.exports = router;
