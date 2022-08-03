const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const path=require('path');

require('dotenv').config();

const { verifyToken } = require('./middlewares');
const { json } = require('body-parser');
const { any, reject } = require('bluebird');
const { response } = require('express');
const { resolve } = require('path');
const sequelize = require('../models');
const { getUser, getMypageDeals, postNaverGeoLocation, getUserLocation, putUserNick } = require('../controllers/user');


const router = express.Router();

router.use(express.json());


// 마이페이지 거래 내역:수정중
router.get('/deals/:userId',verifyToken, getMypageDeals);

// 유저 현재 위치 등록 (naver GeoLocation) -> verifyToken?
router.post('/location/:userId', postNaverGeoLocation);

// 유저 DB에서 저장된 위치 GET -> verifyToken 삭제?
router.get('/location', verifyToken, getUserLocation);

// 유저 정보 GET
router.get('/:userId', getUser);

// 유저 닉네임 변경
router.put('/:userId', putUserNick);


// router.delete('/:userId', async (req, res, next) => {
//     try{
//         const user = await User.findOne({where : { Id : req.params.userId}});
//         if(!user){
//             return jsonResponse(res, 404, "해당되는 유저를 찾을 수 없습니다.", false, null)
//         }
//         await user.destroy();
//         return jsonResponse(res, 500, "회원 탈퇴가 완료되었습니다.", true, null)
//     }  catch(error){ 
//         console.log(error);
//         return jsonResponse(res, 500, "서버 에러", false, null)
//     }
// });


// router.get('/:userId/deals', async (req, res, next) => {
//     try {
//       const user = User.findOne({where : {id : req.params.userId}});
//       if(!user){
//         return jsonResponse(res, 404, "해당되는 유저가 없습니다.", false, null);
//       }
//       let deals; // 정의만 하려면 자료형이 let?
//       if(req.query.isSuggester == 1){ // 제안자
//         deals = await Deal.findAll({
//           where: { userId: req.params.userId },
//           include : {
//            model : Group,
//            attribute: ['userId']
//           }
//          });
//       } else{ // isSuggester가 1일때 처럼 groups를 가져오는 방법
//         const user = await User.findOne({
//           where : {Id : req.params.userId}
//         });
//         const groups = await user.getGroups();
//         deals = []
//         for(let i = 0 ; i < groups.length ; i++){ 
//           const deal = await Deal.findOne({ where : {Id : groups[i].dealId} });
//           if(deal.userId != req.params.userId) deals.push(deal); // 참여자로써 참여한 것만
//         }
//       }
//       for (let i = 0; i < deals.length; i++) { // 진행된 거래
//         const cur = new Date(deals[i].dealDate);
//         if (req.query.isDealDone == 1 && cur > Date.now()) { // 수정필요 -> 어짜피 나중에 deal 테이블에 isDealDone 수정하면 바로 가져올 수 있음.
//           deals.splice(i, 1);
//           i--;
//         }
//         else if (req.query.isDealDone == 0 && cur <= Date.now()) {
//           deals.splice(i, 1);
//           i--;
//         }
//       }
  
//       if (deals.length == 0) {
//         return jsonResponse(res, 404, "검색 결과가 없습니다.", false, null)
//       }
//       return jsonResponse(res, 200, user.id + "user의 거래 내역", true, {userId : user.id , deals : deals});    
//     } catch (error) {
//       console.error(error);
//       return jsonResponse(res, 500, "서버 에러", false, null)
//     }
//   });

module.exports = router;