import { dealImageRepository } from '../repository';

const _createDealImage = async (req, dealId: number) => {
  const result = [];
  for (let i of req.files) {
    const originalUrl = i.location;
    result.push(originalUrl);
  }
  if (result.length > 0) {
    for (let url of result) {
      const tmpImage = await dealImageRepository.createDealImage(url, dealId);
    }
  }
  return result;
};

export { _createDealImage };
