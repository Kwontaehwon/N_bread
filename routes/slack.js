const express = require('express');
const url = require('url');
const router = express.Router();
const {Slack} = require('../class/slack');

function jsonResponse(res, code, message, isSuccess, result) {
    res.status(code).json({
        code: code,
        message: message,
        isSuccess: isSuccess,
        result: result
    })
}



router.get('/getmsg', async (req, res, next) => {
    try {
        Slack.sendMessage(
            {
                color: Slack.Colors.success,
                title: '테스트 메시지 전송 success'
            }
        );
        jsonResponse(res, 200, "슬랙에 메시지 보내기 성공", true);
        
    }
    catch (error) {
        //logger.error(`${error}  [Event Create] POST /events/create`);
        console.log(error);
        jsonResponse(res, 500, error, false);
    }
});

module.exports = router;