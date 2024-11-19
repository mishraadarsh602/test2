const express = require("express");

const router = express.Router();
const adminErrorLogsController = require("../../../controllers/admin/errorlog");

router.get('/getErrorLogs', adminErrorLogsController.getErrorLogs);



module.exports = router;
