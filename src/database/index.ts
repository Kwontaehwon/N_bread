const model = require('./models');
const Sequelize = require('sequelize');
import config from '../config';
const env = config.env || 'development';
const dbConfig = require('../config/config.json')[env];

type dbType = {
  sequelize?: any;
  Deal?: any;
  User?: any;
  Group?: any;
  Comment?: any;
  Reply?: any;
  DealImage?: any;
  DealReport?: any;
  UserReport?: any;
  Event?: any;
  Price?: any;
};
const db: dbType = {};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig,
);

db.sequelize = sequelize;
db.Deal = model.Deal;
db.User = model.User;
db.Group = model.Group;
db.Comment = model.Comment;
db.Reply = model.Reply;
db.DealImage = model.DealImage;
db.DealReport = model.DealReport;
db.UserReport = model.UserReport;
db.Event = model.Event;
db.Price = model.Price;

model.Deal.init(sequelize);
model.User.init(sequelize);
model.Group.init(sequelize);
model.Comment.init(sequelize);
model.Reply.init(sequelize);
model.DealImage.init(sequelize);
model.DealReport.init(sequelize);
model.UserReport.init(sequelize);
model.Event.init(sequelize);
model.Price.init(sequelize);

model.Deal.associate(db);
model.User.associate(db);
model.Group.associate(db);
model.Comment.associate(db);
model.Reply.associate(db);
model.DealImage.associate(db);
model.DealReport.associate(db);
model.UserReport.associate(db);
model.Price.associate(db);

export { db };
