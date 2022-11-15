const express = require('express');
const cors = require('cors');
const url = require('url');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const mecab = require('mecab-ya');

const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { User, Group, Deal, Comment, Reply, sequelize } = require('../models');
const { json } = require('body-parser');
const { any, reject } = require('bluebird');
const { response } = require('express');
const { resolve } = require('path');
const { Op, Sequelize, where } = require('sequelize');
const logger = require('../config/winston');
const admin = require("firebase-admin");
const { env } = require('process');
var request = require('request');

const router = express.Router();


function jsonResponse(res, code, message, isSuccess, result) {
    res.status(code).json({
        code: code,
        message: message,
        isSuccess: isSuccess,
        result: result
    })
}

router.use(express.json());

// GET price/:productName
router.get('/:dealId',async (req, res) => {
    var jsonArray = new Array();
    var testDataToAdd = '{"title": "테스트에요","link": "", "image": "", "lprice": 1000,"hprice": "","mallName":"위메프","productId": "28870807266","productType": "3","brand": "투쿨포스쿨","maker": "스완","category1": "화장품/미용","category2": "색조메이크업","category3": "아이섀도","category4": ""}';
    jsonArray.push(JSON.parse(testDataToAdd));
    testDataToAdd=JSON.parse(testDataToAdd);


    //상품명 추출
    const deal = await Deal.findOne({where:{id:req.params.dealId},paranoid:false});
    if(!deal){
        jsonResponse(res,404,`${req.params.dealId}에 해당하는 거래를 찾을 수 없습니다`,false,null);
    }
    const text = deal.title;
    var answer = "";
    var endOfI = 0;
    
    mecab.pos(text, function (err, result) {
        console.log(result)
        for(i=0;i<result.length-1;i++){
            if (result[i][1] == 'SL' || result[i][1] == 'NNG' || result[i][1]=='NNP'){
                if (result[i+1][1] == 'SL' || result[i+1][1] == 'NNG' || result[i+1][1] == 'NNP'){
                    answer+=result[i][0];
                    answer+=" ";
                }else{
                    endOfI = i;
                    answer+=result[endOfI][0];
                    break;
                }
            }
            console.log(result[i][0]);
        }
        if (endOfI=result.length-2&&(result[result.length-1][1] == 'SL' || result[result.length-1][1] == 'NNG' || result[result.length-1][1] == 'NNP')){
            console.log(`result[result.length-1][0] is ${result[result.length-1][0]}`);
            answer+=result[result.length-1][0];
        }
        console.log(`answer is ${answer}`)
        try {
            const productName = answer;
            const client_id = env.NAVER_DEVELOPER_CLIENTID;
            const client_secret = env.NAVER_DEVELOPER_CLIENTSECRET;
            var url = 'https://openapi.naver.com/v1/search/shop.json?query=' + encodeURI(productName) + "&sort=asc&display=4"; // JSON 결과

            console.log(url);
            var options = {
                url: url,
                headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
            };
            request.get(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // res.writeHead(200, { 'Content-Type': 'text/json;charset=utf-8' });
                    // res.end(body);
                    var item = JSON.parse(body)['items'];
                    //console.log(item);
                    for (i = 0; i < item.length;i++){
                        item[i]['lprice'] = parseInt(item[i]['lprice']) +3000;
                        jsonArray.push(item[i]);
                    }
                    
                    //console.log(testDataToAdd.concat(item));
                    return jsonResponse(res, 200, "성공", true, jsonArray);
                } else {
                    res.status(response.statusCode).end();
                    console.log('error = ' + response.statusCode);
                }
            });
        } catch (error) {
            logger.error(error);
            return jsonResponse(res, 500, "[Lowest Price] price/:productName 서버 에러", false, result)
        }
     });
    
    // #swagger.summary = '네이버 최저가 api로 검색'
    
});
module.exports = router;