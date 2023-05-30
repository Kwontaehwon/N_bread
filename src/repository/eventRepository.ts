import { responseMessage, statusCode } from '../modules/constants';
import { errorGenerator } from '../modules/error/errorGenerator';
import prisma from '../prisma';

const getAllEvents = async () => {
  try {
    const data = await prisma.events.findMany({});
    return data;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.BAD_REQUEST,
    });
  }
};

const getInProgressEvent = async () => {
  try {
    const data = await prisma.events.findFirst({ where: { eventStatus: 0 } });
    return data;
  } catch (error) {
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.BAD_REQUEST,
    });
  }
};

export { getAllEvents, getInProgressEvent };
