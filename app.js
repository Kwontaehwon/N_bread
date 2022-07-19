const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const morgan = require('morgan');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { swaggerUi, specs } = require('./swagger');

dotenv.config();
const indexRouter = require('./routes');
const dealRouter = require('./routes/deals');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const commentRouter = require('./routes/comment');

const { sequelize } = require('./models');
const passportConfig = require('./passport');

const logger = require('./config/winston');

const app = express();

passportConfig();
app.set('port', process.env.PORT || 8080);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});
sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공'); 
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/deals', dealRouter);
app.use('/users', userRouter);
app.use('/comments',commentRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

/*
app.listen(app.get('port'),'0.0.0.0', () => {
  logger.info("서버 시작");
  console.log(app.get('port'), '번 포트에서 대기중');
});
*/

const options = {
    ca: fs.readFileSync('/etc/letsencrypt/live/www.chocobread.shop/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/www.chocobread.shop/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/www.chocobread.shop/cert.pem'),
 };

/*
http.createServer(app).listen(app.get('port'), '0.0.0.0', ()=> {
  logger.info("http server");
});
*/

https.createServer(options, app).listen(8080, () => {
  logger.info("HTTPS 서버 시작");
});
