const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const path=require('path');


const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal } = require('../models');
const { json } = require('body-parser');

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

router.get('/location',isLoggedIn, (req, res) => {
    console.log(__dirname)
    res.sendFile(path.resolve(__dirname+'/../views/index.html'))
    //var tmp=res.session.get("key1");
    //console.log(tmp);
})

router.put('/location', (req, res) => {
    console.log(req.body.test_value);
    console.log(req.session.user)
    //const user = await User.findOne({ where: { Id: req.params.userId } });

    const result={value: req.body.test_value}
    jsonResponse(res,200,"현재 위치 조회에 성공하였습니다.",true,result)
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