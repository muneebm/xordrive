<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  name: 'App',
  async created () {
    const urlParams = new URLSearchParams(window.location.search)
    const publicFilePath = urlParams.get('p')
    const privateShare = urlParams.get('s')
    const isAuthResponse = !!(urlParams.get('authResponse'))
    if (privateShare) {
      this.$q.localStorage.set('privateShare', privateShare)
    }
    if (publicFilePath) {
      this.setPublicFilePath(publicFilePath)
      this.$router.push('/public')
    } else {
      await this.handleSignIn(isAuthResponse)
    }
  },
  computed: {
    ...mapState('blockstack', [
      'session'])
  },
  methods: {
    ...mapMutations('blockstack', [
      'setPrivateSharePath',
      'setPublicFilePath']),
    async handleSignIn (isAuthResponse) {
      const blockstack = this.session
      const handleSuccessfulSignIn = () => {
        if (isAuthResponse) {
          window.location = window.location.origin
        }
        this.$router.push('/')
      }
      if (blockstack.isUserSignedIn()) {
        if (this.$q.localStorage.has('privateShare')) {
          const privateShare = this.$q.localStorage.getItem('privateShare')
          this.setPrivateSharePath(privateShare)
          this.$q.localStorage.remove('privateShare')
        }
        handleSuccessfulSignIn()
      } else if (blockstack.isSignInPending()) {
        await blockstack.handlePendingSignIn()
        handleSuccessfulSignIn()
      } else {
        this.$router.push('/start')
      }
    }
  }
}
</script>

<style>
  .sc-eCApGN {
    color: black;
  }
</style>
