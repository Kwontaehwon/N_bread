import { Request, Response } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { success } from '../modules/util';
const logout = async (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      success(res, statusCode.OK, responseMessage.SUCCESS, {
        session: req.session,
      });
    });
  });
};

export { logout };
