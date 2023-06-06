import jwt from 'jsonwebtoken';
import config from '../config';
import { responseMessage } from './constants';

const sign = (userId: number, provider: string) => {
  const payload = {
    id: userId,
    provider,
  };
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    algorithm: 'HS256',
    issuer: 'chocoBread',
    expiresIn: '1h',
  });
  return accessToken;
};

const createRefresh = () => {
  const refreshToken = jwt.sign({}, config.jwtSecret, { expiresIn: '14d' });
  return refreshToken;
};

const verify = (token: string) => {
  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error: any) {
    if (error.message === 'jwt expired') {
      return responseMessage.TOKEN_EXPIRED;
    } else {
      return responseMessage.TOKEN_INVALID;
    }
  }

  return decoded;
};

export { sign, createRefresh, verify };
