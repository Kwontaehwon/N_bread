const { User, Group, Deal, DealImage } = require('../models');
const { Op } = require('sequelize');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const logger = require('../config/winston');
const sequelize = require('../models');
const requestIp = require('request-ip');


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
        const user = await User.findOne({where : { Id : req.params.userId}});
        if(!user){
            return jsonResponse(res, 404, "userId에 해당되는 유저가 없습니다.", false, null)
        }
        const result = {
            createdAt : user.createdAt,
            nick : user.nick,
            provider : user.provider,
            addr : user.curLocation3,
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
            { model: User, attributes: ['nick', 'curLocation3'] },
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

// POST users/location/:userId
const postNaverGeoLocation = async(req,res)=>{
  try{
    const user = await User.findOne({ where: { id: req.params.userId } });
    const prom = new Promise((resolve,reject)=>{
        axios.get('https://api.ip.pe.kr/').then((Response)=>{
          logger.info(Response.data);
          console.log(Response.data);
            resolve(makeSignature(Response.data));
        }).catch((err)=>{
            console.log(err)
        })
    }).catch((error)=>{
        console.log(error);
    })

    let tmp = await makeSignature((req.headers['X-FORWARDED-FOR'] || req.connection.remoteAddress).replace(/^.*:/, ''));
    //console.log("url is : "+tmp.url);
    axios.get(tmp.url,{headers:{
        "x-ncp-apigw-signature-v2":tmp.signature,
        "x-ncp-iam-access-key":tmp.accessKey,
        "x-ncp-apigw-timestamp":tmp.timestamp,

    }}).then(async (Response) => {
        const data=Response.data;
        console.log(Response.data)
        console.log(data.geoLocation.r2);
        user.update({ curLocation1: data.geoLocation.r1, curLocation2: data.geoLocation.r2, curLocation3: data.geoLocation.r3})
        jsonResponse(res, 200, "현재 위치 저장이 완료되었습니다.", true, {
            'location': data.geoLocation.r1 + " " + data.geoLocation.r2 + " " + data.geoLocation.r3});
    }).catch((err) => {
        console.log("err : "+err)
        logger.error(error);
        return jsonResponse(res, 500, "서버 에러", false, result)
    })
 
    function makeSignature(ipAddr) {
        var space = " ";				// one space
        var newLine = "\n";				// new line
        var method = "GET";				// method
        var url = "/geolocation/v2/geoLocation?ip="+ipAddr+"&ext=t&responseFormatType=json";	// url (include query string)
        var timestamp = Date.now().toString();			// current timestamp (epoch)
        var accessKey = process.env.NAVER_ACCESSKEY;			// access key id (from portal or Sub Account)
        var secretKey = process.env.NAVER_SECRETKEY;			// secret key (from portal or Sub Account)

        var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
        hmac.update(method);
        hmac.update(space);
        hmac.update(url);
        hmac.update(newLine);
        hmac.update(timestamp);
        hmac.update(newLine);
        hmac.update(accessKey);

        var hash = hmac.finalize();

        let result = hash.toString(CryptoJS.enc.Base64);
        return { "signature": result, "timestamp": timestamp, "url":"https://geolocation.apigw.ntruss.com"+url,"accessKey":accessKey};
    }
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

exports.getUser = getUser;
exports.getMypageDeals = getMypageDeals;
exports.postNaverGeoLocation = postNaverGeoLocation;
exports.getUserLocation = getUserLocation;
exports.putUserNick = putUserNick;
exports.checkUserNick = checkUserNick;
