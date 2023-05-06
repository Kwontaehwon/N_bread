import { Request, Response } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { success } from '../modules/util';
const logout = async (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      req.session.destroy(() => res.redirect('/'));
    } else {
      success(res, statusCode.OK, responseMessage.SUCCESS);
    }
  });
};

export { logout };
