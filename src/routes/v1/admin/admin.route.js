const express = require("express");
const router = express.Router();
const adminController = require('../../../controllers/admin/dashboard');
const adminUserController = require('../../../controllers/admin/user');
// const auth = require('../../../middleware/auth');


// Route to get all feature lists
router.get('/getfeatureLists', adminController.getFeatureLists);

router.get('/getfeatureLists',adminController.getFeatureLists);
router.post('/login',adminUserController.loginUser);
module.exports = router;
// Route to get a feature list by ID
router.get('/getfeatureList/:id', adminController.getFeatureListById);

// Route to create a new feature list
router.post('/createFeatureList', adminController.createFeatureList);

// Route to update a feature list by ID
router.put('/updateFeatureList/:id', adminController.updateFeatureList);

module.exports = router;
