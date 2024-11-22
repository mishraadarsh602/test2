const express = require("express");
const router = express.Router();
const adminController = require('../../../controllers/admin/dashboard');
const adminUserController = require('../../../controllers/admin/user');
const adminAuth = require('../../../middleware/adminauth');

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




module.exports = router;
