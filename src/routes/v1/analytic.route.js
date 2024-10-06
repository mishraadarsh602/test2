const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const analyticController = require('../../controllers/analytic');
router.post('/calculator_stats',auth,analyticController.calculatorStats);
router.post('/visitor_key',analyticController.generateVisitor);
router.post('/get_engagements',auth,analyticController.fetchVisitors);
module.exports=router;
