

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { User, Domain } = require('../models');
const { isLoggedIn } = require('./middlewares');
const net = require('net');
const externalip = require('externalip');
const axios=require('axios');


const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user && req.user.id || null },
    });
    req.session.loginData=user;
    res.render('login', {
      user,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/domain', isLoggedIn, async (req, res, next) => {
  try {
    await Domain.create({
      UserId: req.user.id,
      host: req.body.host,
      type: req.body.type,
      clientSecret: uuidv4(),
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.put('/myip', async (req, res) => {
  axios.get('https://api.ip.pe.kr/').then((Response) => {
    console.log(Response.data);
  }).catch((Error) => {
    console.log(Error);
  })
  
  res.send({hihi:"hihi"}).json;
});

module.exports = router;