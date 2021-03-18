<template>
 <q-scroll-area style="height: 100vh">
  <q-layout  view="lHh Lpr fFf" @scroll="scrollHandler" >
    <q-header >
      <q-toolbar
      style="transition: padding .5s ease;"
      :class="{ 'absolute-top': true, 'q-pa-xl': !scrolled && !$q.platform.is.mobile, 'shadow-1': scrolled || $q.platform.is.mobile }" >
        <q-avatar rounded size="28px">
          <img src="statics/auth_logo.jpeg" class="fit no-shadow" />
        </q-avatar>
        <q-toolbar-title class="text-weight-light">
          <span class="mobile-hide">xordrive</span>
        </q-toolbar-title>
        <q-btn
          :class="{ 'q-mr-sm': true, 'text-weight-light': true, 'text-primary': !$q.dark.isActive }"
          v-if="$q.screen.gt.sm"
          flat
          @click.prevent="bringIntoView('features')"
          label="Features"/>
        <q-toggle
          :title="darkMode ? 'Switch to light mode': 'Switch to dark mode'"
          color="secondary"
          v-model="darkMode"
          checked-icon="fa fa-moon"
          unchecked-icon="fa fa-sun"
        />
      </q-toolbar>
    </q-header>
    <q-page-container >
      <privacy :show.sync="showPrivacy" />
      <router-view />
      <div class="row justify-center">
        <q-btn no-caps flat class="text-caption text-weight-light" label="Privacy Policy." @click="showPrivacy = true" />
      </div>
    </q-page-container>
    <div >
      <q-separator  />
      <q-toolbar >
        <q-btn flat class="text-overline text-center q-pl-none no-pointer-events text-weight-light" no-caps>
          {{ copyright() }}
        </q-btn>
        <q-toolbar-title class="text-caption" >
        </q-toolbar-title>
        <!-- <q-btn :class="{ 'text-primary': !$q.dark.isActive }" title="contact@xordrive.io" flat round icon="mail_outline" @click="contact" />
        <q-separator vertical class="q-mt-md q-mb-md" /> -->
        <q-btn title="Product Hunt" flat round @click.native="openProductHuntPost">
          <q-avatar rounded size="22px">
            <img src="statics/product-hunt-logo-black-960.png" class="fit no-shadow" />
          </q-avatar>
        </q-btn>
        <q-separator vertical class="q-mt-md q-mb-md" />
        <q-btn title="@xordrive" flat round @click.native="openTwitterProfile">
          <q-avatar rounded size="22px">
            <img src="statics/Twitter_Social_Icon_Circle_Color.svg" class="fit no-shadow" />
          </q-avatar>
        </q-btn>
      </q-toolbar>
    </div>
  </q-layout>
 </q-scroll-area>
</template>

<script>
import { openURL } from 'quasar'
import Privacy from './../components/Privacy'
export default {
  name: 'HomeLayout',
  components: {
    Privacy
  },
  data () {
    return {
      scrolled: false,
      left: false,
      showPrivacy: false
    }
  },
  created () {
    if (this.$store.state.blockstack.session.isUserSignedIn()) {
      this.$router.push('/')
    }
  },
  computed: {
    darkMode: {
      get: function () {
        return this.$store.state.blockstack.settings.darkMode
      },
      set: function (newValue) {
        if (newValue !== this.$store.state.blockstack.settings.darkMode) {
          this.$store.dispatch('blockstack/setDarkMode', newValue)
          this.$q.localStorage.set('darkMode', newValue)
        }
      }
    }
  },
  methods: {
    contact () {
      openURL('mailto:contact@xordrive.io')
    },
    learnMoreAboutBlockstack () {
      openURL('https://blockstack.org/faq')
    },
    openProductHuntPost () {
      openURL('https://www.producthunt.com/posts/xor-drive')
    },
    openTwitterProfile () {
      openURL('https://mobile.twitter.com/xordrive')
    },
    scrollHandler (details) {
      this.scrolled = (details.position > 250)
    }
  }
}
</script>
