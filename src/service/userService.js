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
           let  {name,email}  = userData;
           //check user 
           const createdUser = await User.create({name,email});
            //   return createUser;
            const savedUser = createdUser.save()
            return savedUser;
        } catch (error) {
            console.error(error.message);
            // throw error;
        }
    };

};
