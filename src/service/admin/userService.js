const User = require('../../models/user.model');

// Create a new user
exports.createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

// Get all users
exports.getAllUsers = async () => {
  return await User.find();
};

// Get user by ID
exports.getUserById = async (id) => {
  return await User.findById(id);
};

// Update user by ID
exports.updateUserById = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true });
};
