import AWS from 'aws-sdk';
import config from '../config';
AWS.config.update({
  region: 'ap-northeast-2',
  accessKeyId: config.s3AccessKeyID,
  secretAccessKey: config.s3SecretAccessKey,
});

const s3 = new AWS.S3();

export { s3 };
