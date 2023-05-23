class TopicMessage implements Message {
  notification: FcmNotification;
  data: FcmData;
  topic: string;

  constructor(notification: FcmNotification, data: FcmData, topic: string) {
    this.notification = notification;
    this.data = data;
    this.topic = topic;
  }
}
