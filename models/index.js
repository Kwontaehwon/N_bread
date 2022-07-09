const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Deal = require('./deal');
const Group = require('./group');



const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Deal = Deal;
db.User = User;
db.Group = Group;

Deal.init(sequelize);
User.init(sequelize);
Group.init(sequelize);

Deal.associate(db);
User.associate(db);
Group.associate(db);

module.exports = db;
