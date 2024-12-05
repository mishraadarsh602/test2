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
router.get('/getfeatureLists', adminController.getFeatureLists);


router.post('/login',adminUserController.loginUser);
router.get('/checkUser', adminAuth, adminUserController.checkUser);
router.post("/logout", adminAuth, adminUserController.logoutUser);

router.get('/getfeatureList/:id', adminController.getFeatureListById);
router.post('/createFeatureList', adminController.createFeatureList);
router.put('/updateFeatureList/:id', adminController.updateFeatureList);
router.patch('/updateActiveStatus/:id', adminController.toggleActiveStatus);
router.get('/getAllCounts', adminController.getAllCounts);
router.get('/getCreationStats', adminController.getCreationStats);
router.post("/duplicateapp", adminController.duplicateApp);



router.get("/getusers", userController.getAllUsers);

router.get("/getusers/:id", userController.getUserById);

router.put("/updateusers/:id", userController.updateUserById);


router.get("/getErrorLogs", adminErrorLogsController.getErrorLogs);



router.post("/locale", createLocale);

router.get("/locale/:langCode?", getLocale);

router.put("/locale/:langCode", updateLocale);

router.delete("/locale/:langCode", deleteLocale);

router.get("/getsearchapp", getApps);

router.get('/plans',plansController.getPlans);
router.get('/plan/:id',plansController.getPlansById);
router.put('/plan/:id',plansController.updatePlanById);
module.exports = router;
