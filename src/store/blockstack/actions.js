import { getPublicKeyFromPrivate } from 'blockstack'
import axios from 'axios'
import { uniq } from 'lodash'
import { format, Dark, exportFile, date } from 'quasar'
import JSZip from 'jszip'
import { workerFactory } from 'boot/factory'
const { humanStorageSize } = format
const prefix = 'multifile:'
const sizeMap = {
  'kb': 1024,
  'mb': 1048576,
  'gb': 1073741824,
  'tb': 1099511627776,
  'pb': 1125899906842624,
  'b': 1
}

const flattenFolders = (folderRecords, folders) => {
  if (!folders || folders.length === 0) return
  while (folders.length > 0) {
    let folder = folders.pop()
    folder.folderId = (folder.parent) ? folder.parent : 'xor'
    folderRecords.set(folder.id, folder)
    if (folder.children) {
      flattenFolders(folderRecords, folder.children)
    }
  }
}

const convertToBytes = (size) => {
  if (typeof size === 'string') {
    let sizeLower = size.toLowerCase()
    for (const [key, value] of Object.entries(sizeMap)) {
      if (sizeLower.includes(key)) {
        sizeLower = sizeLower.replace(key, '').trim()
        sizeLower = Math.round(parseFloat(sizeLower) * value)
        break
      }
    }
    return sizeLower
  } else {
    return size
  }
}

export const searchProfile = (context, query) => {
  return new Promise((resolve, reject) => {
    axios.get('https://core.blockstack.org/v1' + '/search?query=' + query)
      .then((response) => {
        var searchResults = []
        if (response.data && response.data.results && response.data.results.length) {
          var appurl = window.location.origin
          appurl = appurl.replace('.', '_')
          searchResults = response.data.results.map((result) => {
            var profilePic = Dark.isActive ? '' : 'statics/avatar-placeholder.png'
            // if (result.profile.image && result.profile.image.length) {
            //   const avatarImage = result.profile.image.find((i) => i.name === 'avatar')
            //   if (avatarImage) {
            //     profilePic = avatarImage.contentUrl
            //   }
            // }
            var xorUser = false
            var gaiaUrl = ''
            if (result.profile.apps) {
              xorUser = appurl in result.profile.apps
              gaiaUrl = result.profile.apps[appurl]
            }
            return {
              name: result.profile.name ? result.profile.name.toString() : '',
              blockstackId: result.fullyQualifiedName ? result.fullyQualifiedName.toString() : '',
              profilePic: profilePic,
              xorUser: xorUser,
              gaiaUrl: gaiaUrl
            }
          })
        }
        context.dispatch('updateSearchResults', searchResults)
        resolve(searchResults)
      })
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}

export const setup = async (context) => {
  context.dispatch('loadSignedInUser')
  context.dispatch('updateSettings')
}

export const setupPublicKey = async (context) => {
  var publicKey = ''
  if (context.state.signedInUserData && context.state.signedInUserData.appPrivateKey) {
    publicKey = getPublicKeyFromPrivate(context.state.signedInUserData.appPrivateKey)
  }
  if (publicKey) {
    let existingPublicKey = ''
    try {
      const publicResult = await context.state.session.getFile('key.json', {
        decrypt: false
      })
      if (publicResult && publicResult.length === 0) {
        existingPublicKey = JSON.parse(publicResult)
      }
    } catch (error) {
      console.log(error)
    }
    if (existingPublicKey !== publicKey) {
      try {
        await context.state.session.putFile(
          'key.json',
          JSON.stringify(publicKey),
          { encrypt: false })
      } catch (error) {
        console.log(error)
      }
    }
  }
}

export const getSettings = async (context) => {
  try {
    let settingString = await context.state.session.getFile('settings.json')
    if (settingString) {
      let settings = JSON.parse(settingString)
      context.commit('setSettings', {...context.state.settings, ...settings})
      Dark.set(context.state.settings.darkMode)
    } else {
      console.log('Failed to get settings.json')
    }
  } catch (error) {
    console.log(error)
  }
}

export const setDarkMode = async (context, active) => {
  context.commit('setSettings', {...context.state.settings, ...{ darkMode: active }})
  Dark.set(active)
  if (context.state.session.isUserSignedIn()) {
    context.dispatch('updateSettings')
  }
}

export const updateSettings = async (context) => {
  let settingString = ''
  try {
    settingString = await context.state.session.getFile('settings.json')
    if (settingString) {
      let settings = JSON.parse(settingString)
      context.commit('setSettings', {...settings, ...context.state.settings})
    } else {
      console.log('Failed to get settings.json')
    }
  } catch (error) {
    console.log(error)
  }
  try {
    if (settingString !== JSON.stringify(context.state.settings)) {
      await context.state.session.putFile('settings.json', JSON.stringify(context.state.settings))
    }
  } catch (error) {
    console.log(error)
  }
}

export const updateSearchResults = (context, searchResults) => {
  if (searchResults) {
    context.commit('setSearchResults', searchResults)
  }
}

export const loadSignedInUser = (context) => {
  const userData = context.state.session.loadUserData()
  if (userData) {
    if (!userData.gaiaHubConfig) {
      setTimeout(() => context.dispatch('loadSignedInUser'), 1000)
    }
    context.commit('setSignedInUserData', userData)
    if (userData.username) {
      context.commit('setSignedInUsername', userData.username)
    }
    context.dispatch('setupPublicKey')
  }
}

export const saveFolderRecord = (context, folderRecord) => {
  context.commit('setFolderRecord', folderRecord)
  context.dispatch('updateFolderRecords')
}

export const removeFolderRecord = (context, folderId) => {
  context.commit('removeFolderRecord', folderId)
  context.dispatch('updateFolderRecords')
}

export const saveFileRecord = async (context, filRecord) => {
  context.commit('setFileRecord', filRecord)
  await context.dispatch('updateFileRecords')
}

export const removeFileRecord = (context, fileId) => {
  context.commit('removeFileRecord', fileId)
  context.dispatch('updateFileRecords')
}

export const updateFileRecords = async (context) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  let existingFilesString = ''
  try {
    existingFilesString = await context.state.session.getFile('files.json')
  } catch (error) {
    console.log(error)
  }
  if (existingFilesString) {
    let existingFiles = new Map(JSON.parse(existingFilesString))
    context.state.removedFiles.forEach(id => {
      existingFiles.delete(id)
    })
    context.commit('setFileRecords', new Map([...existingFiles, ...context.state.fileRecords]))
    await context.dispatch('uploadFileRecords')
    context.dispatch('getFilesInSelectedFolder', true)
  } else {
    console.log('Failed to get files.json')
  }
}

export const uploadFileRecords = async (context) => {
  try {
    await context.state.session.putFile(
      'files.json',
      JSON.stringify([...context.state.fileRecords]))
  } catch (error) {
    console.log(error)
  }
}

export const uploadFolderRecords = async (context) => {
  try {
    await context.state.session.putFile(
      'folders.json',
      JSON.stringify([...context.state.folderRecords]))
  } catch (error) {
    console.log(error)
  }
}

export const getFileRecords = async (context) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  let existingFilesString = ''
  try {
    existingFilesString = await context.state.session.getFile('files.json')
  } catch (error) {
    console.log(error)
  }
  let totalSizeUsed = 0
  if (existingFilesString) {
    let existingFiles = new Map(JSON.parse(existingFilesString))
    for (let [key, value] of existingFiles) {
      if (!value.sizeText && value.size) {
        value.size = convertToBytes(value.size)
        value.sizeText = humanStorageSize(value.size)
        existingFiles.set(key, value)
      }
      if (!isNaN(value.size)) {
        totalSizeUsed += value.size
      }
    }
    context.commit('setFileRecords', new Map([...context.state.fileRecords, ...existingFiles]))
    context.commit('setTotalSizeUsed', totalSizeUsed)
  } else {
    await context.dispatch('uploadFileRecords')
    context.dispatch('getFilesInSelectedFolder', true)
  }
}

export const updateFolderRecords = async (context) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  let existingFoldersString = ''
  try {
    existingFoldersString = await context.state.session.getFile('folders.json')
  } catch (error) {
    console.log(error)
  }
  if (existingFoldersString) {
    let existingFolders = new Map(JSON.parse(existingFoldersString))
    context.state.removedFolders.forEach(id => {
      existingFolders.delete(id)
    })
    context.commit('setFolderRecords', new Map([...existingFolders, ...context.state.folderRecords]))
    await context.dispatch('uploadFolderRecords')
  } else {
    console.log('Failed to get folders.json')
  }
}

export const getFolderRecords = async (context) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  let foldersString = ''
  let errorName = ''
  try {
    foldersString = await context.state.session.getFile('folders.json')
  } catch (error) {
    errorName = error.name
  }
  if (errorName === 'DoesNotExist') {
    try {
      await context.state.session.putFile(
        'folders.json',
        JSON.stringify([...context.state.folderRecords]))
    } catch (error) {
      console.log(error)
    }
  }
  try {
    if (foldersString) {
      let existingFolders = JSON.parse(foldersString)
      let folderRecords = new Map()
      if (existingFolders.find(f => !Array.isArray(f))) {
        await context.state.session.putFile(
          'folders.json', JSON.stringify([]))
        flattenFolders(folderRecords, existingFolders)
        folderRecords = new Map([...context.state.folderRecords, ...folderRecords])
      } else {
        folderRecords = new Map([...context.state.folderRecords, ...new Map(existingFolders)])
      }
      context.commit('setFolderRecords', folderRecords)
      await context.dispatch('updateFolderRecords')
    }
  } catch (error) {
    console.log(error)
  }
}

export const updateShareRecords = async (context) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  let existingFilesString = ''
  try {
    existingFilesString = await context.state.session.getFile('shares.json')
  } catch (error) {
    console.log(error)
  }
  let shares = []
  if (existingFilesString) {
    let existingShares = JSON.parse(existingFilesString)
    shares = [...shares, ...existingShares]
  }
  if (context.state.privateShare && !shares.includes(context.state.privateShare)) {
    shares.push(context.state.privateShare)
  }
  shares = uniq(shares)
  context.commit('setShares', shares)
  if (context.state.privateShare) {
    context.commit('setSelectedFolderId', 'shares')
  }
  await context.dispatch('uploadShareRecords')
  context.commit('setPrivateSharePath', '')
}

export const uploadShareRecords = async (context) => {
  try {
    await context.state.session.putFile(
      'shares.json',
      JSON.stringify(context.state.sharedWithMe))
  } catch (error) {
    console.log(error)
  }
}

export const removeFile = async (context, file) => {
  if (file.chunks) {
    for (let index = 0; index < file.chunks; index++) {
      await context.dispatch('deleteFile', `${file.id}_${index}`)
    }
  } else {
    let isEncrypted = !(file.shared && file.shared.includes('public'))
    let fileContent = null
    try {
      fileContent = await context.state.session.getFile(file.id, { decrypt: !file.key && isEncrypted })
    } catch (error) {
      console.log(error)
    }
    if (fileContent) {
      if (file.key && isEncrypted) {
        fileContent = context.state.session.decryptContent(fileContent, { privateKey: file.key })
      }
      if (typeof fileContent === 'string') {
        const fileString = String(fileContent)
        if (fileString.length > 10 && fileString.substring(0, 10) === prefix) {
          let fileNames = fileString.substring(10, fileString.length).split(',')
          fileNames = fileNames.filter(e => e)
          fileNames.forEach(async (fileName) => {
            await context.dispatch('deleteFile', fileName)
          })
        }
      }
      await context.dispatch('deleteFile', file.id)
    }
  }
}

export const deleteFile = async (context, fileId) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  try {
    await context.state.session.deleteFile(fileId)
  } catch (error) {
    console.log(error)
  }
}

export const getFilesInSelectedFolder = (context, noUpdate) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  let filesInSelectedFolder = []
  if (context.state.fileRecords.size > 0) {
    let files = [...context.state.fileRecords.values()]
    filesInSelectedFolder = files.filter(fr => fr.folderId === context.state.selectedFolderId)
  }
  context.commit('setFilesInSelectedFolder', filesInSelectedFolder)
}

export const removeItemsRecursive = async (context, items) => {
  if (!items) {
    return
  }
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (!item) {
      continue
    }
    context.dispatch('setStatusData', {
      message: `Removing ${item.label}`,
      display: true,
      progress: (index + 1) / items.length,
      type: 1})
    if (item.type === 'folder') {
      let filesInFolder = [...context.state.fileRecords.values()].filter(fr => fr != null && fr.folderId && fr.folderId === item.id)
      let foldersInFolder = [...context.state.folderRecords.values()].filter(fr => fr != null && fr.folderId && fr.folderId === item.id)
      await context.dispatch('removeItemsRecursive', [...filesInFolder, ...foldersInFolder])
      context.commit('removeFolderRecord', item.id)
    } else {
      await context.dispatch('removeFile', item)
      context.commit('removeFileRecord', item.id)
    }
  }
}

export const removeSelectedItems = async (context, items) => {
  if (!context.state.session.isUserSignedIn()) {
    return
  }
  context.dispatch('setStatusData', {
    message: 'Removing selected items...',
    display: true,
    progress: 0,
    type: 1})
  await context.dispatch('removeItemsRecursive', items)
  context.dispatch('updateFolderRecords')
  context.dispatch('updateFileRecords')
  context.dispatch('setStatusData', {
    message: 'Removed selected items',
    display: true,
    type: 2})
}

export const download = (context, selected) => {
  context.dispatch('setStatusData', {
    message: 'Downloading...',
    display: true,
    type: 1})
  if (selected.length > 1 || selected[0].type === 'folder') {
    context.dispatch('zipFiles', {
      folderId: context.state.selectedFolderId,
      items: selected,
      zip: new JSZip()
    })
  } else {
    context.dispatch('downloadFile', selected[0])
  }
}

export const downloadFile = async (context, item) => {
  try {
    context.dispatch('setStatusData', {
      message: `Downloading ${item.label} ...`,
      display: true,
      type: 1})
    let fileContent = await context.dispatch('getFileContent', item)
    let file = new File([fileContent], item.label, {type: item.type})
    exportFile(item.label, file)
    context.dispatch('setStatusData', {
      message: `Downloaded ${item.label}`,
      type: 2})
  } catch (error) {
    console.log(error)
    context.dispatch('setStatusData', {
      message: `Download failed for ${item.label}`,
      type: 3})
  }
}

export const getFileContent = (context, item) => {
  return new Promise((resolve, reject) => {
    context.commit('updateStatusDisplay', { progress: 0 })
    let downloadWorker = workerFactory.createDownloadWorker()
    downloadWorker.postMessage({
      appConfig: context.state.session.appConfig,
      sessionOptions: context.state.session.store.getSessionData()
    })
    downloadWorker.onmessage = (e) => {
      if (e.data.id === item.id) {
        if (!e.data.active) {
          downloadWorker = null
          if (e.data.success) {
            resolve(e.data.data)
          } else {
            reject(new Error(`Failed to read ${item.label}`))
          }
        } else {
          context.commit('updateStatusDisplay', { progress: e.data.progress })
        }
      }
    }
    downloadWorker.postMessage({
      fileRecord: item
    })
  })
}

export const setStatusData = (context, statusData) => {
  setTimeout(() => { context.commit('updateStatusDisplay', statusData) }, 1)
  if (statusData.type > 1) {
    setTimeout(() => {
      statusData.message = ''
      statusData.display = false
      statusData.type = 0
      statusData.progress = 0
      context.commit('updateStatusDisplay', statusData)
    },
    7000)
  }
}

export const zipFiles = async (context, options) => {
  let promises = []
  let {folderId, items, zip} = options
  for (let item of items) {
    context.dispatch('setStatusData', {
      message: `Downloading ${item.label} ...`
    })
    if (item.type === 'folder') {
      let childItems = [
        ...[...context.state.folderRecords.values()].filter(fr => fr && fr.folderId === item.id),
        ...[...context.state.fileRecords.values()].filter(fr => fr && fr.folderId === item.id)]
      let promise = context.dispatch('zipFiles', {
        folderId: item.id,
        items: childItems,
        zip: zip.folder(item.label)
      })
      promises.push(promise)
    } else {
      let promise = context.dispatch('getFileContent', item)
      promises.push(promise)
    }
  }
  try {
    const results = await Promise.all(promises)
    for (let index = 0; index < results.length; index++) {
      let itemInfo = items[index]
      if (itemInfo.type !== 'folder') {
        let data = results[index]
        zip.file(itemInfo.label, data)
        context.dispatch('setStatusData', {
          message: `Adding ${itemInfo.label} to zip ...`
        })
      }
    }
    if (folderId === context.state.selectedFolderId) {
      context.dispatch('setStatusData', {
        message: 'Downloading zip file ...'
      })
      let blob = await zip.generateAsync({ type: 'blob' })
      let zipName = `xordrive_${date.formatDate(Date.now(), 'YYYYMMDDTHHmmss')}.zip`
      exportFile(zipName, blob)
      context.dispatch('setStatusData', {
        message: `Downloaded ${zipName}`,
        type: 2
      })
    }
  } catch (error) {
    context.dispatch('setStatusData', {
      message: 'Download failed',
      type: 3
    })
    console.log(error)
  }
}
