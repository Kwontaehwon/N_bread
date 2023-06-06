export default {
  NOT_FOUND: '잘못된 경로입니다.',
  BAD_REQUEST: '잘못된 요청입니다.',
  UNAUTHORIZED: '인증이 필요한 서비스입니다.',
  FORBIDDEN: '권한이 없습니다.',
  INTERNAL_SERVER_ERROR: '서버에 에러가 발생했습니다.',
  SERVICE_NOT_AVAILABLE: '서버를 사용할 수 없습니다.',
  ERROR_VALIDATOR_ERROR: '에서 Validation 오류가 발생하였습니다.',

  SUCCESS: '성공적으로 반환 하였습니다.',
  VALID_NICKNAME: '사용할 수 있는 닉네임입니다.',

  USER_NOT_FOUND: '해당되는 유저가 없습니다.',
  NICKNAME_DUPLICATED: '중복된 닉네임입니다.',
  EMAIL_DUPLICATED: '중복된 이메일입니다.',
  NICKNAME_CHANGE_FAIL: '닉네임 변경 중 오류가 발생하였습니다.',
  LOGIN_FAILED: '로그인에 실패하였습니다.',
  CREATE_USER_FAILED: '유저 생성에 실패하였습니다.',
  SAVE_USER_LOCATION_FAILED: '유저 위치 저장에 실패하였습니다.',
  CANNOT_REPORT_MYSELF: '자기 자신을 신고할 수 없습니다.',
  SAVE_USER_REPORT_INFO_FAILED: '유저 신고 정보 저장에 실패하였습니다.',
  DONT_SHOW_POPUP: 'PopUp 다시보지 않기를 선택한 회원입니다.',
  IMAGE_NOT_EXIST: '이미지가 존재하지 않습니다.',

  // deal
  DEAL_NOT_FOUND: '해당되는 거래가 없습니다.',
  DEAL_DELETE_NOT_AUTHORIZED: '글을 삭제할 권한이 없습니다.',
  DEAL_ALREADY_PARTICIPATED:
    '참여자가 있으므로 거래를 삭제/수정할 수 없습니다.',

  DEAL_ALREADY_JOINED: '이미 참여한 거래이므로 다시 참여할 수 없습니다.',
  DEAL_DATE_EXPIRED: '거래 모집 기간이 지났으므로 참여할 수 없습니다.',
  DEAL_REQUEST_OUT_OF_STOCK: '구매 가능 한 수량 내의 수를 입력해야 합니다.',

  DEAL_UPDATE_NOT_AUTHORIZED: '글 작성자만 업데이트 할 수 있습니다.',

  DEAL_REPORT_NOT_AUTHORIZED: '자신이 작성한 글을 신고 할 수 없습니다.',
  DEAL_DATE_VALIDATION_ERROR: '거래 날짜에는 과거 날짜를 기입할 수 없습니다.',

  GET_LOCATION_SUCCESS: '지역 정보 조회에 성공하였습니다.',
  NAVER_UNAUTHORIZED: 'Naver ClientKey, Naver ClientSecretKey가 필요합니다.',
  NAVER_INVALID_COORDINATE: '좌표가 유효하지 않습니다.',

  TOKEN_EXPIRED: '만료된 토큰입니다.',
  TOKEN_INVALID: '잘못된 토큰입니다.',

  // Comment
  COMMENT_NOT_FOUND: '해당 Comment가 존재하지 않습니다.',
  COMMENT_DELETE_NOT_AUTH: '글의 작성자만 댓글을 삭제 할 수 있습니다.',
};
