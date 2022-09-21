'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('deals', 'loc1', { type: Sequelize.STRING() });
    await queryInterface.addColumn('deals', 'loc2', { type: Sequelize.STRING() });
    await queryInterface.addColumn('deals', 'loc3', { type: Sequelize.STRING() });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('deals', 'loc1', { type: Sequelize.STRING() });
    await queryInterface.removeColumn('deals', 'loc2', { type: Sequelize.STRING() });
    await queryInterface.removeColumn('deals', 'loc3', { type: Sequelize.STRING() });
  }
};
