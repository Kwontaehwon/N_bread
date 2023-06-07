import { s3 } from '../config/s3Config';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { dealImageRepository } from '../repository';
const dealImageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'nbreadimg',
    key: async (req, file, cb) => {
      const dealImages = await dealImageRepository.findManyDealImageById(
        +req.params.dealId,
      );

      if (dealImages.length > 0) {
        await dealImageRepository.deleteDealImageById(req.params.dealId);
      }
      cb(null, `original/${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 이미지 최대 size 5MB
});

const eventImageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'nbreadimg',
    key: async (req, file, cb) => {
      cb(null, `events/${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 이미지 최대 size 5MB
});

export { dealImageUpload, eventImageUpload };
