const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const path=require('path');
const CryptoJS = require('crypto-js');
const axios = require('axios');
require('dotenv').config();

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal } = require('../models');
const { json } = require('body-parser');
const { any, reject } = require('bluebird');
const { response } = require('express');
const { resolve } = require('path');

const router = express.Router();


function jsonResponse(res, code, message, isSuccess, result){
    res.status(code).json({
      code : code,
      message : message,
      isSuccess : isSuccess,
      result : result
    })
  }
  
router.use(express.json());


router.post('/location', isLoggedIn, async(req,res)=>{
    const user = await User.findOne({ where: { id: req.user.id } });
    const prom=new Promise((resolve,reject)=>{
        axios.get('https://api.ip.pe.kr/').then((Response)=>{
            resolve(makeSignature(Response.data));
        }).catch((err)=>{
            console.log(err)
        })
    }).catch((error)=>{
        console.log(error);
    })

    let tmp = await prom;
    //console.log("url is : "+tmp.url);
    axios.get(tmp.url,{headers:{
        "x-ncp-apigw-signature-v2":tmp.signature,
        "x-ncp-iam-access-key":tmp.accessKey,
        "x-ncp-apigw-timestamp":tmp.timestamp,

    }}).then(async (Response) => {
        const data=Response.data;
        console.log(Response.data)
        console.log(data.geoLocation.r2);
        user.update({ curLocation1: data.geoLocation.r1, curLocation2: data.geoLocation.r2, curLocation3: data.geoLocation.r3})
        jsonResponse(res, 200, "현재 위치 저장이 완료되었습니다.", true, {
            'location': data.geoLocation.r1 + " " + data.geoLocation.r2 + " " + data.geoLocation.r3});
    }).catch((err) => {
        console.log("err : "+err)
    })
 
    

    function makeSignature(ipAddr) {
        var space = " ";				// one space
        var newLine = "\n";				// new line
        var method = "GET";				// method
        var url = "/geolocation/v2/geoLocation?ip="+ipAddr+"&ext=t&responseFormatType=json";	// url (include query string)
        var timestamp = Date.now().toString();			// current timestamp (epoch)
        var accessKey = process.env.NAVER_ACCESSKEY;			// access key id (from portal or Sub Account)
        var secretKey = process.env.NAVER_SECRETKEY;			// secret key (from portal or Sub Account)

        var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
        hmac.update(method);
        hmac.update(space);
        hmac.update(url);
        hmac.update(newLine);
        hmac.update(timestamp);
        hmac.update(newLine);
        hmac.update(accessKey);

        var hash = hmac.finalize();

        let result = hash.toString(CryptoJS.enc.Base64);
        return { "signature": result, "timestamp": timestamp, "url":"https://geolocation.apigw.ntruss.com"+url,"accessKey":accessKey};
    }

    //makeSignature();

})
router.get('/location', isLoggedIn, async(req,res)=>{
    const loggedInUser = await User.findOne({ where: { Id: req.user.id } });
    const result={userId : loggedInUser.id,location:loggedInUser.curLocation3};
    jsonResponse(res,200,"현재 위치를 db에서 가져오는데 성공하였습니다",true,result)
})



router.get('/:userId', async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return jsonResponse(res, 404, "userId에 해당되는 유저가 없습니다.", false, null)
        }
        const result = {
            createdAt : user.createdAt,
            nick : user.nick,
            provider : user.provider,
        }
        return jsonResponse(res, 200, "userId의 정보를 반환합니다.", true, result)
    } catch (error){
        console.log(error);
        return jsonResponse(res, 500, "서버 에러", false, result)
    }
});


router.put('/:userId', async (req, res, next) => {
    try{
        const {nick} = req.body;
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return jsonResponse(res, 404, "해당되는 유저가 없습니다.", false, null);
        }
        const isDuplicated = await User.findOne({ where : {nick : nick}});
        if(isDuplicated){
            return jsonResponse(res, 409, "중복된 닉네임으로는 변경할 수 없습니다.", false, null);
        }
        else{
            await user.update({
                nick : nick
            });
            const result = {
                userId : user.id,
                nick : user.nick,
            };
            return jsonResponse(res, 200, "닉네임 변경 완료", true, result);
        }
        
    } catch(error){ 
        console.log(error);
        return jsonResponse(res, 500, "서버 에러", false, result)
    }
})


router.delete('/:userId', async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return jsonResponse(res, 404, "해당되는 유저를 찾을 수 없습니다.", false, null)
        }
        await user.destroy();
        return jsonResponse(res, 500, "회원 탈퇴가 완료되었습니다.", true, null)
    }  catch(error){ 
        console.log(error);
        return jsonResponse(res, 500, "서버 에러", false, null)
    }
});


// 거래 찾기 /:userId/?isDealDone={}&isSuggester={}
router.get('/:userId/deals', async (req, res, next) => {
    try {
      const user = User.findOne({where : {id : req.params.userId}});
      if(!user){
        return jsonResponse(res, 404, "해당되는 유저가 없습니다.", false, null);
      }
      let deals; // 정의만 하려면 자료형이 let?
      if(req.query.isSuggester == 1){ // 제안자
        deals = await Deal.findAll({
          where: { userId: req.params.userId },
          include : {
           model : Group,
           attribute: ['userId']
          }
         });
      } else{ // isSuggester가 1일때 처럼 groups를 가져오는 방법
        const user = await User.findOne({
          where : {Id : req.params.userId}
        });
        const groups = await user.getGroups();
        deals = []
        for(let i = 0 ; i < groups.length ; i++){ 
          const deal = await Deal.findOne({ where : {Id : groups[i].dealId} });
          if(deal.userId != req.params.userId) deals.push(deal); // 참여자로써 참여한 것만
        }
      }
      for (let i = 0; i < deals.length; i++) { // 진행된 거래
        const cur = new Date(deals[i].dealDate);
        if (req.query.isDealDone == 1 && cur > Date.now()) { // 수정필요 -> 어짜피 나중에 deal 테이블에 isDealDone 수정하면 바로 가져올 수 있음.
          deals.splice(i, 1);
          i--;
        }
        else if (req.query.isDealDone == 0 && cur <= Date.now()) {
          deals.splice(i, 1);
          i--;
        }
      }
  
      if (deals.length == 0) {
        return jsonResponse(res, 404, "검색 결과가 없습니다.", false, null)
      }
      return jsonResponse(res, 200, user.id + "user의 거래 내역", true, {userId : user.id , deals : deals});    
    } catch (error) {
      console.error(error);
      return jsonResponse(res, 500, "서버 에러", false, null)
    }
  });







module.exports = router;