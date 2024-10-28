const express = require ('express');
const { body, param } = require('express-validator');
const router = express.Router();
const userController = require('../../../controllers/admin/userController');

// Validation rules for creating a new user
const createUserValidationRules = [
  body('name').notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('ogUserId').optional().isString(),
  body('ogCompanyName').optional().isString(),
  body('ogCompanyId').optional().isString(),
  body('ogSubscriptionId').optional().isString(),
  body('domain').optional().isString(),
  body('status').isIn(['active', 'inactive', 'pending']).withMessage('Status must be active, inactive, or pending.'),
  body('brandDetails.enabled').isBoolean().withMessage('Brand enabled should be a boolean.'),
  body('brandDetails.brandInfo.colors').optional().isArray(),
  body('brandDetails.brandInfo.logo').optional().isString(),
  body('brandDetails.brandInfo.favicon').optional().isString(),
  body('brandDetails.customBrand.logo').optional().isString(),
  body('brandDetails.customBrand.primaryColor').optional().isString(),
  body('brandDetails.customBrand.secondaryColor').optional().isString(),
  body('brandDetails.customBrand.backgroundColor').optional().isString(),
];

// Validation rules for updating a user by ID
const updateUserValidationRules = [
  param('id').isMongoId().withMessage('Invalid user ID.'),
  ...createUserValidationRules,
];



// Get all users
router.get('/getusers', userController.getAllUsers);

// Get user by ID
router.get('/getusers/:id', param('id').isMongoId().withMessage('Invalid user ID.'), userController.getUserById);

// Update user by ID
router.put('/updateusers/:id', updateUserValidationRules, userController.updateUserById);

module.exports = router;
