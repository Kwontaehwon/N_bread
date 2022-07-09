const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User, Group, Deal } = require('../models');

const router = express.Router();


router.get('', async (req, res, next) => {
  const deals = await Deal.findAll( {order : [['dealDate', 'DESC']] });
  console.log(deals);
  return res.status(200).json({
    code: 200,
    result : {
      deals
    }
  });
})


// 거래 생성하기
router.post('/create', isNotLoggedIn, async (req, res, next) => {
  const { title, content, price, totalMember, dealDate, dealPlace, 
  currentMember} = req.body;
  try {
    console.log(req.title);
    const user = await User.findOne({where: { Id: 1 }}); // 임의의 유저
    const group = await Group.create({
      amount: 1,
      userId : user.id,
    })
    //await group.addUser(user);
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
    console.log("group Deal : " + group.dealId);
    console.log("Deal id : " + deal.id);
    return res.redirect('/');
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

    for(let i = 0 ; i < deals.length ; i++){ // 진행된 거래
      const cur = new Date(deals[i].dealDate);
      if (req.query.isDealDone == 1 && cur > Date.now()) { // 수정필요 -> 어짜피 나중에 deal 테이블에 isDealDone 수정하면 바로 가져올 수 있음.
        deals.splice(i, 1);
        i--; 
      }
      else if(req.query.isDealDone == 0 && cur <= Date.now()){
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