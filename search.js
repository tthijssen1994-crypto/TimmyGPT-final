const axios = require("axios");

async function searchInternet(query) {
  try {
    const res = await axios.get("https://api.duckduckgo.com/", {
      params: {
        q: query,
        format: "json",
        no_html: 1
      }
    });

    if (res.data.Abstract) return res.data.Abstract;

    if (res.data.RelatedTopics.length > 0) {
      return res.data.RelatedTopics[0].Text;
    }

    return "Geen resultaten gevonden.";
  } catch (err) {
    return "Zoeken mislukt.";
  }
}

module.exports = { searchInternet };