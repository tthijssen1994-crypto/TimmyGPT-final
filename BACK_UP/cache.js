const cache = new Map();

function setCache(key, value, ttl = 120000) {
cache.set(key, value);

setTimeout(() => {
cache.delete(key);
}, ttl);
}

function getCache(key) {
return cache.get(key);
}

module.exports = { setCache, getCache };
