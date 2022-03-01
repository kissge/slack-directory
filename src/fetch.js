const fs = require('fs');
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  console.info('Fetching channels...');
  const { channels } = await app.client.conversations.list({ limit: 1000 });

  console.info('Fetching users...');
  const { members } = await app.client.users.list({ limit: 1000 });

  console.info('Writing to file...');
  fs.writeFileSync('fetched.json', JSON.stringify({ channels, members }, null, 2));
})();
