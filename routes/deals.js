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


const { User, Group, Deal,Comment,Reply, DealImage, DealReport } = require('../models');
const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { Op } = require('sequelize');
const logger = require('../config/winston');
const { timeLog } = require('console');


const router = express.Router();

function jsonResponse(res, code, message, isSuccess, result){
  res.status(code).json({
    code : code,
    message : message,
    isSuccess : isSuccess,
    result : result
  })
}


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
    key : async (req, file, cb) => {
      const dealImages = await DealImage.findAll({where : {dealId : req.params.dealId}})
      console.log(dealImages);
      if(dealImages.length > 0){
        for(dealImage of dealImages){
          await dealImage.destroy(); // 그냥 삭제하는 것이 맞는가? 거래 수정됬을 때 어떻게 수정하면 좋을까?
        }
      }
      cb(null, `original/${Date.now()}_${file.originalname}`)
    }
  }),
  limits : {fileSize : 100 * 1024 * 1024} // 이미지 최대 size 5MB
})

router.post('/:dealId/img', upload.array('img'),  async (req,res)=>{
  // #swagger.summary = 'S3 이미지(Array) 업로드'
  try{
    const dealId = parseInt(req.params.dealId);
    if(Number.isNaN(dealId)){
      logger.info(`[거래 이미지 생성] POST /deals/:dealId/img의 :dealId에 잘못된 값 ${req.params.dealId}가 입력되었습니다.`);
      return jsonResponse(res, 400, `[거래 이미지 생성] POST /deals/:dealId/img의 :dealId에 잘못된 값 ${req.params.dealId}가 입력되었습니다.`, false); 
    }
    const targetDeal = await Deal.findOne({where : {id : dealId}});
    if(targetDeal === null){
      logger.info(`[거래 이미지 생성] POST /deals/:dealId/img의 dealId : ${dealId}에 해당되는 거래를 찾을 수 없습니다.`);
      return jsonResponse(res, 404, `[거래 이미지 생성] POST /deals/:dealId/img의 dealId : ${dealId}에 해당되는 거래를 찾을 수 없습니다.`, false); 
    }
    const result = [];
    for(let i of req.files){
      console.log(i);
      const originalUrl = i.location;
      // const newUrl = originalUrl.replace(/\/original\//, '/thumb/');
      result.push(originalUrl);
    }
    if(result.length > 0){
      for(let url of result){
        console.log(url);
        const tmpImage = await DealImage.create({
          dealImage: url,
          dealId: dealId,
        })
        logger.info(`dealId : ${dealId}에 dealImageId : ${tmpImage.id} 가 생성되었습니다.`);
      }
    }
    return jsonResponse(res, 200, `dealId : ${dealId}에 ${result.length}개의 이미지가 생성되었습니다.`, true, `${result}` );
  } catch(error){
    logger.error(`[거래 이미지 생성] POST /deals/:dealId/img ${error}`);
    jsonResponse(res, 500, "[거래 이미지 생성] POST /deals/:dealId/img", false); 
  }

} )


// 전체거래(홈화면) deals/all/?isDealDone={}&offset={}&limit={}
// offset, limit 적용 방안 생각해야됨.
router.get('/all/:range/:region', async (req, res, next) => {
  // #swagger.summary = '지역 전체 거래 GET'
  try{
    var token = req.headers.authorization;
    console.log(`token is ${token}`)
    var allDeal;
    if(req.params.range==="loc1"){
      allDeal = await Deal.findAll({
        where: {
          [Op.or]: [
            { loc1: req.params.region },
            { loc1: 'global' }
          ]
        },
        order: [['createdAt', 'DESC']],
        include: [{
          model: DealImage,
          attributes: ['dealImage', 'id']
        },
        { model: User, attributes: ['nick', 'curLocation3'], paranoid: false },
        ]
      });
    } else if (req.params.range === "loc2"){
      if(req.params.region==="강남구"||req.params.region==="서초구"){
        allDeal = await Deal.findAll({
          where: {
            [Op.or]: [
              { loc2: '강남구' },
              { loc2: '서초구' },
              { loc2: 'global' }
            ]
          },
          order: [['createdAt', 'DESC']],
          include: [{
            model: DealImage,
            attributes: ['dealImage', 'id']
          },
          { model: User, attributes: ['nick', 'curLocation3'], paranoid: false },
          ]
        });

      }
      else{
        allDeal = await Deal.findAll({
          where: {
            [Op.or]: [
              { loc2: req.params.region },
              { loc2: 'global' }
            ]
          },
          order: [['createdAt', 'DESC']],
          include: [{
            model: DealImage,
            attributes: ['dealImage', 'id']
          },
          { model: User, attributes: ['nick', 'curLocation3'], paranoid: false },
          ]
        });

      }
      

    } else if (req.params.range === "loc3") {
      allDeal = await Deal.findAll({
        where: {
          [Op.or]: [
            { loc3: req.params.region },
            { loc3: 'global' }
          ]
        },
        order: [['createdAt', 'DESC']],
        include: [{
          model: DealImage,
          attributes: ['dealImage', 'id']
        },
        { model: User, attributes: ['nick', 'curLocation3'], paranoid: false },
        ]
      });

    }
    for(i=0;i<allDeal.length;i++){
      var toSetStatus=allDeal[i];
      toSetStatus['mystatus'] = "user";
      var dDate = new Date(toSetStatus['dealDate']);
      dDate.setHours(dDate.getHours() + 9);
      toSetStatus['dealDate'] = dDate;
      if (toSetStatus['dealDate'] < new Date(Date.now())){
        if (toSetStatus['currentMember'] === toSetStatus['totalMember']) toSetStatus['status']="거래완료";
        else toSetStatus['status']="모집실패";
      }
      else{
        if (toSetStatus['currentMember'] === toSetStatus['totalMember']) toSetStatus['status'] = "모집완료";
        else toSetStatus['status'] = "모집중";
      } 
    }
  
    if (token != undefined) {
      //mystatus 처리->"제안자" "참여자" ""
      var decodedValue=jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
      for (i = 0; i < allDeal.length; i++) {
        var toSetStatus = allDeal[i];
        if (toSetStatus['userId']===decodedValue.id) {
          toSetStatus['mystatus']="제안자"
        }else{ 
          var groupMember = [];
          var group=await Group.findAll({where:{dealId:toSetStatus['id']}});
          for(j=0;j<group.length;j++){
            groupMember.push(group[j]['userId']);
          }
          if(groupMember.includes(decodedValue.id)){
            toSetStatus['mystatus']="참여자"
          }
        }
      }
    }
    var testres={"capsule":allDeal} 
    return jsonResponse(res, 200, "전체 글 리스트", true, testres);
  } catch(error){
    logger.error(`[홈 전체 글 리스트] GET /deals/all/:region`);
    jsonResponse(res, 500, "[홈 전체 글 리스트] GET /deals/all/:region", false); 
  }

})

router.get('/all/:region', async (req, res, next) => {
  // #swagger.summary = '지역 전체 거래 GET(삭제예정)'
  try {
    var token = req.headers.authorization;
    console.log(`token is ${token}`)
    allDeal = await Deal.findAll({
      where: {
        [Op.or]: [
          { loc3: req.params.region },
          { loc3: 'global' }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: DealImage,
        attributes: ['dealImage', 'id']
      },
      { model: User, attributes: ['nick', 'curLocation3'], paranoid: false },
      ]
    });
  
    for (i = 0; i < allDeal.length; i++) {
      var toSetStatus = allDeal[i];
      toSetStatus['mystatus'] = "user";
      var dDate = new Date(toSetStatus['dealDate']);
      dDate.setHours(dDate.getHours()); //2.0.1업데이트 시 +9해주기
      toSetStatus['dealDate'] = dDate;
      if (toSetStatus['dealDate'] < new Date(Date.now())) {
        if (toSetStatus['currentMember'] === toSetStatus['totalMember']) toSetStatus['status'] = "거래완료";
        else toSetStatus['status'] = "모집실패";
      }
      else {
        if (toSetStatus['currentMember'] === toSetStatus['totalMember']) toSetStatus['status'] = "모집완료";
        else toSetStatus['status'] = "모집중";
      }
    }

    if (token != undefined) {
      //mystatus 처리->"제안자" "참여자" ""
      var decodedValue = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
      for (i = 0; i < allDeal.length; i++) {
        var toSetStatus = allDeal[i];
        if (toSetStatus['userId'] === decodedValue.id) {
          toSetStatus['mystatus'] = "제안자"
        } else {
          var groupMember = [];
          var group = await Group.findAll({ where: { dealId: toSetStatus['id'] } });
          for (j = 0; j < group.length; j++) {
            groupMember.push(group[j]['userId']);
          }
          if (groupMember.includes(decodedValue.id)) {
            toSetStatus['mystatus'] = "참여자"
          }
        }
      }
    }
    var testres = { "capsule": allDeal }
    return jsonResponse(res, 200, "전체 글 리스트", true, testres);
  } catch (error) {
    logger.error(`[홈 전체 글 리스트] GET /deals/all/:region`);
    jsonResponse(res, 500, "[홈 전체 글 리스트] GET /deals/all/:region", false);
  }

})


// 거래 생성하기
router.post('/create', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 생성'
  try {
    // console.log(req.body);
    // const parseResult = await JSON.parse(body);
    const { title, link, totalPrice, personalPrice, totalMember, dealDate, place, content, region} = req.body; // currentMember 수정 필요.

    const user = await User.findOne({where: { Id: req.decoded.id }});
    if(!user){
      logger.info(`userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`);
      return jsonResponse(res, 404, `userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`, false, null);
    }
    const group = await Group.create({
      amount: 1,
      userId : user.id,
    })
    const deal = await Deal.create({
      link:link,
      title : title,
      content : content,
      totalPrice : totalPrice,
      personalPrice : personalPrice,
      totalMember : totalMember,
      dealDate : new Date(dealDate), // 날짜 변환
      dealPlace : place,
      currentMember : 1, // 내가 얼마나 가져갈지 선택지를 줘야할듯
      userId : user.id,
      loc1: user.curLocation1,
      loc2: user.curLocation2,
      loc3: user.curLocation3,
    })
    await group.update({ dealId : deal.id }); // 업데이트
    logger.info(`userId : ${deal.id} 거래가 생성되었습니다.`);
    return jsonResponse(res, 200, "거래가 생성되었습니다", true, deal);
  } catch (error) {
    logger.error(error);
    return jsonResponse(res, 500, "[거래 생성] POST /deals/create 서버 에러", false, null);
  }
});


// 거래 세부정보
router.get('/:dealId', async (req, res, next) => {
  // #swagger.summary = '거래 세부정보 GET'
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
    return jsonResponse(res, 500, "[거래 세부정보] GET /deals/:dealId 서버 에러", false, null);
  }
})


// 거래 수정하기
router.put('/:dealId', verifyToken, async(req, res, next) => {
  // #swagger.summary = '거래 수정'
  const { title, content, totalPrice, personalPrice, totalMember, dealDate, dealPlace, 
    currentMember} = req.body;
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      logger.info(`dealId : ${req.params.dealId}에 매칭되는 거래를 찾을 수 없습니다.`);
      return jsonResponse(res, 404, `dealId : ${req.params.dealId} 에 매칭되는 거래를 찾을 수 없습니다.`, false, null);
    }
    if(deal.userId != req.decoded.id){
      logger.info(`userId : ${req.decoded.id}는 거래를 수정할 권한이 없습니다.`);
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
    return jsonResponse(res, 500, '[거래 수정] PUT deals/:dealId 서버 에러', false, null);
  }
})


// 거래 삭제
router.delete('/:dealId', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 삭제'
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      return jsonResponse(res, 404, 'dealId에 매칭되는 deal를 찾을 수 없습니다.', false, null);
    }
    if (deal.userId != req.decoded.id){
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
    return jsonResponse(res, 500, '[거래 삭제] Delete /deals/:dealId 서버 에러', false, null);
  }
})


// 참여자 : 거래 참여하기
router.post('/:dealId/join/:userId', verifyToken, async (req, res, next) => {
  // #swagger.summary = '거래 참여'
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
    return jsonResponse(res, 500, `[거래 참여] deals/:dealId/join/:userId 서버 에러`, false, null) 
  }
});

// 거래에 대응되는 userId에 대해 제안자, 참여자 여부
router.get('/:dealId/users/:userId', async (req, res, next) => {
  // #swagger.summary = '거래 유저 상태(참여자, 제안자, 참여하지 않음)'
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
      return jsonResponse(res, 500, "[거래 유저 상태] GET deals/:dealId/users/:userId 서버 에러", false, null)
  }
});


router.post('/:dealId/report', verifyToken, async(req, res, next) => {
  // #swagger.summary = '거래 신고'
  try{
    const {title, content } = req.body;
    if(req.params.dealId == ":dealId"){
      return jsonResponse(res, 404, `parameter :dealId가 필요합니다.`, false, null);
    }
    const user = await User.findOne({where: { Id: req.decoded.id }});
    const deal = await Deal.findOne({where : { Id : req.params.dealId} });

    if(!user){
      logger.info(`userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`);
      return jsonResponse(res, 404, `userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`, false, null);
    }
    if(!deal){
      logger.info(`dealId : ${req.parms.dealId} 에 해당되는 거래가 없습니다.`);
      return jsonResponse(res, 404, `dealId : ${req.parms.dealId} 에 해당되는 거래가 없습니다.`, false, null);
    }
    if(user.id === deal.userId){
      logger.info(`userId : ${req.decoded.id} 자신이 작성한 글을 신고 할 수 없습니다.`);
      return jsonResponse(res, 403, `userId : ${req.decoded.id} 자신이 작성한 글을 신고 할 수 없습니다.`, false, null);
    }
    const dealReport = await DealReport.create({
      title : title,
      content : content,
      reporterId : req.decoded.id,
      dealId : req.params.dealId
    })
    logger.info(`${req.decoded.id}님이 dealId : ${req.params.dealId}글을 신고 하였습니다.`);
    return jsonResponse(res, 200, `${req.decoded.id}님이 dealId : ${req.params.dealId}글을 신고 하였습니다.`, true, dealReport);
  }catch(error){
    console.error(error);
    return jsonResponse(res, 500, "[거래 신고] deals/:dealId/report 서버 에러", false, null)
  }
});

router.post('/:dealId/endRecruit', verifyToken, async(req, res, next) => {
  // #swagger.summary = '모집 마감하기'
  // #swagger.deprecated = true
  try{
    const deal = await Deal.findOne({ where : {id : req.params.dealId}});
    if(!deal){
      return jsonResponse(res, 404, "dealId에 매칭되는 거래를 찾을 수 없습니다.", false, null)
    }
    if (deal.userId != req.decoded.id){
      return jsonResponse(res, 403, '글의 작성자만 모집을 마감 할 수 있습니다.', false, null)
    }
    deal.update({where : {isRecruitDone : true}});
    const groups = await Group.findAll({where : {dealId : deal.id}});
    const result = {deal : deal, groups : groups};
    return jsonResponse(res, 200, "모집이 정상적으로 마감되었습니다.", true, result);
  }
  catch(error){
    console.error(error);
    return jsonResponse(res, 500, "[모집 마감 - 삭제됨] POST /deals/:dealId/endRecruit 서버 에러", false, null)
  }
});

//관리자용 api
//deals Table의 loc1, loc2, loc3을 채우기 위함
router.post('/admin/fillLocation', async (req, res, next) => {
  // #swagger.summary = '관리자 : deals Table loc1,2,3'
  // #swagger.deprecated = true
  try {
    const deal=await Deal.findAll();
    for(i=0;i<deal.length;i++){
      var curDeal=deal[i];
      console.log(curDeal.userId);
      const user=await User.findOne({where:{id:curDeal.userId}, paranoid:false});
      await curDeal.update({loc1:user.curLocation1});
      curDeal.loc1=user.curLocation1;
      curDeal.loc2 = user.curLocation2;
      curDeal.loc3 = user.curLocation3;
    }
    return jsonResponse(res, 200, "[관리자용 api] POST /admin/fillLocation 가 성공적으로 수행되었습니다.", true, null)
  } catch (error) {
    console.error(error);
    return jsonResponse(res, 500, "[관리자용 api] POST /admin/fillLocation 에러", false, null)}
});

// router.post('/:dealId/endDeal', isLoggedIn, async(req, res, next) => {
//   try{
//     const deal = await Deal.findOne({ where : {id : req.params.dealId}});
//     if(!deal){
//       return jsonResponse(res, 404, "dealId에 매칭되는 거래를 찾을 수 없습니다.", false, null)
//     }
//     if(deal.userId != req.user.id){
//       return jsonResponse(res, 403, '글의 작성자만 거래를 마감할 수 있습니다.', false, null)
//     }
//     // 거래 시간이 지난 후에만 거래를 마감 할 수 있게?
//     deal.update({isDealDone : true, isRecruitDone : true}); // 일단 recruitDone 확인하지 않고 둘다 true로 만들어줌.
//     const groups = await Group.findAll({where : {dealId : deal.id}});
//     const result = {deal : deal, groups : groups};
//     return jsonResponse(res, 200, "거래가 정상적으로 마감되었습니다.", true, result);
//   }
//   catch (error){
//     logger.error(error);
//     return jsonResponse(res, 500, "서버 에러", false, null)
//   }
// })


module.exports = router;