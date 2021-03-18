import { scroll, uid, date } from 'quasar'
import { secretbox, randomBytes } from 'tweetnacl'
import { encodeBase64 } from 'tweetnacl-util'
const { getScrollTarget, setScrollPosition } = scroll
export default ({ Vue }) => {
  Vue.mixin({
    methods: {
      getNewPrivateKey () {
        return encodeBase64(randomBytes(secretbox.keyLength))
      },
      getNewFolder (newName, parentId) {
        if (!parentId) {
          parentId = 'gaiahub'
        }
        let today = this.getFormattedDate()
        return {
          label: newName,
          id: uid(),
          color: '',
          created: today,
          lastModified: today,
          opened: today,
          icon: 'fas fa-folder',
          size: '--',
          star: false,
          folderId: parentId,
          type: 'folder'
        }
      },
      getFormattedDate () {
        return date.formatDate(Date.now(), 'MMM DD, YYYY')
      },
      getIcon (icon, type) {
        if (icon === 'insert_drive_file' ||
            icon === 'folder' ||
            !icon) {
          if (type.startsWith('text')) {
            icon = 'fas fa-file-alt'
          } else if (type.startsWith('application/pdf')) {
            icon = 'fas fa-file-pdf'
          } else if (type.startsWith('image')) {
            icon = 'fas fa-file-image'
          } else if (type.startsWith('video')) {
            icon = 'fas fa-file-video'
          } else if (type.startsWith('audio')) {
            icon = 'fas fa-file-audio'
          } else if (type.includes('excel')) {
            icon = 'fas fa-file-excel'
          } else if (type.includes('word')) {
            icon = 'fas fa-file-word'
          } else if (type.includes('powerpoint')) {
            icon = 'fas fa-file-powerpoint'
          } else if (type.includes('zip') || type.includes('rar')) {
            icon = 'fas fa-file-archive'
          } else if (type.startsWith('folder')) {
            icon = 'fas fa-folder'
          } else {
            icon = 'fas fa-file'
          }
        }
        return icon
      },
      copyright () {
        return `\u00A9 ${(new Date()).getFullYear()} xordrive.`
      },
      bringIntoView (section) {
        const sectionEl = document.getElementById(section)
        if (sectionEl) {
          let target = getScrollTarget(sectionEl)
          let duration = 500
          setScrollPosition(target, sectionEl.offsetTop, duration)
        }
      },
      isPreviewSupported (type) {
        return (type.startsWith('text') ||
          type.startsWith('application/xml') ||
          (type.startsWith('application') &&
          (type.includes('+xml') || type.includes('json') || type.includes('html') || type.includes('script')))) ||
          type.startsWith('application/pdf') ||
          type.includes('image/svg') ||
          type.startsWith('image') ||
          type.startsWith('video') ||
          type.startsWith('audio')
      }
    }
  })
}
