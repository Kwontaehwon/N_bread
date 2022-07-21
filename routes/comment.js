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
        jsonResponse(res,200,"댓글 작성에 성공하였습니다.",true);
    } catch(err){
        jsonResponse(res, 404, "댓글 삭제에 실패하였습니다.", false);
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
        jsonResponse(res, 200, "답글 작성에 성공하였습니다.", true);
    } catch (err) {
        jsonResponse(res, 404, "댓글 작성에 실패하였습니다.", false);
        console.log(err);
    }

})

router.delete('/:commentId', isLoggedIn, async (req, res) => {
    
    const comment = await Comment.findOne({ where: { id: parseInt(req.params.commentId), deletedAt: { [Op.eq]: null } } });
    if(comment===null){
        jsonResponse(res, 404, "이미 삭제된 댓글입니다.", false);
        res.end();
    }
    else{
        if (comment.userId === req.user.id) {
            try {
                await comment.destroy();
                jsonResponse(res, 200, "삭제가 완료되었습니다.", false);
            } catch (err) {
                jsonResponse(res, 404, err, false);
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 404, "댓글의 작성자만 댓글을 삭제할 수 있습니다.", false, {})
        }
    }
})

router.delete('/reply/:replyId', isLoggedIn, async (req, res) => {
    const reply = await Reply.findOne({ where: { id: parseInt(req.params.replyId), deletedAt: { [Op.eq]: null } } });
    if (reply === null) {
        jsonResponse(res, 404, "이미 삭제된 답글입니다.", false);0
        res.end();
    }
    else {
        if (reply.userId === req.user.id) {
            try {
                await reply.destroy();
                jsonResponse(res, 200, "삭제에 성공하였습니다.", true);
            } catch (err) {
                jsonResponse(res, 404, err, false);
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 403, "답글의 생성자만 답글을 삭제할 수 있습니다.", false, {})
        }
    }
})

router.put('/:commentId', isLoggedIn, async (req, res) => {

    const comment = await Comment.findOne({ where: { id: parseInt(req.params.commentId), deletedAt: { [Op.eq]: null } } });
    if (comment === null) {
        jsonResponse(res, 403, "댓글이 존재하지 않습니다.", false);
        res.end();
    }
    else {
        if (comment.userId === req.user.id) {
            try {
                await comment.update({
                    content:req.body.content
                })
                jsonResponse(res, 200, "댓글 수정에 성공하였습니다.", {});
            } catch (err) {
                jsonResponse(res, 404, "", {});
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 403, "댓글 작성자만 댓글을 수정할 수 있습니다.", false, {})
        }
    }
})

router.put('/reply/:replyId', isLoggedIn, async (req, res) => {
    const reply = await Reply.findOne({ where: { id: parseInt(req.params.replyId)} });
    if (reply === null) {
        jsonResponse(res, 404, "답글이 존재하지 않습니다.", false);
        res.end();
    }
    else {
        if (reply.userId === req.user.id) {
            try {
                await reply.update({
                    content: req.body.content
                })
                jsonResponse(res, 200, "답글 수정이 완료되었습니다.", {});
            } catch (err) {
                //jsonResponse(res, 404, "something wrong", {});
                console.log(err);
            }
        }
        else {
            jsonResponse(res, 403, "작성자만 답글을 수정할 수 있습니다.", false, {})
        }
    }
})  
router.get('/:dealId',async(req,res)=>{

    const suggest=await Deal.findOne({where:{id:req.params.dealId},attributes:['id','userId']});
    const group=await Group.findAll({where:{dealId:req.params.dealId},attributes:['dealId','userId']});


    const comments=await Comment.findAll({
        where:{dealId:req.params.dealId},
        paranoid: false,
        include: [{
            model: User,
            attributes: ['id','nick'],
        },
        {
            model: Reply,
            paranoid: false,
            include: [{
                model: User,
                attributes: ['nick'],
            }]
        }],
    })
    const result={"suggest":suggest,"group":group,"comments":comments};
    jsonResponse(res,200,"get comments",true,result);

})



module.exports = router;