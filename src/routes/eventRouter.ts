const express = require('express');
const { logger } = require('../config/winston');
const Event = require('../database/models/event');
const { Op, Sequelize } = require('sequelize');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { default: axios } = require('axios');
const { url } = require('inspector');
const config = require('../config');
const eventRouter = express.Router();
const { util } = require('../modules/');
const { eventImageUpload } = require('../middlewares/upload');

eventRouter.get('/', async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        eventStatus: { [Op.gt]: 0 },
      },
      order: [['eventStatus', 'ASC']],
    });
    if (events == null) {
      logger.info(`Events를 찾을 수 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `Events를 찾을 수 없습니다.`,
        true,
        events,
      );
    }
    return util.jsonResponse(res, 200, 'Event를 반환합니다.', true, events);
  } catch (error) {
    logger.error(`${error}  [전체 Event] GET /events`);
    util.jsonResponse(res, 500, '[전체 Event] GET /events', false);
  }
});

eventRouter.get('/popup/:recentId', async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: {
        eventStatus: 0,
      },
    });
    if (event == null) {
      logger.info(`PopUp Event를 찾을 수 없습니다.`);
      return util.jsonResponse(
        res,
        404,
        `PopUp Event를 찾을 수 없습니다.`,
        true,
        event,
      );
    }
    if (req.params.recentId == event.id) {
      return util.jsonResponse(
        res,
        300,
        `PopUp 다시보지 않기를 선택한 회원입니다.`,
        true,
        null,
      );
    }
    return util.jsonResponse(
      res,
      200,
      'PopUp Event를 반환합니다.',
      true,
      event,
    );
  } catch (error) {
    logger.error(`${error}  [Event Popup] GET /events/popup`);
    util.jsonResponse(res, 500, '[Event Popup] GET /events/popup', false);
  }
});

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
    );
  } catch (error) {
    logger.error(`${error}  [Event Create] POST /events/create`);
    util.jsonResponse(res, 500, '[Event Create] POST /events/create', false);
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
      );
    } catch (error) {
      logger.error(`${error}  [Event Img Create] POST /events/img/:eventId`);
      util.jsonResponse(
        res,
        500,
        '[Event Img Create] POST /events/img/:eventId',
        false,
      );
    }
  },
);

export { eventRouter };
