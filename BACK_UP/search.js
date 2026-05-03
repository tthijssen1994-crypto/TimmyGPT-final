const axios = require("axios");

module.exports = {
match: (msg) =>
msg.includes("zoek") ||
msg.includes("wat is") ||
msg.includes("wie is"),

run: async (msg) => {
try {
const res = await axios.get("https://api.duckduckgo.com/", {
params: {
q: msg,
format: "json",
no_html: 1
}
});

```
  return res.data.Abstract || "Geen info gevonden.";
} catch {
  return "❌ Zoek fout.";
}
```

}
};
