<script lang="ts">
  import { AppPath } from "$lib/constants/routes.constants";
  import type { SnsSummary, SnsSwapCommitment } from "$lib/types/sns";
  import { i18n } from "$lib/stores/i18n";
  import { routeStore } from "$lib/stores/route.store";
  import type { SnsFullProject } from "$lib/stores/projects.store";
  import { Card } from "@dfinity/gix-components";
  import Logo from "$lib/components/ui/Logo.svelte";
  import { Spinner } from "@dfinity/gix-components";
  import ProjectCardSwapInfo from "./ProjectCardSwapInfo.svelte";
  import { getCommitmentE8s } from "$lib/utils/sns.utils";

  export let project: SnsFullProject;

  let summary: SnsSummary;
  let swapCommitment: SnsSwapCommitment | undefined;
  $: ({ summary, swapCommitment } = project);

  let logo: string;
  let name: string;
  let description: string;
  $: ({
    metadata: { logo, name, description },
  } = summary);

  let title: string;
  $: title = `${$i18n.sns_project.project} ${name}`;

  let commitmentE8s: bigint | undefined;
  $: commitmentE8s = getCommitmentE8s(swapCommitment);

  const showProject = () => {
    routeStore.navigate({
      path: `${AppPath.ProjectDetail}/${project.rootCanisterId.toText()}`,
    });
  };
</script>

<Card
  role="link"
  on:click={showProject}
  highlighted={commitmentE8s !== undefined}
>
  <div class="title" slot="start">
    <Logo src={logo} alt={$i18n.sns_launchpad.project_logo} />
    <h3>{title}</h3>
  </div>

  <p class="value description">{description}</p>

  <ProjectCardSwapInfo {project} />

  <!-- TODO L2-751: handle fetching errors -->
  {#if swapCommitment === undefined}
    <div class="spinner">
      <Spinner size="small" inline />
    </div>
  {/if}
</Card>

<style lang="scss">
  @use "@dfinity/gix-components/styles/mixins/text";

  .title {
    display: flex;
    gap: var(--padding-1_5x);
    align-items: flex-start;
    margin-bottom: var(--padding);

    h3 {
      margin: 0;
      line-height: var(--line-height-standard);
      @include text.clamp(2);
    }
  }

  p {
    margin: 0 0 var(--padding-1_5x);
  }

  .spinner {
    margin-top: var(--padding-1_5x);
  }

  .description {
    @include text.clamp(6);
  }
</style>
