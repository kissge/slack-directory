<script lang="ts">
  import { onMount } from 'svelte';

  import type { APIResponse, ChannelGroup } from './index';

  // Data from API endpoint
  export let iv: APIResponse['iv'];
  export let channelGroupsEncrypted: APIResponse['channelGroupsEncrypted'];
  export let domain: APIResponse['domain'];
  export let generatedAt: APIResponse['generatedAt'];

  function base64ToArrayBuffer(base64: string) {
    const binary_string = atob(base64);
    const len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  let channelGroups: ChannelGroup[] = [];
  let error: string | null = null;

  onMount(async () => {
    if (!crypto.subtle) {
      error = 'Cryptography API not supported';
      return;
    }

    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        {
          alg: 'A256CBC',
          ext: true,
          k: prompt('Input password', '') || '',
          key_ops: ['encrypt', 'decrypt'],
          kty: 'oct',
        },
        'AES-CBC',
        true,
        ['encrypt', 'decrypt'],
      );
      channelGroups = JSON.parse(
        new TextDecoder().decode(
          await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: new Uint8Array(iv).buffer },
            key,
            base64ToArrayBuffer(channelGroupsEncrypted),
          ),
        ),
      );
    } catch (e) {
      error = 'Wrong password';
      console.error(e);
    }
  });
</script>

<svelte:head>
  <title>公開チャンネルの一覧</title>
</svelte:head>

{#if error}
  <section class="error">
    <div>
      {error}
    </div>
  </section>
{/if}

<main>
  {#each channelGroups as { id, channels }}
    <section class="channel-group">
      <h1>#{id}</h1>
      <ol>
        {#each channels as channel}
          <li>
            <span class="channel-name">
              <a href={'https://' + domain + '.slack.com/archives/' + channel.id} target="_blank">#{channel.name}</a>
            </span>
            <span class="channel-topic">{@html channel.topic}</span><br />
            {#if channel.topic !== channel.purpose}
              <span class="channel-purpose">{@html channel.purpose}</span>
            {/if}
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</main>

<footer>
  {new Date(generatedAt).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'long' })}
</footer>

<style lang="sass">
:global(html)
  font-family: 'Noto Sans JP', sans-serif

.error
  text-align: center
  padding: 3em

  div
    display: inline-block
    background: #f45
    box-shadow: 0 0 10px #ccc
    padding: 1em 5em
    color: white

.channel-group
  max-width: 800px
  margin: auto

  ol
    box-shadow: 0 0 10px #ccc
    border-radius: 10px
    padding: 1em
    margin-left: 3em

    li
      display: block
      margin: 0 0 1em 0
      padding-bottom: 1em
      border-bottom: 1px solid #ccc

      &:last-child
        margin-bottom: 0
        padding-bottom: 0
        border-bottom: none

      .channel-name
        font-size: 1.2em
        font-weight: bold

        a
          text-decoration: none

      .channel-purpose
        color: #999

        :global(a)
          color: inherit

footer
  text-align: center
  font-size: 0.8em
  color: #999
</style>
