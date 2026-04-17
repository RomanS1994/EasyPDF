// =====================================
// Генерація випадкової дати
// =====================================
export const getRandomDate = () => {
  const randomDays = Math.floor(Math.random() * 3) + 1; // випадкове число від 1 до 3 (включно)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() - randomDays);
  // Формат для input[type="date"] → YYYY-MM-DD
  const yyyy = futureDate.getFullYear();
  const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
  const dd = String(futureDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
