const _getTotalPrice = (totalPrice: number, title: string) => {
  var total = title.match(/\총\d?\d?\d?\d/);
  if (total) {
    let totalCount: any = total[0].replace('총', '');
    totalCount *= 1;
    return totalPrice / totalCount;
  }
  return null;
};
const _getPartialPrice = (particlePrice: number, title: string) => {
  var partial = title.match(/\d?\d?\d\개씩/);
  if (partial) {
    let partialCount: any = partial[0].replace('개씩', '');
    partialCount *= 1;
    return particlePrice / partialCount;
  }
  return null;
};
const _getOnePlusPrice = (totalPrice: number, title: string) => {
  var onePlus = title.includes('1+1');
  if (onePlus) {
    let numToDivide = 2;
    return totalPrice / numToDivide;
  }
  return null;
};

const _getTwoPlusPrice = (totalPrice: number, title: string) => {
  var twoPlus = title.includes('2+1') || title.includes('1+2');
  if (twoPlus) {
    let numToDivide = 3;
    return totalPrice / numToDivide;
  }
  return null;
};

const _getGramPrice = (title: string) => {
  var unitG = title.match(/\d?\d?\d?\d\K?\k?\g/);
  if (unitG) {
    return ' ' + unitG[0];
  }
  return null;
};

const _getUnitPrice = (
  totalPrice: number,
  particlePrice: number,
  title: string,
) => {
  return (
    _getTotalPrice(totalPrice, title) ??
    _getPartialPrice(particlePrice, title) ??
    _getOnePlusPrice(totalPrice, title) ??
    _getTwoPlusPrice(totalPrice, title) ??
    particlePrice
  );
};

export { _getUnitPrice, _getGramPrice };
