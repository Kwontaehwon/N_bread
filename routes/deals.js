const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const axios = require('axios');
const passport = require('passport');
const schedule = require('node-schedule');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');


const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal,Comment,Reply } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/winston');


const router = express.Router();

function jsonResponse(res, code, message, isSuccess, result){
  res.status(code).json({
    code : code,
    message : message,
    isSuccess : isSuccess,
    result : result
  })
}

// 전체거래(홈화면) deals/all/?isDealDone={}&offset={}&limit={}
// offset, limit 적용 방안 생각해야됨.
router.get('/all', async (req, res, next) => {
  const today = new Date(Date.now());
  const recruitDeadline = new Date();
  recruitDeadline.setDate(today.getDate() - 3);
  const recruitingDeals = await Deal.findAll( {
    where : { [Op.and] : [
      { isDealDone : false },
      { dealDate : {[Op.lt] : recruitDeadline}}
    ]
    },
    order : [['createdAt', 'DESC']],
  });
  const waitingDeals = await Deal.findAll( {
    where : { [Op.and] : [
      { isDealDone : false },
      { dealDate : {[Op.gt] : recruitDeadline}}
    ]
    },
    order : [['createdAt', 'DESC']],
  });
  const doneDeals = await Deal.findAll( { 
    where : { [Op.and] : [
      { isDealDone : true },
    ]
  },
    order : [['createdAt', 'DESC']],
  });
  const result = {recruiting : recruitingDeals, waiting : waitingDeals, done : doneDeals};
  return jsonResponse(res, 200, "전체 글 리스트", true, result);
})


// 거래 생성하기
router.post('/create', isLoggedIn, async (req, res, next) => {
  const { title, content, totalPrice, personalPrice, totalMember, dealDate, dealPlace, 
  currentMember} = req.body; // currentMember 수정 필요.
  try {
    const user = await User.findOne({where: { Id: req.user.id }});
    if(!user){
      logger.info(`userId : ${req.user.id}에 매칭되는 유저가 없습니다.`);
      return jsonResponse(res, 404, `userId : ${req.user.id}에 매칭되는 유저가 없습니다.`, false, null);
    }
    const group = await Group.create({
      amount: 1,
      userId : user.id,
    })
    const deal = await Deal.create({
      title : title,
      content : content,
      totalPrice : totalPrice,
      personalPrice : personalPrice,
      totalMember : totalMember,
      dealDate : new Date(dealDate), // 날짜 변환
      dealPlace : dealPlace,
      currentMember : 1, // 내가 얼마나 가져갈지 선택지를 줘야할듯
      userId : user.id,
    })
    await group.update({ dealId : deal.id }); // 업데이트
    logger.info(`userId : ${deal.id} 거래가 생성되었습니다.`);
    const dealEnd = new Date(deal.dealDate);
    const dealDeadLine = new Date();
    dealDeadLine.setDate(dealEnd.getDate() - 3);
    schedule.scheduleJob(dealDeadLine, async() => {
      await deal.update({isDealDone : true});
    })
    logger.info(`dealId ${deal.id} 의 Deal의 모집 마감 시간이 ${dealDeadLine}으로 스케줄 되었습니다.`);
    return jsonResponse(res, 200, "거래가 생성되었습니다", true, deal);
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null);
  }
});


// 거래 세부정보
router.get('/:dealId', async (req, res, next) => {
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      logger.info(`dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`);
      return jsonResponse(res, 404, `dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`, false, null);
    }
    logger.info(`dealId : ${req.params.dealId} 에 대한 거래정보를 반환합니다.`);
    return jsonResponse(res, 200, `dealId ${deal.id} 의 거래 정보`, true, deal);
  }
  catch (error){
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null);
  }
})


// 거래 수정하기
router.put('/:dealId', isLoggedIn, async(req, res, next) => {
  const { title, content, totalPrice, personalPrice, totalMember, dealDate, dealPlace, 
    currentMember} = req.body;
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      logger.info(`dealId : ${req.params.dealId}에 매칭되는 거래를 찾을 수 없습니다.`);
      return jsonResponse(res, 404, `dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`, false, null);
    }
    if(deal.userId != req.user.id){
      logger.info(`userId : ${req.user.id}는 거래를 수정할 권한이 없습니다.`);
      return jsonResponse(res, 403, `글의 작성자만 거래를 수정할 수 있습니다.`, false, null);
    }
    const groups = await Group.findAll({where : {dealId : deal.id}});
    if(groups.length > 1){
      logger.info(`참여자가 ${groups.length -1}명 있으므로 거래를 수정 할 수 없습니다.`);
      return jsonResponse(res, 400, `참여자가 ${groups.length -1}명 있으므로 거래를 수정 할 수 없습니다.`, false, null);
    }
    await deal.update({
        title : title,
        content : content,
        totalPrice : totalPrice,
        personalPrice : personalPrice,
        totalMember : totalMember,
        dealDate : new Date(dealDate), // 날짜 변환
        dealPlace : dealPlace,
        currentMember : 1, // 내가 얼마나 가져갈지 선택지를 줘야할듯 -> MVP에서는 일단 안주는걸로.
        userId : req.params.userId,
    })
    logger.info( `${deal.id} 의 거래를 수정하였습니다.`)
    return jsonResponse(res, 200, deal.id + `의 거래를 수정하였습니다.`, true, deal);
  }catch (error){
    logger.error(error);
    return jsonResponse(res, 500, '서버 에러', false, null);
  }
})


// 거래 삭제
router.delete('/:dealId', isLoggedIn, async (req, res, next) => {
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      return jsonResponse(res, 404, 'dealId에 매칭되는 deal를 찾을 수 없습니다.', false, null);
    }
    if(deal.userId != req.user.id){
      return jsonResponse(res, 403, '글의 작성자만 거래를 삭제할 수 있습니다.', false, null);
    }
    const groups = await Group.findAll({where : {dealId : deal.id}});
    if(groups.length > 1){
      return jsonResponse(res, 400, '참여자가 있으므로 거래를 삭제할 수 없습니다.', false, null);
    }
    deal.destroy({truncate: true});
    const comment=Comment.findAll({where:{dealId:req.params.dealId}});
    console.log(comment);
    //comment.update({isDeleted:1});
    const reply = Reply.findAll({ where: { dealId: req.params.dealId}});
    console.log(reply);
    //reply.update({isDeleted:1});
    return jsonResponse(res, 200, '정상적으로 거래를 삭제하였습니다.', true, null);
  }
  catch (error){
    logger.error(error);
    return jsonResponse(res, 500, '서버 에러', false, null);
  }
})


// 참여자 : 거래 참여하기
router.post('/:dealId/join/:userId', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({where: { Id: req.params.userId }});
    const deal = await Deal.findOne({where: { Id: req.params.dealId }});
    const isJoin = await Group.findOne({where : { userId : req.params.userId, dealId : req.params.dealId}});
    if(!user){
      return jsonResponse(res, 404, `userId : ${req.params.userId} 에 해당되는 유저가 없습니다.`, false, null);
    }
    if(!deal){
      return jsonResponse(res, 404, `dealId : ${req.parms.dealId} 에 해당되는 거래가 없습니다.`, false, null);
    }
    if(isJoin){
      return jsonResponse(res, 403, `userId : ${req.params.userId} 는 이미 거래에 참여했습니다.`, false, null); // 추가 구매 수량?
    }
    const expireDate = deal.dealDate.setDate(deal.dealDate.getDate() - 3);
    if(expireDate < Date.now()){
      return jsonResponse(res, 401, `거래 모집 시간이 지났습니다.`, false, null);
    }
    const stock = deal.totalMember - deal.currentMember;
    if(stock <= 0){
      logger.log(stock);
      return jsonResponse(res, 400, `구매 가능한 수량 ${stock} 내의 수를 입력해야 합니다.`, false, null);
    }
    const group = await Group.create({
      amount: 1,
      userId : req.params.userId,
      dealId : req.params.dealId,
    })
    await deal.update({currentMember : deal.currentMember + 1});
    return jsonResponse(res, 200, `거래 참여가 완료되었습니다.`, true, {deal : deal, group : group});
  }catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, `서버 에러`, false, null) 
  }
});

// 거래에 대응되는 userId에 대해 제안자, 참여자 여부
router.get('/:dealId/users/:userId', async (req, res, next) => {
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
      logger.log(error);
      return jsonResponse(res, 500, "서버 에러", false, null)
  }
});

router.post('/:dealId/endRecruit', isLoggedIn, async(req, res, next) => {
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      return jsonResponse(res, 404, "dealId에 매칭되는 거래를 찾을 수 없습니다.", false, null)
    }
    if(deal.userId != req.user.id){
      return jsonResponse(res, 403, '글의 작성자만 모집을 마감 할 수 있습니다.', false, null)
    }
    deal.update({where : {isRecruitDone : true}});
    const groups = await Group.findAll({where : {dealId : deal.id}});
    const result = {deal : deal, groups : groups};
    return jsonResponse(res, 200, "모집이 정상적으로 마감되었습니다.", true, result);
  }
  catch(error){
    console.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null)
  }
});

router.post('/:dealId/endDeal', isLoggedIn, async(req, res, next) => {
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      return jsonResponse(res, 404, "dealId에 매칭되는 거래를 찾을 수 없습니다.", false, null)
    }
    if(deal.userId != req.user.id){
      return jsonResponse(res, 403, '글의 작성자만 거래를 마감할 수 있습니다.', false, null)
    }
    // 거래 시간이 지난 후에만 거래를 마감 할 수 있게?
    deal.update({isDealDone : true, isRecruitDone : true}); // 일단 recruitDone 확인하지 않고 둘다 true로 만들어줌.
    const groups = await Group.findAll({where : {dealId : deal.id}});
    const result = {deal : deal, groups : groups};
    return jsonResponse(res, 200, "거래가 정상적으로 마감되었습니다.", true, result);
  }
  catch (error){
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null)
  }
})

AWS.config.update({
  region : 'ap-northeast-2',
  accessKeyId : process.env.S3_ACCESS_KEY_ID,
  secretAccessKey : process.env.S3_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket : 'nbreadimg',
    key : (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`)
    }
  }),
  limits : {fileSize : 5 * 1024 * 1024} // 이미지 최대 size 5MB
})

router.post('/img', isLoggedIn, upload.single('img'),  (req,res)=>{
  logger.info(req.file);
  return jsonResponse(res, 200, `${req.file.location} 반환`, true, `${req.file.location}` );
} )

module.exports = router;