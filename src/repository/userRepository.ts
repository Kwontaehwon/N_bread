const { User } = require('../database/models');

const findUserById = async (id: number) => {
  return await User.findOne({
    where: { Id: id },
    paranoid: false,
  });
};

export { findUserById };
