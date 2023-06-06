export default {
  OK: 200, //요청이 성공했음
  CREATED: 201, //요청이 성공했고 생성 작업이 완료되었음
  REDIRECT: 300,
  BAD_REQUEST: 400, //보낸 요청을 서버가 이해할 수 없음(문법 에러 등)
  UNAUTHORIZED: 401, //인증이 필요한 서비스(로그인)
  FORBIDDEN: 403, //권한 없음, 401과 다르게 서버는 클라이언트가 누구인지 알고 있음
  NOT_FOUND: 404, //요청받은 리소스를 찾을 수 없음. 리소스를 숨기기 위해 사용하기도 함
  INTERNAL_SERVER_ERROR: 500, //서버가 처리 방법을 알 수 없음
  SERVICE_NOT_AVAILABLE: 503, //서버를 사용할 수 없음
};
