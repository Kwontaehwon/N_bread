import EventDto from '../dto/event/eventDto';
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

const createEvent = async (eventDto: EventDto) => {
  try {
    await prisma.events.create({
      data: {
        title: eventDto.title,
        type: eventDto.type,
        target: eventDto.target,
        eventStatus: eventDto.eventStatus,
      },
    });
  } catch (error) {
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.BAD_REQUEST,
    });
  }
};

export { getAllEvents, getInProgressEvent, createEvent };
