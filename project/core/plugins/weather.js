const axios = require("axios");

module.exports = {
match: (msg) => msg.includes("weer"),

run: async (msg) => {
try {
const city = msg.split("weer in")[1]?.trim() || "Amsterdam";

```
  const res = await axios.get(
    `https://wttr.in/${city}?format=3`
  );

  return `🌦️ ${res.data}`;
} catch {
  return "❌ Weer ophalen mislukt.";
}
```

}
};
