'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'nick', { type: Sequelize.STRING(15), allowNull:true});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'nick', { type: Sequelize.STRING(15), allowNull: false });
  }
};
