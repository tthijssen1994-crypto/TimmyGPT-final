const axios = require("axios");

module.exports = {
match: (msg) => msg.includes("bitcoin") || msg.includes("btc"),

run: async () => {
try {
const res = await axios.get("https://api.coindesk.com/v1/bpi/currentprice.json");
const price = res.data.bpi.USD.rate;

```
  return `💰 Bitcoin prijs: $${price}`;
} catch {
  return "❌ Crypto fout.";
}
```

}
};
