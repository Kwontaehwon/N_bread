import fs from 'fs';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { userRepository } from '../repository';
import qs from 'qs';

const _getAppleClientSecret = async () => {
  const nowSec = await Math.round(new Date().getTime() / 1000);
  const expSec = (await nowSec) + 120000;
  const payload = {
    aud: 'https://appleid.apple.com',
    iss: '5659G44R65',
    iat: nowSec,
    exp: expSec,
    sub: 'shop.chocobread.service',
  };

  const signOptions: SignOptions = {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: '689F483NJ3',
      typ: 'JWT',
    },
  };

  const path = __dirname + '/../passport/AuthKey_689F483NJ3.p8';
  const privateKey = fs.readFileSync(path);
  const appleClientSecret = jwt.sign(payload, privateKey, signOptions);
  return appleClientSecret;
};

const _getQsData = async (userId: number) => {
  const appleClientSecret = await _getAppleClientSecret();
  const user = await userRepository.findUserById(userId);
  const data = {
    client_id: 'shop.chocobread.service',
    client_secret: appleClientSecret,
    token: user.refreshToken,
    token_type_hint: 'refresh_token',
  };
  const qsData = qs.stringify(data);
  return qsData;
};
export { _getQsData };
