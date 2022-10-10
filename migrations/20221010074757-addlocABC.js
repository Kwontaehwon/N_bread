'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'curLocationA', { type: Sequelize.STRING() });
    await queryInterface.addColumn('users', 'curLocationB', { type: Sequelize.STRING() });
    await queryInterface.addColumn('users', 'curLocationC', { type: Sequelize.STRING() });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'curLocationA');
    await queryInterface.removeColumn('users', 'curLocationB');
    await queryInterface.removeColumn('users', 'curLocationC');
    
  }
};
