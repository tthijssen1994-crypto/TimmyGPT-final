const axios = require("axios");

async function getBitcoinPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "bitcoin",
          vs_currencies: "eur"
        }
      }
    );

    return `De huidige Bitcoin prijs is €${res.data.bitcoin.eur}`;
  } catch (err) {
    return "Kon de Bitcoin prijs niet ophalen.";
  }
}

module.exports = { getBitcoinPrice };