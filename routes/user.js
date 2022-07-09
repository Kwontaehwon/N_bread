const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal } = require('../models');

const router = express.Router();


router.get('/:userId', async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return res.status(404).json({
                code : 404,
                message : "해당되는 유저가 없습니다.",
                isSuccess : false,
            });
        }
        console.log(user.provider);
        return res.status(200).json({
            code : 200,
            isSuccess : true,
            result : {
                createdAt : user.createdAt,
                nick : user.nick,
                provider : user.provider,
            }
        })
    } catch (error){
        console.log(error);
        return next(error);
    }
});


router.put('/:userId', async (req, res, next) => {
    try{
        const {nick} = req.body;
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return res.status(404).json({
                code : 404,
                isSuccess : false,
                message : "해당되는 유저가 없습니다.",
            });
        }
        const isDuplicated = await User.findOne({ where : {nick : nick}});
        if(isDuplicated){
            return res.status(409).json({
                code : 409,
                isSuccess : false,
                message : "중복된 유저입니다.",
            });
        }
        else{
            await user.update({
                nick : nick
            });
            return res.status(200).json({
                code : 200,
                isSuccess : false,
                message : "닉네임 변경 완료",
                result : {
                    userId : user.id,
                    nick : user.nick,
                }
            });
        }
        
    } catch(error){ 
        console.log(error);
        return next(error);
    }
})


router.get('/:userId/deals/:dealId', async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return res.json({
                code : 404,
                isSuccess : false,
            });
        }
        let status, description;
        const group = await Group.findOne({where : { userId : req.params.userId, dealId : req.params.dealId}});
        console.log(group);
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
        return res.json({
            code : 200,
            isSuccess : true,
            result : {
                participation : status,
                description : description,
                userId : req.params.userId,
                dealId : req.params.dealId,
            }
        })
    } catch (error){
        console.log(error);
        return next(error);
    }
});


router.get('/loc/:userId', async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return res.status(404).json({
                code : 404,
                message : "해당되는 유저가 없습니다.",
                isSuccess : false,
            });
        }
        console.log(user.provider);
        return res.status(200).json({
            code : 200,
            isSuccess : true,
            result : {
                createdAt : user.createdAt,
                nick : user.nick,
                provider : user.provider,
            }
        })
    } catch (error){
        console.log(error);
        return next(error);
    }
});

module.exports = router;