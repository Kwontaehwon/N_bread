'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn("deals", "content", {
      type: Sequelize.STRING(750),
    });
    await queryInterface.changeColumn("comments", "content", {
      type: Sequelize.STRING(500),
    });
    await queryInterface.changeColumn("replies", "content", {
      type: Sequelize.STRING(500),
    });
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn("deals", "content", {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn("comments", "content", {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn("replies", "content", {
      type: Sequelize.STRING,
    });
  }
};
