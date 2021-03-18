import { AppConfig, UserSession } from 'blockstack'
import { LocalStorage, Dark } from 'quasar'
let darkMode = Dark.isActive
if (LocalStorage.has('darkMode')) {
  darkMode = LocalStorage.getItem('darkMode')
}

export default {
  settings: {
    darkMode: darkMode
  },
  session: new UserSession({
    appConfig: new AppConfig(['store_write', 'publish_data'], window.location.origin)
  }),
  signedInUserData: null,
  signedInUserName: '',
  searchResults: [],
  sharedWithMe: [],
  fileRecords: new Map(),
  folderRecords: new Map([
    ['gaiahub', {
      label: 'Drive',
      id: 'gaiahub',
      icon: 'storage',
      color: '',
      lastModified: '',
      folderId: 'xor',
      type: 'folder'
    }],
    ['starred', {
      label: 'Favorites',
      id: 'starred',
      icon: 'star',
      color: '',
      lastModified: '',
      folderId: 'xor',
      type: 'folder'
    }],
    ['shares', {
      label: 'Shares',
      id: 'shares',
      icon: 'share',
      color: '',
      lastModified: '',
      folderId: 'xor',
      type: 'folder'
    }],
    ['trash', {
      label: 'Trash',
      id: 'trash',
      icon: 'delete',
      color: '',
      lastModified: '',
      folderId: 'xor',
      type: 'folder'
    }]
  ]),
  selectedFolderId: 'gaiahub',
  filesInSelectedFolder: [],
  removedFolders: [],
  removedFiles: [],
  publicFilePath: '',
  privateShare: '',
  statusDisplay: {
    progress: 0,
    message: '',
    display: false,
    type: 0
  },
  totalSizeUsed: 0,
  totalSizeUsedText: '',
  maximumFreeSize: 15 * 1073741824
}
