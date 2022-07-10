const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();


router.get('/all', async (req, res, next) => {
  // Op.lt, Op.gt 왜 할당이 안될까
  let deals;
  if(req.params.isDealDone == 1){
    deals = await Deal.findAll( {
      where : { [Op.or] : [
        { dealDate : { [Op.lt] : Date.now() } },
        { currentMember : {[Op.not] : Deal.totalMember}}, // 모집중, 거래대기중, 거래완료를 구분할 필요 있음.
        { isDealDone : 1},
      ]
     },
     order : [['dealDate', 'DESC']],
     limit: Number(req.query.limit),
     offset: Number(req.query.offset)
    });
  }
  else{
    deals = await Deal.findAll( {
      where : { [Op.or] : [
        { dealDate : { [Op.gt] : Date.now() } },
        { currentMember : {[Op.not] : Deal.totalMember}},
      ]
     },
     order : [['dealDate', 'DESC']],
     limit: Number(req.query.limit),
     offset: Number(req.query.offset)
    });
  }
  return res.status(200).json({
    code: 200,
    result : {
      deals
    }
  });
})


// 거래 생성하기
router.post('/:userId', isNotLoggedIn, async (req, res, next) => {
  const { title, content, price, totalMember, dealDate, dealPlace, 
  currentMember} = req.body; // currentMember 수정 필요.
  try {
    console.log(req.title);
    const user = await User.findOne({where: { Id: req.params.userId }});
    if(!user){
      return res.status(404).json({
          code : 404,
          message : "해당되는 유저가 없습니다.",
          isSuccess : false,
      });
    }
    const group = await Group.create({
      amount: 1,
      userId : user.id,
    })
    const deal = await Deal.create({
      title : title,
      content : content,
      price : price,
      totalMember : totalMember,
      dealDate : new Date(dealDate), // 날짜 변환
      dealPlace : dealPlace,
      currentMember : 1,
      userId : user.id,
    })
    Group.update({ dealId : deal.id }, { where : { id : group.id } }); // 업데이트
    return res.status(200).json({
      code: 200,
      isSuccess : true,
      message: '거래가 생성되었습니다',
      result : {
        deal
      }
    });
  }catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

// 참여자 : 거래 참여하기
router.post('/:dealId/join/:userId', isNotLoggedIn, async (req, res, next) => {
  const { amount } = req.body;
  try {

    const user = await User.findOne({where: { Id: req.params.userId }});
    const deal = await Deal.findOne({where: { Id: req.params.dealId }});
    const isJoin = await Group.findOne({where : { userId : req.params.userId, dealId : req.params.dealId}});
    //console.log("원래 날짜 : " + deal.dealDate.getTime())
    // console.log("날짜 : " + expireDate);
    if(!user){
      return res.status(404).json({
          code : 404,
          message : "해당되는 유저가 없습니다.",
          isSuccess : false,
      });
    }
    if(!deal){
      return res.status(404).json({
        code : 404,
        message : "해당되는 거래가 없습니다.",
        isSuccess : false,
    });
    }
    if(isJoin){
      return res.status(500).json({
        code : 500,
        message : "이미 거래에 참여한 사람은 더 참여할 수 없습니다.", // 추가 수량 구매 가능하도록?
        isSuccess : false,
    });
    }
    const expireDate = deal.dealDate.setDate(deal.dealDate.getDate() - 3);
    if(expireDate < Date.now()){
      return res.status(500).json({
        code : 500,
        message : "거래 모임 모집 시간이 지났습니다.", // expireDate : 3일
        isSuccess : false,
    });
    }
    if(amount > deal.totalMember - deal.currentMember){
      return res.status(500).json({
        code : 500,
        message : "구매 가능한 수량을 입력해야 합니다.",
        isSuccess : false,
    });
    }
    const group = await Group.create({
      amount: amount,
      userId : req.params.userId,
      dealId : req.params.dealId,
    })
    deal.update({currentMember : deal.currentMember + amount});
    return res.status(200).json({
      code: 200,
      message : "거래 참여가 완료되었습니다.",
      isSuccess : true,
      result : {
        group
      }
    });
  }catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});


// 거래 찾기 /:userId/?isDealDone={}&isSuggester={}
router.get('/:userId', async (req, res, next) => {
  try {
    let deals; // 정의만 하려면 자료형이 let?
    if(req.query.isSuggester == 1){ // 제안자
      deals = await Deal.findAll({
        where: { userId: req.params.userId },
        include : {
         model : Group,
         attribute: ['userId']
        }
       });
    } else{ // isSuggester가 1일때 처럼 groups를 가져오는 방법
      const user = await User.findOne({
        where : {Id : req.params.userId}
      });
      const groups = await user.getGroups();
      deals = []
      for(let i = 0 ; i < groups.length ; i++){ 
        const deal = await Deal.findOne({ where : {Id : groups[i].dealId} });
        if(deal.userId != req.params.userId) deals.push(deal); // 참여자로써 참여한 것만
      }
    }

    for (let i = 0; i < deals.length; i++) { // 진행된 거래
      const cur = new Date(deals[i].dealDate);
      if (req.query.isDealDone == 1 && cur > Date.now()) { // 수정필요 -> 어짜피 나중에 deal 테이블에 isDealDone 수정하면 바로 가져올 수 있음.
        deals.splice(i, 1);
        i--;
      }
      else if (req.query.isDealDone == 0 && cur <= Date.now()) {
        deals.splice(i, 1);
        i--;
      }
    }

    if (deals.length == 0) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다',
      });
    }
    return res.json({
      code: 200,
      userIdx : req.params.userId,
      payload: deals,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});


module.exports = router;