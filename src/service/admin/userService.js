const User = require('../../models/user.model');

exports.getAllUsers = async (searchCriteria, skip, limit) => {
  return await User.find(searchCriteria).skip(skip).limit(limit);
};

exports.countUsers = async (searchCriteria) => {
  return await User.countDocuments(searchCriteria);
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};

exports.updateUserById = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true });
};
