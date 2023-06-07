import axios from 'axios';
import admin from 'firebase-admin';
import {
  Notification,
  DataMessagePayload,
  TopicMessage,
} from 'firebase-admin/lib/messaging/messaging-api';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
import config from '../config';

const dealSubscribe = async (userId: number, dealId: number) => {
  const fcmTokenJson = await axios.get(`${config.fcmApiUrl}/tokens/${userId}`);
  if (Object.keys(fcmTokenJson.data).length !== 0) {
    const fcmToken = fcmTokenJson.data.Item.fcmToken;
    const fcmTopicName = `dealFcmTopic` + dealId;
    await admin.messaging().subscribeToTopic(fcmToken, fcmTopicName);
  }
};

const sendToSub = async (
  topic: string,
  notification: Notification,
  data: DataMessagePayload,
) => {
  const topicMessage: TopicMessage = {
    topic: topic,
    notification: notification,
    data: data,
  };
  await admin.messaging().send(topicMessage);
};

const sendMulticast = async (
  fcmTokenList: string[],
  notification: Notification,
  data: DataMessagePayload,
) => {
  if (fcmTokenList.length > 0) {
    const multicastMessage: MulticastMessage = {
      tokens: fcmTokenList,
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

const getAndStoreTokenInList = async (fcmTokenList, userId: number) => {
  const fcmTokenJson = await axios.get(`${config.fcmApiUrl}/tokens/${userId}`);
  if (Object.keys(fcmTokenJson.data).length !== 0) {
    const fcmToken = fcmTokenJson.data.Item.fcmToken;
    fcmTokenList.push(fcmToken);
  }
};

export {
  dealSubscribe,
  sendToSub,
  createNotifiation,
  sendMulticast,
  getAndStoreTokenInList,
};
