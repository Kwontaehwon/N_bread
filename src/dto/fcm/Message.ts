interface Message {
  notification: {
    title: string;
    body: string;
  };
  data: FcmData;
}

interface FcmData {
  type: string;
  [key: string]: string;
}
