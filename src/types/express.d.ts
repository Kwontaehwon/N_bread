interface jwtPayLoad {
  id: Number;
  nick: String;
  provider: String;
  iat: Number;
  iss: String;
}

declare namespace Express {
  interface Request {
    decoded?: jwtPayLoad;
  }
}
