<template>
  <q-page
    :class="{ 'q-pa-md': $q.platform.is.mobile, 'q-pt-xl': !$q.platform.is.mobile, 'q-pr-xl': !$q.platform.is.mobile, 'q-pl-xl': !$q.platform.is.mobile, 'q-pb-lg': !$q.platform.is.mobile, 'q-mt-xl': !$q.platform.is.mobile }">
    <div class="row justify-center" >
      <div :class="{'q-mt-xl': true, 'q-ml-xl': $q.screen.gt.xs, 'q-mr-xl': $q.screen.gt.xs }">
        <div class="text-h3 q-ma-md text-center text-bold">
          Encrypted Cloud Storage
        </div>
        <div class="text-h6 text-weight-light text-center">
          A secure locker for all your files.
        </div>
        <div class="row justify-center q-mt-lg">
          <q-btn
            outline
            text-color="secondary"
            class="q-ma-sm"
            @click="auth(true)"
            label="Login"/>
          <q-btn
            class="q-ma-sm"
            color="secondary"
            @click="auth(false)"
            label="Get Started For Free"/>
        </div>
      </div>
    </div>
    <div class="row justify-center q-mb-xl" >
      <div :class="{'q-mt-xl': true, 'q-ml-xl': $q.screen.gt.xs, 'q-mr-xl': $q.screen.gt.xs, fit: true, 'shadow-8': true}">
        <q-img alt="xordrive"
          class="mobile-hide"
          :src="`statics/screenshot${$q.dark.isActive ? '_dark' : ''}.png`"/>
        <q-img alt="xordrive"
          class="mobile-only"
          :src="`statics/screenshot${$q.dark.isActive ? '_dark' : ''}_mobile.png`"/>
      </div>
    </div>
    <q-separator />
    <div class="q-pt-xl q-pb-xl" id="features">
      <div class="text-center text-h5">Features</div>
      <div class="row justify-center q-pt-xl q-pb-xl">
        <q-card flat class="q-ma-sm" key="encrypted">
          <q-card-section class="row jutify-center full-width">
            <q-avatar  size="28px" color="white" text-color="black" icon="enhanced_encryption" class="shadow-4" />
            <div class="text-h5 q-ml-sm">Privacy & Security</div>
          </q-card-section>
          <q-card-section class="row justify-center">
            <p class="text-subtitle1 text-justify text-weight-light">
              All your files are encrypted with encryption keys only you hold.
            </p>
          </q-card-section>
        </q-card>
        <q-separator vertical inset v-if="$q.screen.gt.sm"/>
        <q-card flat class="q-ma-sm" key="decentralized">
          <q-card-section class="row jutify-center full-width">
            <q-avatar  size="28px" color="white" text-color="black" icon="device_hub" class="shadow-4" />
            <div class="text-h5 q-ml-sm">Data Ownership</div>
          </q-card-section>
          <q-card-section>
            <p class="text-subtitle1 text-justify text-weight-light">
              Use the default storage for free or configure another storage location of your choice.*
            </p>
          </q-card-section>
        </q-card>
        <q-separator vertical inset v-if="$q.screen.gt.sm"/>
        <q-card flat class="q-ma-sm" key="share">
          <q-card-section class="row jutify-center full-width">
            <q-avatar  size="28px" color="white" text-color="black" icon="share" class="shadow-4" />
            <div class="text-h5 q-ml-sm">Share</div>
          </q-card-section>
          <q-card-section>
            <p class="text-subtitle1 text-justify text-weight-light">
              Share files publicly or with other xordrive users.
            </p>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-separator id="getStarted" />
    <div class="q-mt-xl text-caption text-weight-light text-justify row justify-center q-pt-lg" >
      <div>
        * The default <span class="text-bold">FREE</span> storage is provided by Blockstack PBC.
        <span class="text-bold">Uploads will be throttled after 10GB to encourage fair usage</span>.
        Setup your own storage hub to have full control over your data,
        <a target="_blank" class="blockstack-link" href="https://github.com/blockstack/gaia/blob/master/hub/README.md">
          here
        </a>
        are the instructions for running your own hub.
      </div>
    </div>
  </q-page>
</template>
<script>
import { mapState } from 'vuex'
import { showBlockstackConnect } from '@blockstack/connect'

export default {
  name: 'Home',
  data () {
    return {
      scrolled: false,
      left: false
    }
  },
  async created () {
    if (this.session.isUserSignedIn()) {
      this.$router.push('/')
    }
  },
  computed: {
    ...mapState('blockstack', ['session'])
  },
  methods: {
    async auth (sendToSignIn) {
      if (!this.session.isUserSignedIn()) {
        // this.session.redirectToSignIn(
        //   window.location.origin,
        //   `${window.location.origin}/manifest.json`,
        //   ['store_write', 'publish_data']
        // )
        showBlockstackConnect({
          appDetails: {
            name: 'xordrive',
            icon: `${window.location.origin}/statics/icons/icon-512x512.png`
          },
          onFinish: ({ userSession }) => {
            this.$router.push('/')
          },
          sendToSignIn: sendToSignIn,
          userSession: this.session
        })
      }
    }
  }
}
</script>

<style>
.blockstack-link {
  text-decoration: none;
  color: #027be3;
}
.q-card {
  width: 100%;
  max-width: 350px;
}
.feature-card {
  width: 100%;
  max-width: 150px;
}
</style>
