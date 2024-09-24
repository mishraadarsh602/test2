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

};
