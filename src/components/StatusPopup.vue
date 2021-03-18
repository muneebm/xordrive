<template>
  <q-page-sticky expand position="bottom" v-if="statusDisplay.display"  :offset="[0, 0]"
  :class="{ 'bg-white': !$q.dark.isActive, 'bg-dark': $q.dark.isActive }" >
    <q-toolbar class="full-width justify-between q-pa-xs q-mt-xs no-wrap">
      <q-btn size="sm" flat round v-if="statusDisplay.type === 3" color="negative" icon="error_outline" @click.native="close" />
      <q-btn size="sm" flat round v-if="statusDisplay.type === 2" color="positive" icon="check" @click.native="close" />
      <q-circular-progress
        v-if="statusDisplay.type === 1"
        show-value
        font-size="6px"
        :value="statusDisplay.progress * 100"
        size="30px"
        :thickness="0.1"
        color="teal"
        track-color="grey-3"
      >
        {{ (statusDisplay.progress * 100).toFixed(2) }}%
      </q-circular-progress>
      <q-toolbar-title class="text-overline text-weight-light">
        <div class="text-white ellipsis text-caption">
          {{ statusDisplay.message }}
        </div>
        <q-linear-progress :value="statusDisplay.progress" color="secondary"/>
      </q-toolbar-title>
      <q-btn
        size="sm"
        flat
        round
        icon="close"
        class="text-weight-bolder"
        color="secondary"
        @click.native="close" />
      </q-toolbar>
  </q-page-sticky>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
export default {
  name: 'StatusPopup',
  computed: {
    ...mapState('blockstack', ['statusDisplay'])
  },
  methods: {
    ...mapMutations('blockstack', ['updateStatusDisplay']),
    close () {
      this.updateStatusDisplay({ display: false })
    }
  }
}
</script>
