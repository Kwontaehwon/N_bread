const passport = require('passport');
const AppleStrategy = require('@nicokaiser/passport-apple').Strategy;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');

module.exports = () => {
  passport.use(
    'apple',
    new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          key : fs.readFileSync(path.join(__dirname, 'AuthKey_689F483NJ3.p8')),
          callbackURL: "https://chocobread.shop/auth/apple/callback",
          scope: ['name', 'email'],
          passReqToCallback : true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try{
              const {
                id,
                email
            } = profile;
            // Create or update the local user here.
            // Note: name and email are only submitted on the first login!
            const exUser = await User.findOne({
              where: { snsId: id, provider: 'apple' }, 
            });
            const exEmail = await User.findOne({
              where: { email: email },
            })

            if (exUser) {
              exUser.update({refreshToken : refreshToken});
              done(null, exUser);
            }
            else {
              const newUser = await User.create({
                email: email,
                snsId: id,
                nick : "tempNickName-Apple",
                provider: 'apple',
                refreshToken : refreshToken
              });
              done(null, newUser);
            }
          }
          catch (error){
            console.error(error);
            done(error);
          }
        }
    )
);
}

