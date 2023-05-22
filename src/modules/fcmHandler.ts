import axios from 'axios';
import admin from 'firebase-admin';

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

const createNotifiation = async (title: string, body: string) => {
  return {
    title: title,
    body: body,
  };
};

// const createData = async (type : string, )

export { subscribe, sendToSub, createNotifiation };
