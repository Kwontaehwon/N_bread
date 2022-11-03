'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('deals', 'isCertificated', { type: Sequelize.BOOLEAN() });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('deals','isCertificated');
  }
};
