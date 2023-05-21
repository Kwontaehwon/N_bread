const objectListToValueList = (objectList: Object[]) => {
  const valueList = objectList.map((element) => {
    return Object.values(element)[0];
  });
  return valueList;
};

export { objectListToValueList };
