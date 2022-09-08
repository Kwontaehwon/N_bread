'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'kakaoNumber', { type: Sequelize.STRING() });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users','kakaoNumber');
  }
};