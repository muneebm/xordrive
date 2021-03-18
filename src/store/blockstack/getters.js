import { Person } from 'blockstack'

export const isUserSignedIn = (state, getters) => {
  return state.session.isUserSignedIn()
}

export const signedInUserProfile = (state, getters) => {
  var profile = null
  if (state.signedInUserData) {
    profile = new Person(state.signedInUserData.profile)
  }
  return profile
}

export const gaiaToken = (state, getters) => {
  const config = state.signedInUserData.gaiaHubConfig
  var token = null
  if (config && config.token) {
    token = config.token
  }
  return token
}

export const gaiaPostUrl = (state, getters) => {
  const config = state.signedInUserData.gaiaHubConfig
  var url = null
  if (config && config.server && config.address) {
    url = `${config.server}/store/${config.address}/`
  }
  return url
}
