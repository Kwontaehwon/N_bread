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
    const eventDto: EventDto = req.body;
    await eventRepository.createEvent(eventDto);
    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    logger.error(`${error}  [Event Create] POST /events/create`);
    next(error);
  }
};

const uploadEventImage = async (req, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const { location } = file;
    const { eventId } = req.params;

    /**이미지 존재여부 검증 */
    if (file === null)
      return fail(res, statusCode.BAD_REQUEST, responseMessage.IMAGE_NOT_EXIST);

    /**이벤트 존재여부 검증 */
    const event = await eventRepository.findEventById(+eventId);
    if (!event) {
      logger.info(
        `POST events/img/:eventId 의 eventId : ${eventId} 에 해당하는 event를 찾을 수 없습니다.`,
      );
      return fail(res, statusCode.NOT_FOUND, responseMessage.NOT_FOUND);
    }

    /**이미지 업로드 */
    const updatedEvent = await eventRepository.updateEventImage(
      +eventId,
      location,
    );
    logger.info(`Event id : ${eventId} 에 이미지가 Update 되었습니다.`);

    return success(res, statusCode.OK, responseMessage.SUCCESS);
  } catch (error) {
    logger.error(`${error}  [Event Img Create] POST /events/img/:eventId`);
    next(error);
  }
};

export { getEvent, getPopup, makeEvent, uploadEventImage };
