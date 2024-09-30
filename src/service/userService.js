const User = require('../models/user.model');
module.exports = class UserService {
    async findUserByEmail(email) {
        try {
            return await User.findOne({ email });
        } catch (error) {
            console.error(`Error finding user by email: ${email}`, error);
        }
    }
    async createUser(userData) {
        try {
           const createdUser = await User.create(userData);
            const savedUser = createdUser.save()
            return savedUser;
        } catch (error) {
            console.error(error.message);
        }
    };
    async getUserById(userId) {
        try {
            return await User.findById(userId);
        }
        catch (error) {
            console.log(`Error finding user by id: ${userId}`, error);
        }
    }
};
