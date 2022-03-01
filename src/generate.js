const fs = require('fs');

/**
 * @typedef {import('@slack/web-api/dist/response/ChannelsListResponse').Channel} Channel
 * @typedef {import('@slack/web-api/dist/response/UsersListResponse').Member} Member
 */

/** @type {{channels: Channel[], members: Member[]}} */
const { channels, members } = JSON.parse(fs.readFileSync('fetched.json'));
