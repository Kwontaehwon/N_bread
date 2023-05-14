import passport from 'passport';
import passport_local from 'passport-local';
import bcrypt from 'bcrypt';
import { userRepository } from '../../repository';
const LocalStrategy = passport_local.Strategy;

const passportLocal = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, next) => {
        try {
          const isUserExist = await userRepository.findUserByEmail(email);
          if (!isUserExist)
            return next(null, false, { message: '가입되지 않은 회원입니다.' });
          const result = await bcrypt.compare(password, isUserExist.password);
          if (!result)
            return next(null, false, {
              message: '비밀번호가 일치하지 않습니다.',
            });
          return next(null, isUserExist);
        } catch (error) {
          console.error(error);
          next(error);
        }
      },
    ),
  );
};
export { passportLocal };
