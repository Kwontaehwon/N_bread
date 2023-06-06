import axios from 'axios';
import admin from 'firebase-admin';
import {
  Notification,
  DataMessagePayload,
} from 'firebase-admin/lib/messaging/messaging-api';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { logger } from '../config/winston';

const dealSubscribe = async (userId: number, dealId: number) => {
  const fcmTokenJson = await axios.get(
    `https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${userId}`,
  );
  if (Object.keys(fcmTokenJson.data).length !== 0) {
    const fcmToken = fcmTokenJson.data.Item.fcmToken;
    const fcmTopicName = `dealFcmTopic` + dealId;
    await admin.messaging().subscribeToTopic(fcmToken, fcmTopicName);
  }
};

const sendToSub = async (topicMessage: TopicMessage) => {
  await admin.messaging().send(topicMessage);
};

const sendMulticast = async (
  userId: number,
  notification: Notification,
  data: DataMessagePayload,
) => {
  logger.info(`거래 제안자 id : ${userId} 에게 새로운 댓글 알림을 보냅니다. `);
  const fcmTokenJson = await axios.get(
    `https://d3wcvzzxce.execute-api.ap-northeast-2.amazonaws.com/tokens/${userId}`,
  );
  if (Object.keys(fcmTokenJson.data).length !== 0) {
    const fcmToken = fcmTokenJson.data.Item.fcmToken;
    const multicastMessage: MulticastMessage = {
      tokens: [fcmToken],
      notification: notification,
      data: data,
    };
    await admin.messaging().sendMulticast(multicastMessage);
  }
};

const createNotifiation = async (title: string, body: string) => {
  return {
    title: title,
    body: body,
  };
};

// const createData = async (type : string, )

export { dealSubscribe, sendToSub, createNotifiation, sendMulticast };
