const { s3 } = require('../config/s3Config');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { DealImage } = require('../database/models');
const dealImageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'nbreadimg',
    key: async (req, file, cb) => {
      const dealImages = await DealImage.findAll({
        where: { dealId: req.params.dealId },
      });
      console.log(dealImages);
      if (dealImages.length > 0) {
        for (let dealImage of dealImages) {
          await dealImage.destroy(); // 그냥 삭제하는 것이 맞는가? 거래 수정됬을 때 어떻게 수정하면 좋을까?
        }
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
