class MultiCastMessage implements Message {
  notification: FcmNotification;
  data: FcmData;
  tokens: string[];

  constructor(notification: FcmNotification, data: FcmData, tokens: string[]) {
    this.notification = notification;
    this.data = data;
    this.tokens = tokens;
  }
}
