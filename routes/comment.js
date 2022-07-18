const express = require('express');
const cors = require('cors');
const url = require('url');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal,Comment,Reply, sequelize } = require('../models');
const { json } = require('body-parser');
const { any, reject } = require('bluebird');
const { response } = require('express');
const { resolve } = require('path');
const { Op } = require('sequelize');

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


router.post('/:dealId', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ where: { id: req.user.id } });
    try{
        const comment=await Comment.create({
            userId : user.id,
            content : req.body.content,
            dealId : req.params.dealId
        })
        console.log(req.params.dealId);
        jsonResponse(res,200,"success!",true);
    } catch(err){
        jsonResponse(res, 404, "something wrong", false);
        console.log(err);
    }

})
router.post('/reply/:dealId', isLoggedIn, async (req, res) => { 
    const user = await User.findOne({ where: { id: req.user.id } });
    //const comment = await Comment.findOne({ where: { dealId: req.params.dealId } });
    try {
        await Reply.create({
            userId: user.id,
            content: req.body.content,
            dealId: req.params.dealId,
            parentId:req.body.parentId,
        })
        console.log(req.params.dealId); 
        jsonResponse(res, 200, "create reply!", true);
    } catch (err) {
        jsonResponse(res, 404, "something wrong", false);
        console.log(err);
    }

})

router.delete('/:commentId', isLoggedIn, async (req, res) => {
    
    const comment = await Comment.findOne({ where: { id: parseInt(req.params.commentId), isDeleted: { [Op.eq]: null } } });
    if(comment===null){
        jsonResponse(res, 404, "already deleted comment", false);
        res.end();
    }
    else{
        if (comment.userId === req.user.id) {
            try {
                await comment.update({
                    isDeleted: 1
                })
                jsonResponse(res, 200, "delete complete!", false);
            } catch (err) {
                jsonResponse(res, 404, "something wrong", false);
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 404, "only writer can delete comments", false, {})
        }
    }
})

router.delete('/reply/:replyId', isLoggedIn, async (req, res) => {
    const reply = await Reply.findOne({ where: { id: parseInt(req.params.replyId), isDeleted: { [Op.eq]: null } } });
    if (reply === null) {
        jsonResponse(res, 404, "already deleted reply", false);0
        res.end();
    }
    else {
        if (reply.userId === req.user.id) {
            try {
                await reply.update({
                    isDeleted: 1
                })
                jsonResponse(res, 200, "delete complete!", true);
            } catch (err) {
                jsonResponse(res, 404, "something wrong", false);
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 404, "only writer can delete reply", false, {})
        }
    }
})

router.put('/:commentId', isLoggedIn, async (req, res) => {

    const comment = await Comment.findOne({ where: { id: parseInt(req.params.commentId), isDeleted: { [Op.eq]: null } } });
    if (comment === null) {
        jsonResponse(res, 404, "comment not exist", false);
        res.end();
    }
    else {
        if (comment.userId === req.user.id) {
            try {
                await comment.update({
                    content:req.body.content
                })
                jsonResponse(res, 200, "edit complete!", {});
            } catch (err) {
                jsonResponse(res, 404, "something wrong", {});
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 404, "only writer can edit comments", false, {})
        }
    }
})

router.put('/reply/:replyId', isLoggedIn, async (req, res) => {
    const reply = await Reply.findOne({ where: { id: parseInt(req.params.replyId), isDeleted: { [Op.eq]: null } } });
    if (reply === null) {
        jsonResponse(res, 404, "deleted reply", false);
        res.end();
    }
    else {
        if (reply.userId === req.user.id) {
            try {
                await reply.update({
                    content: req.body.content
                })
                jsonResponse(res, 200, "edit complete!", {});
            } catch (err) {
                jsonResponse(res, 404, "something wrong", {});
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 404, "only writer can edit reply", false, {})
        }
    }
})  
router.get('/:dealId',async(req,res)=>{
 

    // let status, description;
    // const group = await Group.findOne({ where: { userId: req.params.userId, dealId: req.params.dealId } });
    // if (!group) {
    //     description = "참여하지 않음";
    //     status = 0;
    // }
    // else {
    //     const deal = await group.getDeal();
    //     // console.log("deal.userId : " + typeof deal.userId);
    //     // console.log("req.params.userId : " + typeof req.params.userId);            
    //     if (deal.userId == req.params.userId) { //deal.userId는 number 형이고 req.params.userId는 string형 이므로 == 를 사용해야함.
    //         description = "제안자";
    //         status = 2;
    //     }
    //     else {
    //         description = "참여자";
    //         status = 1;
    //     }
    // }
    // const result = {
    //     participation: status,
    //     description: description,
    //     userId: req.params.userId,
    //     dealId: req.params.dealId,
    // }







    const suggest=await Deal.findOne({where:{id:req.params.dealId},attributes:['id','userId']});


    const comments=await Comment.findAll({
        where:{dealId:req.params.dealId},
        include: [{
            model: User,
            attributes: ['id','nick'],
            include:[{
                model:Group,
                attributes:['userId','dealId'],
                //where:{'dealId':req.params.dealId}
            }, 
            ]
        },
        {
            model: Reply,
            include: [{
                model: User,
                attributes: ['nick'],
                include: [{
                    model: Group,
                    attributes: ['userId', 'dealId'],
                    //where: { 'dealId': req.params.dealId }
                }, 
                ]
            },

        ]

        }],
    

    })
    const result={"suggest":suggest,"comments":comments}
    jsonResponse(res,200,"get comments",true,result);

})



module.exports = router;