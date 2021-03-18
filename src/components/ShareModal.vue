<template>
  <q-dialog v-model="open" seamless position="bottom" full-width>
    <div :class="{ 'bg-white': !$q.dark.isActive, 'bg-dark': $q.dark.isActive }" >
      <q-linear-progress size="xs" :value="statusDisplay.progress" color="secondary" />
      <q-toolbar slot="header" inverted >
        <q-toolbar-title>
          <div class="text-overline ellipsis">
            {{ file ? file.label : '' }}
          </div>
        </q-toolbar-title>
        <q-btn
          :disable="!!statusMessage"
          @click.native="$emit('update:show', false)"
          class="q-pa-none"
          size="sm"
          flat
          round
          icon="close"
          color="secondary"
          v-close-popup />
        <q-btn
          @click.native="minimized = !(minimized)"
          class="q-pa-none"
          size="sm"
          flat
          round
          :icon="minimized ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          color="secondary" />
      </q-toolbar>
      <div class="layout-padding" v-if="!(minimized)" >
        <div class="q-ma-sm" v-if="isPublic || (!isPublic && !isPrivate)">
          <q-toggle
            :disable="!!statusMessage"
            color="negative"
            v-model="isPublic"
            label="Share publicly"
            @input="togglePublicShare"/>
          <div v-if="isPublic" >
            <div class="text-negative q-mt-lg text-justify" >
              Any one with the link below can access the publicly shared file.
            </div>
            <div class="row justify-start no-wrap full-width" v-if="publicLink">
              <q-input style="width:100%" outlined autogrow v-model="publicLink" readonly />
              <q-btn flat text-color="secondary" round icon="file_copy" @click.native="copyLink(publicLink)"  class="q-ma-sm"/>
            </div>
          </div>
        </div>
        <div class="q-ma-sm" v-if="isPrivate || (!isPublic && !isPrivate)">
          <q-toggle
            :disable="!!statusMessage"
            color="secondary"
            v-model="isPrivate"
            label="Share with other users"
            @input="togglePrivateShare" />
          <div v-if="isPrivate" class="q-ml-sm q-mr-sm">
            <q-select
              label="Search for users"
              class="text-weight-light q-mt-lg"
              color="secondary"
              outlined
              clearable
              v-model="searchText"
              use-input
              hide-selected
              hide-dropdown-icon
              input-debounce="0"
              :options="userSearchResults"
              options-sanitize
              @filter="searchUser"
              @input="sharedWithUser">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  v-on="scope.itemEvents">
                  <q-item-section avatar>
                    <q-img :src="scope.opt.profilePic" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label overline>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.sublabel }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <div class="text-weight-light q-mt-lg row justify-start">
              <q-chip
                :disable="!!statusMessage"
                removable
                class="q-mr-xs q-mt-xs"
                v-for="user in sharedUsers"
                :key="user"
                @remove="removeShare(user)">
                {{user}}
              </q-chip>
            </div>
            <div class="row justify-start no-wrap full-width" v-if="sharedUsers.length > 0 && privateLink">
              <q-input style="width:100%" outlined autogrow v-model="privateLink" readonly />
              <q-btn flat text-color="secondary" round icon="file_copy" @click.native="copyLink(privateLink)"  class="q-ma-sm"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex'
import { copyToClipboard } from 'quasar'
const DEFAULT_CORE_NODE = 'https://core.blockstack.org'
const NAME_LOOKUP_PATH = '/v1/names'
export default {
  name: 'ShareModal',
  props: {
    show: {
      type: Boolean
    },
    item: {
      type: Object
    }
  },
  data () {
    return {
      file: null,
      open: false,
      isPublic: false,
      publicLink: '',
      privateLink: '',
      isPrivate: false,
      searchText: '',
      sharedUsers: [],
      statusMessage: '',
      userSearchResults: [],
      minimized: false,
      progress: 0
    }
  },
  watch: {
    show (value) {
      this.open = value
      if (this.file && this.open) {
        this.share(this.file)
      }
    },
    item (value) {
      this.file = value
    }
  },
  computed: {
    ...mapState('blockstack', [
      'searchResults',
      'session',
      'signedInUserName',
      'fileRecords',
      'statusDisplay']),
    ...mapGetters('blockstack', [
      'gaiaToken',
      'gaiaPostUrl'])
  },
  methods: {
    ...mapActions('blockstack', [
      'searchProfile',
      'getFileContent',
      'saveFileRecord']),
    ...mapMutations('blockstack', [
      'setFileRecord']),
    async searchUser (searchText, update, abort) {
      if (!searchText) {
        abort()
        return
      }
      const self = this
      await this.searchProfile(searchText)
      update(() => {
        self.userSearchResults = self.searchResults.map(result => {
          return {
            profilePic: result.profilePic,
            label: result.name,
            sublabel: result.blockstackId,
            value: result.blockstackId
          }
        })
      })
    },
    async removeShare (username) {
      this.searchText = ''
      this.sharedUsers = this.sharedUsers.filter(u => u !== username)
      await this.modifyShare(this.file, username, 'remove')
    },
    async sharedWithUser (item) {
      this.searchText = ''
      await this.modifyShare(this.file, item.value, 'add')
    },
    async togglePublicShare (share) {
      try {
        this.privateLink = ''
        this.progress = 0
        let file = this.file
        const self = this
        if (share) {
          if (file.ealgo !== 'nacl' || !file.key) {
            self.statusMessage = 'Reading encrypted file...'
            let data = await this.getFileContent(file)
            file.ealgo = 'nacl'
            file.key = this.getNewPrivateKey()
            file.owner = this.signedInUserName
            file.sharedDate = this.getFormattedDate()
            self.statusMessage = 'Creating public share...'
            file = await self.uploadFileContent(file, data)
          }
          file.shared = ['public']
          self.publicLink = self.getPublicLink(file.id)
          await self.session.putFile(
            `${file.id}_public`,
            JSON.stringify({
              id: file.id,
              label: file.label,
              type: file.type,
              shared: file.shared,
              chunks: file.chunks,
              ealgo: file.ealgo,
              owner: file.owner,
              key: file.key
            }),
            { encrypt: false, contentType: 'application/json' })
          await self.saveFileRecord(file)
          self.statusMessage = ''
        } else if (file.shared && file.shared.includes('public')) {
          self.statusMessage = 'Reading public share...'
          let data = await self.getFileContent(file)
          self.statusMessage = 'Storing the file encrypted...'
          file.ealgo = 'nacl'
          file.key = self.getNewPrivateKey()
          file = await self.uploadFileContent(file, data)
          file.shared = []
          file.sharedDate = ''
          await self.saveFileRecord(file)
          await self.session.deleteFile(`${file.id}_public`)
          self.statusMessage = ''
          self.publicLink = ''
          self.isPublic = false
          self.sharedUsers = []
        }
      } catch (error) {
        this.$q.notify({ message: 'Failed to modify public share', color: 'negative' })
        console.log(error)
        this.statusMessage = ''
      }
    },
    async togglePrivateShare (share) {
      this.progress = 0
      const self = this
      let file = self.file
      if (share) {
        if (file.ealgo !== 'nacl' || !file.key) {
          self.statusMessage = 'Reading the encrypted file...'
          let data = await self.getFileContent(file)
          file.ealgo = 'nacl'
          file.key = self.getNewPrivateKey()
          self.statusMessage = 'Writing the file encrypted with new key...'
          file = await self.uploadFileContent(file, data)
        }
        if (file.shared && file.shared.length > 0) {
          file.shared.forEach(s => {
            self.modifyShare(file, s, 'add')
          })
        }
        self.publicLink = ''
        self.privateLink = this.getPrivateLink()
        self.saveFileRecord(file)
        self.statusMessage = ''
      } else if (file.key) {
        if (file.shared && file.shared.length > 0) {
          self.statusMessage = 'Reading the encrypted file...'
          let data = await this.getFileContent(file)
          self.removeAllShares(file)
          self.file.shared = []
          file.shared = []
          file.ealgo = 'nacl'
          file.key = self.getNewPrivateKey()
          self.statusMessage = 'Writing the file encrypted with new key...'
          file = await self.uploadFileContent(file, data)
          self.saveFileRecord(file)
          self.statusMessage = ''
          self.publicLink = ''
          self.privateLink = ''
          self.sharedUsers = []
        }
      }
    },
    async removeAllShares (file) {
      for (const s of file.shared) {
        await this.modifyShare(file, s, 'remove')
      }
    },
    async modifyShare (file, username, action) {
      try {
        if (!username || username === 'public') {
          return
        }
        const publicResult = await this.session.getFile('key.json', {
          decrypt: false,
          username: username,
          zoneFileLookupURL: `${DEFAULT_CORE_NODE}${NAME_LOOKUP_PATH}` })
        if (!publicResult || publicResult.length === 0) {
          return
        }
        const publicKey = JSON.parse(publicResult)
        let sharedFiles = await this.getSharedFiles(username)
        if (action === 'remove') {
          sharedFiles = sharedFiles.filter(sf => sf.id !== file.id)
          file.shared = file.shared.filter(u => u !== username)
        } else {
          file.owner = this.signedInUserName
          file.sharedDate = this.getFormattedDate()
          let existing = sharedFiles.find(f => f.id === file.id)
          if (existing) {
            existing.key = file.key
          } else {
            let clonedFile = JSON.parse(JSON.stringify(file))
            clonedFile.shared = []
            clonedFile.folderId = 'shares'
            sharedFiles.push(clonedFile)
          }
          if (!file.shared) {
            file.shared = []
          }
          if (!file.shared.includes(username)) {
            file.shared.push(username)
          }
          if (!this.sharedUsers) {
            this.sharedUsers = []
          }
          if (!this.sharedUsers.includes(username)) {
            this.sharedUsers.push(username)
          }
        }
        this.setFileRecord(file)
        if (sharedFiles && sharedFiles.length) {
          await this.session.putFile(`${username}/shared.json`, JSON.stringify(sharedFiles))
          await this.session.putFile(username, JSON.stringify(sharedFiles), { encrypt: publicKey })
        } else {
          await this.session.deleteFile(`${username}/shared.json`)
          await this.session.deleteFile(username)
        }
      } catch (error) {
        console.log(error)
        this.$q.notify({
          message: `Failed to create share for ${username}, please try agin later`,
          color: 'negative'
        })
      }
    },
    async getSharedFiles (username) {
      let sharedFiles = []
      try {
        const sharedResult = await this.session.getFile(`${username}/shared.json`)
        if (sharedResult) {
          sharedFiles = JSON.parse(sharedResult)
        }
      } catch (error) {
        console.log(error)
      }
      return sharedFiles
    },
    share (file) {
      if (!this.signedInUserName) {
        this.$q.notify({
          message: 'A Blockstack ID is required for the share to work, please sign up for one and try again',
          color: 'negative'
        })
        return
      }
      if (!file.shared) {
        file.shared = []
      }
      this.progress = 0
      this.publicLink = ''
      this.sharedUsers = []
      this.open = true
      this.minimized = false
      this.isPublic = (file.shared && file.shared.includes('public'))
      if (this.isPublic) {
        this.publicLink = this.getPublicLink(file.id)
      }
      if (!this.isPublic && file.shared.length > 0) {
        this.isPrivate = true
        this.privateLink = this.getPrivateLink()
      } else {
        this.isPrivate = false
      }
      if (this.isPrivate) {
        this.sharedUsers = file.shared
      }
    },
    uploadFileContent (item, data) {
      const self = this
      return new Promise((resolve, reject) => {
        let uploadWorker = this.$wf.createUploadWorker()
        let file = {
          file: data,
          id: item.id,
          size: data.byteLength,
          name: item.label,
          type: item.type,
          record: item,
          active: true,
          postAction: `${this.gaiaPostUrl}${item.id}`,
          headers: {
            authorization: `bearer ${this.gaiaToken}`
          }
        }
        uploadWorker.onmessage = (e) => {
          if (e.data.id === item.id) {
            file = {...file, ...e.data}
            if (e.data.record) {
              file.record = {...item, ...e.data.record}
            }
            const progress = e.data.progress
            if (!isNaN(progress) &&
              item.label === self.file.label) {
              self.progress = progress
            }
            if (e.data.success === true) {
              uploadWorker = null
              resolve(file.record)
            } else if (e.data.success === false) {
              uploadWorker = null
              reject(new Error(`Failed to upload ${item.label}`))
            }
          }
        }
        uploadWorker.postMessage(file)
      })
    },
    getPublicLink (fileId) {
      return `${window.location.origin}/?p=${this.signedInUserName}_${fileId}`
    },
    getPrivateLink () {
      return `${window.location.origin}/?s=${this.signedInUserName}`
    },
    async copyLink (link) {
      try {
        await copyToClipboard(link)
        this.$q.notify({
          position: 'top',
          message: 'Link copied to clipboard',
          color: 'primary' })
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>
