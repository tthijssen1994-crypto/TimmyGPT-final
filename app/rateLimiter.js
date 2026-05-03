const users = new Map();

function rateLimit(user) {
const now = Date.now();

if (!users.has(user)) {
users.set(user, []);
}

const timestamps = users.get(user).filter(t => now - t < 10000);

if (timestamps.length >= 5) {
return false;
}

timestamps.push(now);
users.set(user, timestamps);

return true;
}

module.exports = { rateLimit };
