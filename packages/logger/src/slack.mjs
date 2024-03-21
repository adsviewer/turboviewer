import build from 'pino-abstract-transport';
import { IncomingWebhook } from '@slack/webhook';

/**
 *
 * @param {SlackTransportOptions} options
 */
const slack = async options => build(async (source) => {
  for await (const {msg} of source) {
    const webhook = new IncomingWebhook(options.webhookUrl);
    webhook && webhook.send({text: `\`\`\`${msg}\`\`\``}).catch(() => {
    });
  }
});

// eslint-disable-next-line import/no-default-export -- Once we use it, we can play around and see if we can remove it
export default slack
