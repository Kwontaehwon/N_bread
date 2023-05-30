const express = require('express');
import { logger } from '../config/winston';
import { Event } from '../database/models/event';
import { util } from '../modules/';
import { eventImageUpload } from '../middlewares/upload';
import { eventService } from '../service';
import { param } from 'express-validator';
import { errorValidator } from '../modules/error/errorValidator';

const eventRouter = express.Router();
/**모든 이벤트 GET */
eventRouter.get('/', eventService.getEvent);

/**진행중인 이벤트 GET */
eventRouter.get(
  '/popup/:recentId',
  [param('recentId').isNumeric(), param('recentId').notEmpty()],
  errorValidator,
  eventService.getPopup,
);

eventRouter.post('/create', async (req, res, next) => {
  try {
    const { title, type, target, eventStatus } = req.body;
    const event = await Event.create({
      title: title,
      type: type,
      target: target,
      eventStatus: eventStatus,
    });
    // const url = 'https://www.chocobread.shop/events/img/' + event.id;
    return util.jsonResponse(
      res,
      200,
      `Event id : ${event.id} 가 생성되었습니다.`,
      true,
      {},
    );
  } catch (error) {
    logger.error(`${error}  [Event Create] POST /events/create`);
    util.jsonResponse(
      res,
      500,
      '[Event Create] POST /events/create',
      false,
      {},
    );
  }
});

eventRouter.post(
  '/img/:eventId',
  eventImageUpload.single('img'),
  async (req, res, next) => {
    try {
      const file = req.file;
      const orignalUrl = file.location;
      const eventId = req.params.eventId;
      console.log(file);
      console.log(`location : ${orignalUrl}`);
      const event = await Event.findOne({ where: { id: eventId } });
      if (event == null) {
        logger.info(
          `POST events/img/:eventId 의 eventId : ${eventId} 에 해당하는 event를 찾을 수 없습니다.`,
        );
        return util.jsonResponse(
          res,
          404,
          `POST events/img/:eventId 의 eventId : ${eventId} 에 해당하는 event를 찾을 수 없습니다.`,
          false,
          {},
        );
      }
      if (file != null) {
        console.log('NOT NULL');
        const updatedEvent = await event.update({
          eventImage: orignalUrl,
        });
        logger.info(`Event id : ${eventId} 에 이미지가 Update 되었습니다.`);
      }
      return util.jsonResponse(
        res,
        200,
        `Event id : ${eventId} 에 이미지가 Update 되었습니다.`,
        true,
        {},
      );
    } catch (error) {
      logger.error(`${error}  [Event Img Create] POST /events/img/:eventId`);
      util.jsonResponse(
        res,
        500,
        '[Event Img Create] POST /events/img/:eventId',
        false,
        {},
      );
    }
  },
);

export { eventRouter };
