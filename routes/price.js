const express = require('express');
const cors = require('cors');
const url = require('url');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const mecab = require('mecab-ya');

const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { User, Group, Deal, Comment, Reply, sequelize, Price } = require('../models');
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
    const deal = await Deal.findOne({ where: { id: req.params.dealId }, paranoid: false });
    if (!deal) {
        jsonResponse(res, 404, `${req.params.dealId}에 해당하는 거래를 찾을 수 없습니다`, false, null);
    }

    const totalPrice = deal.totalPrice;
    const particlePrice = deal.presoanlPrice;


    var jsonArray = new Array();
    var testDataToAdd = '{"title": "동원 참치","link": "", "image": "https://nbreadimg.s3.ap-northeast-2.amazonaws.com/original/1666612240288_KakaoTalk_Photo_2022-10-24-20-27-21.jpeg", "lprice": 5000,"hprice": "","mallName":"N빵","productId": "28870807266","productType": "3","brand": "동원","maker": "동원","category1": "식품","category2": "통조림/캔","category3": "참치/연어","category4": ""}';
    jsonArray.push(JSON.parse(testDataToAdd));
    testDataToAdd=JSON.parse(testDataToAdd);

    testDataToAdd['title'] = "참치에요"
    console.log(testDataToAdd);
    //var title2 = "버터 총2개씩같이 사요 14g이에요"
    var title2 = "버츠비 모이스춰라이징 립밤 1+1"


    title2=title2.replace(/\s/g,"");
    var total = title2.match(/\총\d?\d?\d?\d/);
    var partial = title2.match(/\d?\d?\d\개씩/);
    var onePlus = title2.includes('1+1');
    var twoPlus = title2.includes('2+1') || title2.includes('1+2');
    
    var unitPrice = 0;

    if(total){
        total = total[0].replace("총", "");
        total *= 1;
        unitPrice = totalPrice/total
    }else if(partial){
        console.log("개당 가격");
        partial = partial[0].replace("개씩", "");
        partial *= 1;
        unitPrice = particlePrice / partial;
        
    }else if(onePlus){
        numToDivide = 2;
        unitPrice = totalPrice / numToDivide
    }else if(twoPlus){
        numToDivide = 3;
        unitPrice = totalPrice / numToDivide
    }
    console.log(`unitPrice is ${unitPrice}`);
    //단위 가격을 추출하지 못했을 경우 : g 추출 시도
    var gramToAdd = " ";
    if(!unitPrice){
        var unitG = title2.match(/\d?\d?\d?\d\K?\k?\g/);
        console.log(`gramToAdd is ${unitG}`);
        
        if (unitG) {
            gramToAdd += unitG[0];
        }
    }else{
        gramToAdd+="1개"
    }
       
    
    //상품명 추출
    //const text = deal.title;
    const text ="가쓰오 후리가케 같이 사실분";
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
        }
        if (endOfI=result.length-2&&(result[result.length-1][1] == 'SL' || result[result.length-1][1] == 'NNG' || result[result.length-1][1] == 'NNP')){
            console.log(`result[result.length-1][0] is ${result[result.length-1][0]}`);
            answer+=result[result.length-1][0];
        }
        console.log(`answer is ${answer}`)
        try {
            const productName = answer+gramToAdd;
            const client_id = env.NAVER_DEVELOPER_CLIENTID;
            const client_secret = env.NAVER_DEVELOPER_CLIENTSECRET;
            var url = 'https://openapi.naver.com/v1/search/shop.json?query=' + encodeURI(productName)+"&sort=asc&display=4"; // JSON 결과

            console.log(url);
            var options = {
                url: url,
                headers: { 'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret }
            };
            request.get(options, async(error, response, body) => {
                if (!error && response.statusCode == 200) {
                    var item = JSON.parse(body)['items'];
                    const existDeal = await Price.findOne({where:{dealId:req.params.dealId}});
                    if(!existDeal){
                        for (i = 0; i < item.length; i++) {
                            await Price.create({
                                dealId: req.params.dealId,
                                title: item[i]["title"],
                                link: item[i]["link"],
                                image: item[i]["image"],
                                lPrice: item[i]["lprice"],
                                hPrice: item[i]["hprice"],
                                mallName: item[i]["mallName"],
                                productId: item[i]["productId"],
                                productType: item[i]["productType"],
                                brand: item[i]["brand"],
                                maker: item[i]["maker"],
                                category1: item[i]["category1"],
                                category2: item[i]["category2"],
                                category3: item[i]["category3"],
                                category4: item[i]["category4"],
                            })
                            console.log(item[i]["lprice"]);
                        }
                    }
                    
                    for (i = 0; i < item.length;i++){
                        jsonArray.push(item[i]);
                    }

                    console.log(`type of jsonArray is ${typeof(jsonArray)}`);
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