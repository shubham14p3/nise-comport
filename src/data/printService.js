export const printPricing = {
  currency: "INR",
  blackAndWhite: [
    { min: 1, max: 10, pricePerPage: 5 },
    { min: 11, max: 50, pricePerPage: 3 },
    { min: 51, max: Infinity, pricePerPage: 2 },
  ],
  colourPricePerPage: 10,
  cashbackPercent: 5,
};

export const calculatePrintPrice = ({ blackAndWhitePages = 0, colourPages = 0 }) => {
  const tier = printPricing.blackAndWhite.find(
    ({ min, max }) => blackAndWhitePages >= min && blackAndWhitePages <= max
  );
  const bwRate = tier?.pricePerPage ?? 0;
  const subtotal = blackAndWhitePages * bwRate + colourPages * printPricing.colourPricePerPage;
  return {
    bwRate,
    subtotal,
    cashback: Math.round((subtotal * printPricing.cashbackPercent) / 100),
  };
};
