'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('deals', 'region', 'loc3');
    await queryInterface.addColumn('deals', 'loc1', { type: Sequelize.STRING() });
    await queryInterface.addColumn('deals', 'loc2', { type: Sequelize.STRING() });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('deals', 'loc1', 'region');
    await queryInterface.removeColumn('deals', 'loc2');
    await queryInterface.removeColumn('deals', 'loc3');
  }
};
