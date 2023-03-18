const express = require('express');
const url = require('url');
const slackRouter = express.Router();
const { Slack } = require('../class/slack');
const { util } = require('../modules/');

slackRouter.post('/send', async (req, res, next) => {
  const { title, text } = req.body;
  try {
    Slack.sendMessage({
      color: Slack.Colors.success,
      title: title,
      text: text,
    });
    util.jsonResponse(res, 200, '슬랙에 메시지 전송을 완료하였습니다.', true);
  } catch (error) {
    //logger.error(`${error}  [Event Create] POST /events/create`);
    console.log(error);
    util.jsonResponse(res, 500, error, false);
  }
});

export { slackRouter };
