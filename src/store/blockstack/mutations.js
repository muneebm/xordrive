import { format } from 'quasar'
const { humanStorageSize } = format
const totalSizeUsedText = (totalSizeUsed, maximumFreeSize) => {
  return (!isNaN(totalSizeUsed) && !isNaN(totalSizeUsed)) ? `${humanStorageSize(totalSizeUsed)} of ${humanStorageSize(maximumFreeSize)} used` : ''
}
export const setSearchResults = (state, searchResults) => {
  state.searchResults = searchResults
}

export const setUserSession = (state, userSession) => {
  state.session = userSession
}

export const setSignedInUserData = (state, userData) => {
  state.signedInUserData = userData
}

export const setSignedInUsername = (state, username) => {
  state.signedInUserName = username
}

export const setTotalSizeUsed = (state, totalSizeUsed) => {
  state.totalSizeUsed = totalSizeUsed
  state.totalSizeUsedText = totalSizeUsedText(totalSizeUsed, state.maximumFreeSize)
}

export const setFileRecord = (state, fileRecord) => {
  let existing = state.fileRecords.has(fileRecord.id)
  state.fileRecords.set(fileRecord.id, fileRecord)
  if (!existing) {
    state.totalSizeUsed += fileRecord.size
    state.totalSizeUsedText = totalSizeUsedText(state.totalSizeUsed, state.maximumFreeSize)
  }
}

export const removeFileRecord = (state, fileId) => {
  let fileRecord = state.fileRecords.get(fileId)
  if (state.fileRecords.delete(fileId)) {
    state.removedFiles.push(fileId)
    state.totalSizeUsed -= fileRecord.size
    state.totalSizeUsedText = totalSizeUsedText(state.totalSizeUsed, state.maximumFreeSize)
  }
}

export const setFileRecords = (state, fileRecords) => {
  state.fileRecords = fileRecords
}

export const setFolderRecord = (state, folderRecord) => {
  if (folderRecord) {
    state.folderRecords.set(folderRecord.id, folderRecord)
  }
}

export const removeFolderRecord = (state, folderId) => {
  if (state.folderRecords.delete(folderId)) {
    state.removedFolders.push(folderId)
  }
}

export const setFolderRecords = (state, folderRecords) => {
  state.folderRecords = folderRecords
}

export const setFolders = (state, folders) => {
  state.folders = folders
}

export const setFilesInSelectedFolder = (state, files) => {
  state.filesInSelectedFolder = files
}

export const setSelectedFolderId = (state, value) => {
  state.selectedFolderId = value
}

export const setPublicFilePath = (state, value) => {
  state.publicFilePath = value
}

export const setPrivateSharePath = (state, value) => {
  state.privateShare = value
}

export const setShares = (state, shares) => {
  state.sharedWithMe = shares
}

export const setSettings = (state, settings) => {
  state.settings = settings
}

export const updateStatusDisplay = (state, statusDisplay) => {
  state.statusDisplay = {...state.statusDisplay, ...statusDisplay}
}
