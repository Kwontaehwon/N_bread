jest.mock('../models/user')
const { getUser } = require('../controllers/user');
const User = require('../models/user');

function jsonResponse(res, code, message, isSuccess, result){
    res.status(code).json({
      code : code,
      message : message,
      isSuccess : isSuccess,
      result : result
    })
}

describe('getUser', () => {
    const req = {
        params : {userId : 1}
    };
    const res = {
        status : jest.fn(() => res),
        json : jest.fn(),
    }
    const next = jest.fn();

    test('유저를 찾아 반환', async () => {
        const queryResult = {
            createdAt : "2022-07-30 22:00",
            nick : "Test Nick",
            provider : "local",
            curLocation3 : "역삼동"
        };
        const expectedResult = {
            createdAt : "2022-07-30 22:00",
            nick : "Test Nick",
            provider : "local",
            addr : "역삼동"
        };
        User.findOne.mockReturnValue(
            Promise.resolve(queryResult)
        );
        await getUser(req, res, next);
        expect(res.status).toBeCalledWith(200);
        expect(res.json).toBeCalledWith({code : 200, message : "userId의 정보를 반환합니다.", isSuccess : true, result : expectedResult});
    })

    test('해당되는 유저 없음 (null)', async () => {
        User.findOne.mockReturnValue(null);
        await getUser(req, res, next);
        expect(res.status).toBeCalledWith(404);
    })
});
