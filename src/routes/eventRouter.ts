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

/**이벤트 생성 POST */
eventRouter.post('/create', eventService.makeEvent);

/**이벤트 이미지 업로드 POST */
eventRouter.post(
  '/img/:eventId',
  [param('eventId').notEmpty()],
  errorValidator,
  eventImageUpload.single('img'),
  eventService.uploadEventImage,
);

export { eventRouter };
