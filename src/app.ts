const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const morgan = require('morgan');
const session = require('express-session');
const nunjucks = require('nunjucks');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./config/swagger/swagger.json');
const admin = require('firebase-admin');
let serviceAccount = require('./config/firebase-admin.json');
const config = require('./config');
const { router } = require('./routes/index');
const { db } = require('./database/');
const { passportIndex } = require('./config/passport');
const { errorHandler } = require('./modules/error/errorHandler');
const { logger } = require('./config/winston');

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

passportIndex();
nunjucks.configure('views', {
  express: app,
  watch: true,
});
db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });
app.set('port', config.port || 5005);
app.set('view engine', 'html');
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(config.cookieSecret));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: config.cookieSecret,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', router);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  // error.status = 404;
  next(error);
});

app.use(errorHandler);

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = config.env !== 'production' ? err : {};
  logger.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message, error: res.locals.error });
});

if (config.env == 'production') {
  const options = {
    ca: fs.readFileSync(
      '/etc/letsencrypt/live/www.chocobread.shop/fullchain.pem',
    ),
    key: fs.readFileSync(
      '/etc/letsencrypt/live/www.chocobread.shop/privkey.pem',
    ),
    cert: fs.readFileSync('/etc/letsencrypt/live/www.chocobread.shop/cert.pem'),
  };
  https.createServer(options, app).listen(app.get('port'), () => {
    logger.info(`HTTPS:${app.get('port')} 서버 시작`);
  });
} else {
  app.listen(app.get('port'), '0.0.0.0', () => {
    logger.info(`development HTTP:${app.get('port')} 서버 시작`);
  });
}
