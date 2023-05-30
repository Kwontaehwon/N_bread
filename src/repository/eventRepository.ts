import { logger } from '../config/winston';
import EventDto from '../dto/event/eventDto';
import { responseMessage, statusCode } from '../modules/constants';
import { errorGenerator } from '../modules/error/errorGenerator';
import prisma from '../prisma';

const getAllEvents = async () => {
  try {
    const data = await prisma.events.findMany({});
    return data;
  } catch (error) {
    logger.error(error);
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
    logger.error(error);
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
        eventStatus: +eventDto.eventStatus,
      },
    });
  } catch (error) {
    logger.error(error);
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.BAD_REQUEST,
    });
  }
};

const findEventById = async (eventId: number) => {
  try {
    const data = await prisma.events.findFirst({ where: { id: eventId } });
    return data;
  } catch (error) {
    logger.error(error);
    throw errorGenerator({
      code: statusCode.NOT_FOUND,
      message: responseMessage.NOT_FOUND,
    });
  }
};

const updateEventImage = async (eventId: number, eventImage: string) => {
  try {
    await prisma.events.update({
      where: { id: eventId },
      data: { eventImage },
    });
  } catch (error) {
    logger.error(error);
    throw errorGenerator({
      code: statusCode.BAD_REQUEST,
      message: responseMessage.BAD_REQUEST,
    });
  }
};

export {
  getAllEvents,
  getInProgressEvent,
  createEvent,
  findEventById,
  updateEventImage,
};
