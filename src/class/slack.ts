const _ = require('lodash');
const axios = require('axios');
import config from '../config';
// import axios from 'axios';
// import * as _ from 'lodash';
class Slack {
  // 색상으로 메시지를 꾸밀수 있습니다.
  static get Colors() {
    return {
      primary: '#007bff',
      info: '#17a2b8',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
    };
  }

  // 메시지를 전송할 webhook 주소
  static get Channels() {
    return {
      general:
        'https://hooks.slack.com/services/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',
    };
  }
  static async sendMessage(message) {
    if (!message) {
      console.error('메시지 포멧이 없습니다.');
      return;
    }

    const data = {
      mrkdwn: true,
      text: '',
      attachments: [],
    };

    if (_.isString(message)) {
      data.text = message;
    } else {
      if (!message.title && !message.text) {
        console.error('메시지 내용이 없습니다.');
        return;
      }

      message.ts = Math.floor(Date.now() / 1000);
      message.footer = `From 알림 서버 [${config.env}]`;
      data.attachments.push(message);
    }

    axios({
      url: this.Channels.general,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data,
    });
  }
}

export { Slack };
