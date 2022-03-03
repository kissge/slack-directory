import * as fs from 'fs';
import type { RequestHandler } from '@sveltejs/kit';
import type { JSONObject } from '@sveltejs/kit/types/internal';
import type { Channel } from '@slack/web-api/dist/response/ConversationsListResponse';
import type { Member } from '@slack/web-api/dist/response/UsersListResponse';

/**
 * TypeScriptがおかしいので意味不明なGenericを使わないといけない
 */
function hasName<T, U>(x: { name?: U }): x is T & { name: U } {
  return 'name' in x && !!x.name;
}

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

interface ChannelGroup {
  id: string;
  channels: (Channel & {
    name: string;
  })[];
}
export interface APIResponse extends JSONObject {
  // @ts-expect-error SvelteKitのJSONValueの型定義がいまいち
  channelGroups: ChannelGroup[];
  generatedAt: string;
}

// @ts-expect-error これは流石にSvelteKitのbugだと思う
export const get: RequestHandler<unknown, APIResponse> = () => {
  const { channels }: { channels: Channel[]; members: Member[] } = JSON.parse(
    fs.readFileSync('./fetched.json', 'utf-8'),
  );

  const channelGroups = channels
    .reduce<{ id: string; channels: (Channel & { name: string })[] }[]>((groups, channel) => {
      if (channel.is_archived || !hasName<Channel, string>(channel)) {
        return groups;
      }

      if (channel.topic) {
        channel.topic.value = processHyperlink(channel.topic.value);
      }

      const id = channel.name.includes('-') ? channel.name.split('-')[0] : その他;

      const group = groups.find((group) => group.id === id);

      if (group) {
        group.channels.push(channel);
      } else {
        groups.push({ id, channels: [channel] });
      }

      return groups;
    }, [])
    .map((group) => {
      group.channels.sort((a, b) => a.name.localeCompare(b.name));
      return group;
    })
    .sort((a, b) => (a.id === その他 ? 1 : b.id === その他 ? -1 : a.id.localeCompare(b.id)));

  return {
    body: { channelGroups, generatedAt: new Date().toISOString() },
  };
};
