import { S3Client } from '@aws-sdk/client-s3';
import config from '../config';
const awsConfiguration = {
  region: 'ap-northeast-2',
  accessKeyId: config.s3AccessKeyID,
  secretAccessKey: config.s3SecretAccessKey,
};

const s3 = new S3Client(awsConfiguration);

export { s3 };
