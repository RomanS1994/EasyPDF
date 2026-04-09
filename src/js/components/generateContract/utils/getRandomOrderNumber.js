export const getRandomOrderNumber = () => {
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  //Генеруємо випадкове ціле число з провідними нулями
  const paddedNumber = Math.floor(Math.random() * 100000000000)
    .toString()
    .padStart(13, '0');

  const orderNumber = `ORD-${paddedNumber}-${suffix}`;
  return orderNumber;
};
