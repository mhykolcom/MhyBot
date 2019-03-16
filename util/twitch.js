const twitchApi = require('twitch-api-v5');
const { twitchtoken } = require('../config/config.json');

twitchApi.clientID = twitchtoken;

module.exports = twitchApi;