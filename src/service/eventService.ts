import { Request, Response, NextFunction } from 'express';
import { eventRepository } from '../repository';
import { logger } from '../config/winston';
import { fail, success } from '../modules/util';
import { responseMessage, statusCode } from '../modules/constants';
import EventDto from '../dto/event/eventDto';

const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventRepository.getAllEvents();

    if (!events) {
      logger.info(`Events를 찾을 수 없습니다.`);
      return fail(res, statusCode.NOT_FOUND, responseMessage.NOT_FOUND);
    }
    return success(res, statusCode.OK, responseMessage.SUCCESS, events);
  } catch (error) {
    next(error);
  }
};

const getPopup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recentId } = req.params;
    const event = await eventRepository.getInProgressEvent();
    if (!event) {
      logger.info(`Events를 찾을 수 없습니다.`);
      return fail(res, statusCode.NOT_FOUND, responseMessage.NOT_FOUND);
    }
    if (+recentId == event.id) {
      return success(
        res,
        statusCode.FORBIDDEN,
        responseMessage.DONT_SHOW_POPUP,
      );
    }
    return success(res, statusCode.OK, responseMessage.SUCCESS, event);
  } catch (error) {
    next(error);
  }
};

const makeEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, type, target, eventStatus } = req.body;
    const eventDto: EventDto = {
      title,
      type,
      target,
      eventStatus,
    };
    await eventRepository.createEvent(eventDto);
    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    logger.error(`${error}  [Event Create] POST /events/create`);
    next(error);
  }
};

export { getEvent, getPopup, makeEvent };
