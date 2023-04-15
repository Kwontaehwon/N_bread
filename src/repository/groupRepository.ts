import {Group} from "../database/models"
import { errorGenerator } from "../modules/error/errorGenerator"
import { responseMessage, statusCode } from "../modules/constants"

const createGroup = async (amount : number , userId: number) => {
    return await Group.create({
        amount: amount,
        userId: userId
    });
}

export {
    createGroup
}