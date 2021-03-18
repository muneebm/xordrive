<template>
  <q-layout view="lHh Lpr fFf">
    <q-toolbar>
      <q-btn
        @click.native="closePublicLink"
        class="q-pa-none"
        flat
        round
        color="secondary" >
        <q-avatar rounded size="28px">
          <img src="statics/auth_logo.jpeg" class="fit no-shadow" />
        </q-avatar>
      </q-btn>
      <q-toolbar-title>
        xordrive
      </q-toolbar-title>
      <q-btn
        @click.native="closePublicLink"
        class="q-pa-none"
        size="md"
        flat
        round
        icon="close"
        color="secondary" />
    </q-toolbar>
    <q-footer :class="{ 'bg-white': !$q.dark.isActive,'text-primary': !$q.dark.isActive, 'q-pb-sm': true }">
        <q-linear-progress v-if="statusDisplay.progress !== 1" :value="statusDisplay.progress" color="secondary" />
    </q-footer>
    <q-page-container>
      <q-page padding v-if="file">
        <div class="row justify-center absolute-center">
          <q-card class="public-link-card shadow-4">
            <q-card-section align="center">
              <q-avatar size="200px" text-color="secondary" :icon="getIcon(file.icon, file.type)" />
              <div class="text-h6 ellipsis">{{file.label}}</div>
              <div class="text-subtitle2">{{file.sizeText}}</div>
              <q-tooltip anchor="top middle" self="center middle">
                {{file.label}}
              </q-tooltip>
            </q-card-section>
            <q-separator />
            <q-card-actions align="right">
              <q-btn
                v-if="username && !statusDisplay.display && isPreviewSupported(file.type)"
                color="secondary"
                flat
                round
                icon="fas fa-eye"
                @click.native="openPreview = true" >
                <q-tooltip>
                  Preview
                </q-tooltip>
              </q-btn>
              <q-btn
                v-if="username && !statusDisplay.display"
                color="secondary"
                flat
                round
                icon="fas fa-download"
                @click.native="downloadFile(file)" >
                <q-tooltip>
                  Download
                </q-tooltip>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
        <div v-if="statusDisplay.display" class="absolute-center">
          <q-spinner size="25px" color="secondary" />{{statusDisplay.message}}
        </div>
        <preview :open="openPreview" :item="file" v-on:close="openPreview = false" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import Preview from '../components/Preview'
const DEFAULT_CORE_NODE = 'https://core.blockstack.org'
const NAME_LOOKUP_PATH = '/v1/names'
export default {
  name: 'Public',
  components: {
    Preview
  },
  data () {
    return {
      loading: false,
      openPreview: false,
      file: null,
      username: null,
      title: ''
    }
  },
  async created () {
    try {
      if (this.publicFilePath) {
        this.file = null
        let splits = this.publicFilePath.split('_')
        if (splits.length !== 2 || (!splits[0] || !splits[1])) {
          this.$q.notify({ message: 'Incorrect URL', color: 'negative' })
          this.closePublicLink()
        } else {
          this.loading = true
          const fileDataString = await this.session.getFile(
            `${splits[1]}_public`,
            { decrypt: false,
              username: splits[0],
              zoneFileLookupURL: `${DEFAULT_CORE_NODE}${NAME_LOOKUP_PATH}` })
          if (fileDataString && fileDataString.length > 0) {
            let fileData = JSON.parse(fileDataString)
            fileData.owner = splits[0]
            this.file = fileData
            this.username = splits[0]
            this.title = this.file.label
            window.document.title = this.file.label
          }
          this.loading = false
        }
      } else {
        this.closePublicLink()
      }
    } catch (error) {
      console.log(error)
      this.$q.notify({ message: 'Failed to open file', color: 'negative' })
      this.closePublicLink()
    }
  },
  computed: {
    ...mapState('blockstack', ['session', 'publicFilePath', 'statusDisplay'])
  },
  meta () {
    return {
      title: this.title
    }
  },
  methods: {
    ...mapActions('blockstack', ['downloadFile']),
    closePublicLink () {
      this.loading = false
      this.openPreview = false
      this.file = null
      this.username = null
      window.location.href = window.location.origin
    }
  }
}
</script>
<style>
.public-link-card {
  width: 80%;
  height: 100%;
  max-width: 80vw;
  min-width: 300px;
}
</style>
