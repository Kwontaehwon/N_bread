const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { User, Domain } = require('../models');
const { isLoggedIn, verifyToken } = require('./middlewares');
const net = require('net');
const externalip = require('externalip');
const axios=require('axios');
const { verify } = require('crypto');


const router = express.Router();


function jsonResponse(res, code, message, isSuccess, result) {
  res.status(code).json({
      code: code,
      message: message,
      isSuccess: isSuccess,
      result: result
  })
}


router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id:req.decoded.id || null },
    });
    req.session.loginData=user;
    return jsonResponse(res, 200, `USER : ${req.session.loginData}`, true, req.session.loginData);
  } catch (err) {
    console.error(err);
    next(err);
  }
});
module.exports = router;