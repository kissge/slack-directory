<script lang="ts">
  import type { APIResponse } from './index';

  // Data from API endpoint
  export let channelGroups: APIResponse['channelGroups'];
  export let generatedAt: APIResponse['generatedAt'];
</script>

<svelte:head>
  <title>公開チャンネルの一覧</title>
</svelte:head>

<main>
  {#each channelGroups as { id, channels }}
    <section class="channel-group">
      <h1>#{id}</h1>
      <ol>
        {#each channels as channel}
          <li>
            <span class="channel-name">
              <a href={'https://app.slack.com/archives/' + channel.id} target="_blank">#{channel.name}</a>
            </span>
            <span class="channel-topic">{@html channel.topic?.value}</span><br />
            <span class="channel-purpose">{@html channel.purpose?.value}</span>
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

footer
  text-align: center
  font-size: 0.8em
  color: #999
</style>
