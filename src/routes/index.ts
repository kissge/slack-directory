import { webcrypto } from 'crypto';
import * as _Slack from '@slack/bolt';
import type { RequestHandler } from '@sveltejs/kit';
import type { JSONObject } from '@sveltejs/kit/types/internal';

// 何でこんなことしないといけないのか全くわからない
const crypto = webcrypto as unknown as Crypto;
const Slack = (_Slack as unknown as { default: typeof _Slack }).default;

function processHyperlink(text: string | undefined): string {
  if (!text) {
    return '';
  }

  return text.replace(/<(.+?)>/g, (_, link: string) => {
    if (link.startsWith('#')) {
      const [, id, name] = link.match(/^#(.+)\|(.+)/)!;
      return `<a href="https://app.slack.com/archives/${id}" target="_blank">#${name}</a>`;
    }

    return `<a href="${link}" target="_blank">${link
      .replace(/^https?:\/\/(?:www\.)?/, '')
      .replace(/(?<=.{30}).+/, '...')}</a>`;
  });
}

const その他 = 'その他';

interface ChannelSummary {
  id: string;
  name: string;
  topic: string;
  purpose: string;
}

export interface ChannelGroup {
  id: string;
  channels: ChannelSummary[];
}
export interface APIResponse extends JSONObject {
  iv: number[];
  channelGroupsEncrypted: string;
  domain: string;
  generatedAt: string;
}

export const get: RequestHandler<unknown, APIResponse> = async () => {
  const app = new Slack.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });
  const { channels } = await app.client.conversations.list({ limit: 1000 });
  const { team } = await app.client.team.info();
  const domain = team!.domain!;

  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'jwk',
    {
      alg: 'A256CBC',
      ext: true,
      k: process.env.KEY,
      key_ops: ['encrypt', 'decrypt'],
      kty: 'oct',
    },
    'AES-CBC',
    true,
    ['encrypt', 'decrypt'],
  );

  const channelGroups = (channels || []).reduce<ChannelGroup[]>(
    (groups, channel) => {
      if (!channel.id || !channel.name || channel.is_archived) {
        return groups;
      }

      const summary = {
        id: channel.id,
        name: channel.name,
        topic: processHyperlink(channel.topic?.value),
        purpose: processHyperlink(channel.purpose?.value),
      };

      const id = channel.name.includes('-') ? channel.name.split('-')[0] : その他;
      const group = groups.find((group) => group.id === id);

      if (group) {
        group.channels.push(summary);
      } else {
        groups.push({ id, channels: [summary] });
      }

      return groups;
    },
    [{ id: その他, channels: [] }],
  );

  channelGroups.slice(1).forEach((group) => {
    if (group.channels.length > 1) {
      group.channels.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      channelGroups[0].channels.push(...group.channels);
    }
  });

  channelGroups.reduceRight((_, group, i) => {
    if (group.channels.length < 2) {
      channelGroups.splice(i, 1);
    }
  }, <void>(<unknown>null));

  channelGroups.sort((a, b) => (a.id === その他 ? 1 : b.id === その他 ? -1 : a.id.localeCompare(b.id)));

  const channelGroupsEncrypted = Buffer.from(
    await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(JSON.stringify(channelGroups))),
  ).toString('base64');

  return {
    body: {
      iv: Array.from(iv),
      channelGroupsEncrypted,
      domain,
      generatedAt: new Date().toISOString(),
    },
  };
};
