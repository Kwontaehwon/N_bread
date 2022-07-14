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


router.post('/location',isLoggedIn,async(req,res)=>{
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
        res.send(Response.data)
    }).catch((err)=>{
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
router.get('/location',isLoggedIn,async(req,res)=>{
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

    



router.get('/:userId/deals/:dealId', async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return jsonResponse(res, 404, "userId에 해당되는 유저를 찾을 수 없습니다.", false, null)
        }
        let status, description;
        const group = await Group.findOne({where : { userId : req.params.userId, dealId : req.params.dealId}});
        if(!group){
            description = "참여하지 않음";
            status = 0;
        }
        else{
            const deal = await group.getDeal();
        // console.log("deal.userId : " + typeof deal.userId);
        // console.log("req.params.userId : " + typeof req.params.userId);            
            if(deal.userId == req.params.userId){ //deal.userId는 number 형이고 req.params.userId는 string형 이므로 == 를 사용해야함.
                description = "제안자";
                status = 2;
            }
            else{
                description = "참여자" ;
                status = 1;
            }
        }
        const result = {
            participation : status,
            description : description,
            userId : req.params.userId,
            dealId : req.params.dealId,
        }
        return jsonResponse(res, 200, "거래에 대한 상태를 반환합니다.", true, result);
    } catch (error){
        console.log(error);
        return jsonResponse(res, 500, "서버 에러", false, null)
    }
});




module.exports = router;