const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Deal = require('./deal');
const Group = require('./group');
const Comment = require('./comment');
const Reply = require('./reply');
const DealImage = require('./dealImage');



const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Deal = Deal;
db.User = User;
db.Group = Group;
db.Comment=Comment;
db.Reply = Reply;
db.DealImage=DealImage;

Deal.init(sequelize);
User.init(sequelize);
Group.init(sequelize);
Comment.init(sequelize);
Reply.init(sequelize);
DealImage.init(sequelize);

Deal.associate(db);
User.associate(db);
Group.associate(db);
Comment.associate(db);
Reply.associate(db);

module.exports = db;
