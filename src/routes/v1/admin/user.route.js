const express = require ('express');

const router = express.Router();
const userController = require('../../../controllers/admin/userController');



router.get('/getusers', userController.getAllUsers);

router.get('/getusers/:id', userController.getUserById);

router.put('/updateusers/:id', userController.updateUserById);

module.exports = router;
