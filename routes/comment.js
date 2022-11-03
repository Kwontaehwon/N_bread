const express = require('express');
const cors = require('cors');
const url = require('url');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const { isLoggedIn, isNotLoggedIn ,verifyToken} = require('./middlewares');
const { User, Group, Deal,Comment,Reply, sequelize } = require('../models');
const { json } = require('body-parser');
const { any, reject } = require('bluebird');
const { response } = require('express');
const { resolve } = require('path');
const { Op, Sequelize } = require('sequelize');
const logger = require('../config/winston');
const admin = require("firebase-admin");

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


router.post('/:dealId', verifyToken, async (req, res) => {
    // #swagger.summary = '댓글 생성'
    const user = await User.findOne({ where: { id: req.decoded.id } });
    try{
        const comment = await Comment.create({
            userId : user.id,
            content : req.body.content,
            dealId : req.params.dealId
        }) 
        console.log(req.params.dealId);
        jsonResponse(res, 200, "댓글 작성에 성공하였습니다.", true, comment);
    } catch(err){
        jsonResponse(res, 500, "[댓글 생성] POST comments/:dealId 서버 에러", false);
        logger.error(err);
    }

})
router.post('/reply/:dealId', verifyToken, async (req, res) => {
    // #swagger.summary = '대댓글 생성'
    try{
        const user = await User.findOne({ where: { id: req.decoded.id } });
        //const comment = await Comment.findOne({ where: { dealId: req.params.dealId } });
        if(user == null){
            return jsonResponse(res, 404, `userId ${req.decoded.id} 에 해당하는 유저를 찾을 수 없습니다. `, false, null);
        }
        const reply = await Reply.create({
            userId: user.id,
            content: req.body.content,
            dealId: req.params.dealId,
            parentId:req.body.parentId,
        })
        const parentComment = await Comment.findOne({where : { id : req.body.parentId }});
        const [result, meta] = await sequelize.query(`SELECT DISTINCT userId FROM replies WHERE parentId = ${req.body.parentId}`);
        let fcmTokenList = [];
        for(let targetId of result){
            if(targetId == user.id) continue;
            const fcmTokenJson = await axios.get(`https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${targetId}`); // ${user.id}
            if(Object.keys(fcmTokenJson.data).length !== 0){
                const fcmToken = fcmTokenJson.data.Item.fcmToken;
                fcmTokenList.push(fcmToken);
            }
        }
        console.log(`fcmTokenList : ${fcmTokenList}`);
        if(fcmTokenList.length > 0){
            const content = reply.content;
            await admin.messaging().sendMulticast({
                tokens: fcmTokenList,
                notification: {
                    title: "N빵에 새로운 대댓글이 달렸어요",
                    body: content,
                },
                data: {
                    type : "deal",
                    dealId : `${reply.dealId}`
                }
            });
        }
        jsonResponse(res, 200, "답글 작성에 성공하였습니다.", true);
    }
     catch (err) {
        jsonResponse(res, 500, "[대댓글 생성] POST /comments/reply/:dealId 서버 에러", false);
        logger.error(err);
    }

})

router.delete('/:commentId', verifyToken, async (req, res) => {
    // #swagger.summary = '댓글 삭제'
    try{ 
        const user = await User.findOne({ where: { id: req.decoded.id } });
        const comment = await Comment.findOne({ where: { id: parseInt(req.params.commentId), deletedAt: { [Op.eq]: null } } });
        if(comment===null){npm
            jsonResponse(res, 404, "해당 댓글을 찾을 수 없습니다.", false);
            res.end();
        }
        else{
            if (comment.userId === user.id) {
                try {
                    await comment.destroy();
                    jsonResponse(res, 200, "삭제가 완료되었습니다.", false);
                } catch (err) {
                    jsonResponse(res, 404, err, false);
                    console.log(err);
                }
            }
            else {
                jsonResponse(res, 403, "댓글의 작성자만 댓글을 삭제할 수 있습니다.", false, {})
            }
        }
    } catch (error){
        jsonResponse(res, 500, "[대댓글 생성] POST /comments/reply/:dealId 서버 에러", false);
        logger.error(error);
    }

})

router.delete('/reply/:replyId', verifyToken, async (req, res) => {
    // #swagger.summary = '대댓글 삭제'
    try{
        const user = await User.findOne({ where: { id: req.decoded.id } });
        const reply = await Reply.findOne({ where: { id: parseInt(req.params.replyId), deletedAt: { [Op.eq]: null } } });
        if (reply === null) {
            jsonResponse(res, 404, "이미 삭제된 답글입니다.", false);0
            res.end();
        }
        else {
            if (reply.userId === user.id) {
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
    }
    catch(error){
        logger.error("[대댓글 삭제] POST /comments/reply/:replyId 서버 에러");
        jsonResponse(res, 500, "[대댓글 삭제] POST /comments/reply/:replyId 서버 에러", false);
    }
})

router.put('/:commentId', verifyToken, async (req, res) => {
    // #swagger.summary = '댓글 수정'
    try{
        const user = await User.findOne({ where: { id: req.decoded.id } });
        const comment = await Comment.findOne({ where: { id: parseInt(req.params.commentId), deletedAt: { [Op.eq]: null } } });
        if (comment === null) {
            jsonResponse(res, 403, "댓글이 존재하지 않습니다.", false);
            res.end();
        }
        else {
            if (comment.userId === user.id) {
                await comment.update({
                    content:req.body.content
                })
                jsonResponse(res, 200, "댓글 수정에 성공하였습니다.", {});
            }
            else {
                jsonResponse(res, 403, "댓글 작성자만 댓글을 수정할 수 있습니다.", false, {})
            }
        }
    } catch(error){
        logger.error("[대댓글 생성] POST /comments/reply/:dealId 서버 에러");
        jsonResponse(res, 500, "[대댓글 생성] POST /comments/reply/:dealId 서버 에러", false);
    }
})

router.put('/reply/:replyId', verifyToken, async (req, res) => {
    // #swagger.summary = '대댓글 수정'
    try{
        const user = await User.findOne({ where: { id: req.decoded.id } });
        const reply = await Reply.findOne({ where: { id: parseInt(req.params.replyId)} });
        if (reply === null) {
            jsonResponse(res, 404, "답글이 존재하지 않습니다.", false);
            res.end();
        }
        else {
            if (reply.userId === user.id) {
                await reply.update({
                    content: req.body.content
                })
                jsonResponse(res, 200, "답글 수정이 완료되었습니다.", {});
            }
            else {
                jsonResponse(res, 403, "작성자만 답글을 수정할 수 있습니다.", false, {})
            }
        }
    } catch(error){
        logger.error("[대댓글 생성] POST /comments/reply/:dealId 서버 에러");
        jsonResponse(res, 500, "[대댓글 생성] POST /comments/reply/:dealId 서버 에러", false); 
    }

})  
router.get('/:dealId',async(req,res)=>{
    // #swagger.summary = '거래글 댓글 조회'
    try{
        const suggest=await Deal.findOne({where:{id:req.params.dealId},attributes:['id','userId']});
        const group=await Group.findAll({where:{dealId:req.params.dealId},attributes:['dealId','userId']});
    
        const comments=await Comment.findAll({
            where:{dealId:req.params.dealId},
            paranoid: false,
            include: [{
                model: User,
                attributes: ['nick','userStatus'],
                paranoid: false,
            },
            {
                model: Reply,
                paranoid: false,
                required:false,
                where: { dealId: req.params.dealId },
                include: {
                    model: User,
                    attributes: ['nick','userStatus'],
                    paranoid: false,
                    
                }
            }],
        })
        //userStatus처리
        const suggester=suggest['userId']; 
        var groupMember=[];
        for(i=0;i<group.length;i++){
            groupMember.push(group[i]['userId']);
            console.log(group[i]['userId']);
        }
        //console.log(comments[0]['dataValues']);
        //comment userStatus처리
        for(i=0;i<comments.length;i++){
            //deleted comment 처리
            if(comments[i]['deletedAt']!=null){
                comments[i]['content']="삭제된 댓글입니다.";
            }
    
    
    
            // comments UserStatus
            if(comments[i]['userId']===suggester){
                comments[i]['User']["userStatus"]="제안자";
            }else if(groupMember.includes(comments[i]['userId'])){
                comments[i]['User']['userStatus']="참여자"
            }else{
                comments[i]['User']['userStatus'] = ""
            }
    
            //reply UserStauts
            for(j=0;j<comments[i]['Replies'].length;j++){
                var curReply=comments[i]['Replies'][j];
                if(curReply['deletedAt']!=null){
                    curReply['content']="삭제된 댓글입니다."
                }
    
    
                if (curReply['userId']==suggester){
                    curReply['User']['userStatus']="제안자"
                } else if(groupMember.includes(curReply['userId'])){
                    curReply['User']['userStatus']="참여자"
                }
                else{
                    curReply['User']['userStatus'] = ""
                }
            }
    
        } 
        const result={"suggest":suggest,"group":group,"comments":comments}; 
        jsonResponse(res,200,"get comments",true,result);
    } catch(error){
        logger.error("[거래 댓글 조회] GET /comments/:dealId");
        jsonResponse(res, 500, "[거래 댓글 조회] GET /comments/:dealId", false); 
    }


})



module.exports = router;
