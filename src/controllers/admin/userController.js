const UserService = require("../../service/admin/userService");

exports.getAllUsers = async (req, res) => {
  try {
    const { name, email, ogCompanyName, page = 1, limit = 10 } = req.query;

    const searchCriteria = {};
    if (name) {
      searchCriteria.name = new RegExp(name, "i");
    }
    if (email) {
      searchCriteria.email = new RegExp(email, "i");
    }
    if (ogCompanyName) {
      searchCriteria.ogCompanyName = new RegExp(ogCompanyName, "i");
    }

    const skip = (page - 1) * limit;
    const selectedFields = { name: 1, email: 1, ogCompanyName: 1, status: 1 };  // Add this line

    const users = await UserService.getAllUsers(
      searchCriteria,
      skip,
      parseInt(limit),
      selectedFields 
    );
    const totalUsers = await UserService.countUsers(searchCriteria);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      users,
      totalPages,
      currentPage: parseInt(page),
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const updatedUser = await UserService.updateUserById(
      req.params.id,
      req.body
    );
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
