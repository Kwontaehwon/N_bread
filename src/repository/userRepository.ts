const { User } = require('../database/models');

const findUserById = async (id: number) => {
  await User.findOne({
    where: { Id: id },
    paranoid: false,
  });
};

export { findUserById };
