const { User, Group, Deal, DealImage, UserReport } = require('../models');
const { Op } = require('sequelize');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const logger = require('../config/winston');
const sequelize = require('../models');
const requestIp = require('request-ip');
const { env } = require('process');
const { RDS } = require('aws-sdk');


function jsonResponse(res, code, message, isSuccess, result){
    res.status(code).json({
      code : code,
      message : message,
      isSuccess : isSuccess,
      result : result
    })
}

// GET users/:userId
const getUser = async (req, res, next) => {
    try{
        const user = await User.findOne({where : { Id : req.params.userId},paranoid:false});
        if(!user){
            return jsonResponse(res, 404, "userId에 해당되는 유저가 없습니다.", false, null)
        }
        const result = {
            createdAt : user.createdAt,
            nick : user.nick,
            provider : user.provider,
            addr : user.curLocation3,
            deletedAt:user.deletedAt
        }
        logger.info(`GET users/:userId | userId : ${req.params.userId} 의 유저 정보를 반환합니다.`);
        return jsonResponse(res, 200, "userId의 정보를 반환합니다.", true, result)
    } catch (error){
        logger.error(error);
        return jsonResponse(res, 500, "서버 에러", false, result)
    }
}


// GET users/deals/:userId
const getMypageDeals = async (req, res, next) => {
    try{
        const user = await User.findOne({ where: { id: req.decoded.id } }); 
      const refDeal = await Group.findAll({ where: { userId: req.decoded.id}});
        console.log("refDeal : "+refDeal);
        if(refDeal.length===0){
          console.log("refDeal is null")
          logger.info(`users/deals/:userId | userId : ${req.decoded.id}의 마이페이지에 [] 을 반환합니다.`);
          return jsonResponse(res, 200, "전체 글 리스트", true, []);
        } else{
          const [tmpres, metadata] = await sequelize.sequelize.query(
            `select id from deals where id in (select dealId from nBread.groups where userId = ?) or deals.userId = ?`,
            {
              replacements: [user.id, user.id],
              type: Op.SELECT
            }
          );
      
          var suggesterId = [];
          var memberId = [];
      
          const suggesterDeal = await Deal.findAll({
            where: { userId: user.id },
          })
          for (i = 0; i < suggesterDeal.length; i++) {
            suggesterId.push(suggesterDeal[i]['id']);
          }
          console.log('suggesterId : ', suggesterId);
      
          for (i = 0; i < tmpres.length; i++) {
            memberId.push(tmpres[i]['id']);
          }
          console.log(memberId);
          const deal = await Deal.findAll({
            where: { id: memberId },
            include: [{
              model: DealImage,
              attributes: ['dealImage', 'id']
            },
            { model: User, attributes: ['nick', 'curLocation3'],paranoid:false },
            ]
          })
      
          //mystatus처리
          for (i = 0; i < deal.length; i++) {
            var toSetStatus = deal[i];
            toSetStatus['mystatus'] = "user";
            if ((toSetStatus['dealDate'] - (3 * 1000 * 3600 * 24)) < Date.now()) {
              if (toSetStatus['currentMember'] === toSetStatus['totalMember']) toSetStatus['status'] = "모집완료"
              else toSetStatus['status'] = "모집실패"
            } else if (toSetStatus['dealDate'] < Date.now()) {
              toSetStatus['status'] = "거래완료";
            }
            else if (toSetStatus['currentMember'] === toSetStatus['totalMember']) {
              toSetStatus['status'] = "모집완료";
            } else toSetStatus['status'] = "모집중"
            

            if (suggesterId.includes(deal[i]['id'])) {
              deal[i]['mystatus'] = "제안자"
            }
            else {
              deal[i]['mystatus'] = "참여자"
            }
          }
          logger.info(`users/deals/:userId | userId : ${req.params.userId}의 마이페이지에 글을 반환합니다.`);
          return jsonResponse(res, 200, "전체 글 리스트", true, deal);
      
        }
    } catch(error){
        logger.error(error);
        return jsonResponse(res, 500, "서버 에러", false, result)
    }
}

// GET users/location/:userId/:latitude/:longitude
const getNaverGeoLocation = async(req,res)=>{
  try{
    const longitude=req.params.longitude;
    const latitude=req.params.latitude;
    const user = await User.findOne({ where: { id: req.params.userId } });
    if(!user){
      return jsonResponse(res, 404, "userId에 해당되는 유저가 없습니다.", false, null);
    }
  
    const url =`https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${longitude},${latitude}&sourcecrs=epsg:4326&orders=admcode&output=json`
   
    axios.get(url,{headers:{
        "X-NCP-APIGW-API-KEY-ID":env.NAVER_CLIENTKEY,
        "X-NCP-APIGW-API-KEY":env.NAVER_CLIENTSECRETKEY,
    }}).then(async (Response) => {
      if(Response.data['status']['code']===200){
        jsonResponse(res,401,"Naver ClientKey, Naver ClientSecretKey가 필요합니다.",false,null);
      } else if (Response.data['status']['code'] === 100){
        jsonResponse(res,400,"좌표가 유효하지 않습니다. 올바른 좌표를 넣어주세요.",false,null)
      }else{
        const tmpdata=Response.data;
        const data = tmpdata['results'][0]['region'];
        console.log(['area1']['name']);
        //console.log(data.geoLocation.r2);
        user.update({ curLocation1: data['area1']['name'], curLocation2: data['area2']['name'], curLocation3: data['area3']['name'] })
        jsonResponse(res, 200, `현재 위치 저장이 완료되었습니다. 현재 위치는 ${data['area1']['name']} ${data['area2']['name']} ${data['area3']['name']}입니다. `, true, { 'location1': data['area1']['name'], 'location2': data['area2']['name'], 'location3': data['area3']['name'] }
        );}
      
    }).catch((err) => {
        console.log("err : "+err)
        logger.error(err);
        return jsonResponse(res, 500, "서버 에러", false, err)
    })
 
 
    //makeSignature();
  } catch(error){
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, result)
  }
}

// GET users/location 
const getUserLocation = async(req, res) => {
  try{
    const headerIp = await (req.headers['X-FORWARDED-FOR'] || req.connection.remoteAddress).replace(/^.*:/, '');
    const requestIps= await requestIp.getClientIp(req);
    console.log(headerIp);
    console.log(req.headers['X-FORWARDED-FOR'] || req.connection.remoteAddress);
    const loggedInUser = await User.findOne({ where: { Id: req.decoded.id } });
    const result = {userId : loggedInUser.id, location:loggedInUser.curLocation3};
    logger.info(`users/location | userId : ${req.decoded.id}의 현재 지역 : ${result.location} 을 반환합니다.`)
    jsonResponse(res, 200, `현재 위치 : ${result.location} 을(를) DB에서 가져오는데 성공하였습니다`,true,result)
  } catch(error){
    logger.error(error);
    return jsonResponse(res, 500, "서버 에러", false, result)
  }
}

// PUT users/:userId
const putUserNick = async (req, res, next) => {
    try{
        const {nick} = req.body;
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            logger.info(`userId : ${req.params.userId}에 해당되는 유저가 없습니다.`);
            return jsonResponse(res, 404, `userId : ${req.params.userId}에 해당되는 유저가 없습니다.`, false, null);
        }
        const isDuplicated = await User.findOne({ where : {nick : nick}});
        if(isDuplicated){
            logger.info(`중복된 닉네임 (${nick})으로는 변경할 수 없습니다.`);
            return jsonResponse(res, 409, `중복된 닉네임 (${nick})으로는 변경할 수 없습니다.`, false, null);
        }
        else{
            await user.update({
                nick : nick
            });
            const result = {
                userId : user.id,
                nick : user.nick,
            };
            logger.info(`PUT users/:userId | userId : ${result.userId} 님이 새로운 닉네임 ${result.nick} 으로 변경되었습니다.`)
            return jsonResponse(res, 200, `닉네임 변경 완료`, true, result);
        }
        
    } catch(error){ 
        console.log(error);
        logger.error(error);
        return jsonResponse(res, 500, `서버 에러`, false, result)
    }
}

const checkUserNick = async (req, res, next) => {
  try {
    const nick = req.params.nick;
    const user = await User.findOne({ where: { Id: req.params.userId } });
    if (!user) {
      logger.info(`userId : ${req.params.userId}에 해당되는 유저가 없습니다.`);
      return jsonResponse(res, 404, `userId : ${req.params.userId}에 해당되는 유저가 없습니다.`, false, null);
    }
    const isDuplicated = await User.findOne({ where: { nick: nick } });
    if (isDuplicated) {
      logger.info(`중복된 닉네임 (${nick})이 이미 존재합니다.`);
      return jsonResponse(res, 409, `중복된 닉네임 (${nick})이 이미 존재합니다.`, false, null);
    }else{
      return jsonResponse(res, 200, `(${nick})은 사용가능한 닉네임입니다.`,true, null);
    }

  } catch (error) {
    console.log(error);
    logger.error(error);
    return jsonResponse(res, 500, `서버 에러`, false, result)
  }
}

const postReportUser = async (req, res, next) => {
  try{
    const {title, content} = req.body;
    if(title === undefined || content === undefined){
      logger.info(`Body에 빠진 정보가 있습니다.`);
      return jsonResponse(res, 400, `req.body에 빠진 정보가 있습니다`, false, null);
    }
    if(req.params.userId == ":userId"){
      return jsonResponse(res, 404, `parameter :userId가 필요합니다.`, false, null);
    }
    const reporter = await User.findOne({where: { Id: req.decoded.id }});
    const reportedUser = await User.findOne({where: { Id: req.params.userId }});

    if(!reporter){
      logger.info(`userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`);
      return jsonResponse(res, 404, `userId : ${req.decoded.id}에 매칭되는 유저가 없습니다.`, false, null);
    }
    if(!reportedUser){
      logger.info(`userId : ${req.params.userId} 에 해당되는 유저가 없어 신고할 수 없습니다.`);
      return jsonResponse(res, 404, `userId : ${req.params.userId} 에 유저가 없어 신고할 수 없습니다.`, false, null);
    }
    if(reporter.id === reportedUser.id){
      logger.info(`userId : ${req.decoded.id} 자기 자신을 신고 할 수 없습니다.`);
      return jsonResponse(res, 403, `userId : ${req.decoded.id} 자기 자신을 신고 할 수 없습니다.`, false, null);
    }
    const userReport = await UserReport.create({
      title : title,
      content : content,
      reportedUserId : req.params.userId,
      reporterId : req.decoded.id
    })
    logger.info(`${req.params.userId} 님이 userId : ${req.params.userId}을 신고 하였습니다.`);
    return jsonResponse(res, 200, `${req.params.userId} 님이 userId : ${req.params.userId}을 신고 하였습니다.`, true, userReport);
  }catch(error){
    console.error(error);
    return jsonResponse(res, 500, "서버 에러", false, null)
  }
}

exports.getUser = getUser;
exports.getMypageDeals = getMypageDeals;
exports.getNaverGeoLocation = getNaverGeoLocation;
exports.getUserLocation = getUserLocation;
exports.putUserNick = putUserNick;
exports.checkUserNick = checkUserNick;
exports.postReportUser = postReportUser;