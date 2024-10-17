const mongoose = require('mongoose');
function isValidMongooseId(id){
  return mongoose.Types.ObjectId.isValid(id);
};

function giveMoongooseObjectId(id){
  return new mongoose.Types.ObjectId(id)
}

module.exports = {isValidMongooseId,giveMoongooseObjectId};