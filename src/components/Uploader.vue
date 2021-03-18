<template>
  <span :class="className">
    <slot />
    <label :for="inputId || name" />
    <input-file />
  </span>
</template>
<style>
.file-uploads {
  overflow: hidden;
  position: relative;
  text-align: center;
  display: inline-block;
}
.file-uploads.file-uploads-html4 input, .file-uploads.file-uploads-html5 label {
  /* background fix ie  click */
  background: #fff;
  opacity: 0;
  font-size: 20em;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  width: 100%;
  height: 100%;
}
.file-uploads.file-uploads-html5 input, .file-uploads.file-uploads-html4 label {
  /* background fix ie  click */
  background: rgba(255, 255, 255, 0);
  overflow: hidden;
  position: fixed;
  width: 1px;
  height: 1px;
  z-index: -1;
  opacity: 0;
}
</style>
<script>
import InputFile from './InputFile.vue'
import { mapMutations, mapState, mapGetters } from 'vuex'
import { uid, format } from 'quasar'
import * as Mime from 'mime-types'
const { humanStorageSize } = format

export default {
  components: {
    InputFile
  },
  props: {
    inputId: {
      type: String
    },

    name: {
      type: String,
      default: 'file'
    },

    accept: {
      type: String
    },

    capture: {
    },

    disabled: {
    },

    multiple: {
      type: Boolean
    },

    maximum: {
      type: Number,
      default () {
        return this.multiple ? 0 : 1
      }
    },

    addIndex: {
      type: [Boolean, Number]
    },

    directory: {
      type: Boolean
    },

    timeout: {
      type: Number,
      default: 0
    },

    drop: {
      default: false
    },

    dropDirectory: {
      type: Boolean,
      default: true
    },

    value: {
      type: Array,
      default: Array
    },

    thread: {
      type: Number,
      default: 1
    }
  },

  data () {
    return {
      files: this.value,
      features: {
        directory: false,
        drag: false
      },
      active: false,
      dropActive: false,
      uploading: 0,
      destroy: false,
      uploadWorker: null,
      newlyAddedFolders: {}
    }
  },

  mounted () {
    let input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    if (typeof input.webkitdirectory === 'boolean' || typeof input.directory === 'boolean') {
      this.features.directory = true
    }
    this.uploadWorker = this.$wf.createUploadWorker()
    this.uploadWorker.onmessage = (e) => {
      let file = this.get(e.data.id)
      if (file && file.fileObject) {
        this.update(file, e.data)
      }
    }

    if (typeof input.ondrop !== 'undefined') {
      this.features.drop = true
    }
    this.maps = {}
    if (this.files) {
      for (let i = 0; i < this.files.length; i++) {
        let file = this.files[i]
        this.maps[file.id] = file
      }
    }

    this.$nextTick(function () {
      if (this.$parent) {
        this.$parent.$forceUpdate()
        this.$parent.$nextTick(() => {
          this.watchDrop(this.drop)
        })
      } else {
        this.watchDrop(this.drop)
      }
    })
  },

  beforeDestroy () {
    this.destroy = true
    this.active = false
    this.watchDrop(false)
  },

  computed: {
    ...mapState('blockstack', ['folderRecords', 'fileRecords', 'selectedFolderId']),
    ...mapGetters('blockstack', ['gaiaToken', 'gaiaPostUrl']),
    uploaded () {
      let file
      for (let i = 0; i < this.files.length; i++) {
        file = this.files[i]
        if (file.fileObject && !file.error && !file.success) {
          return false
        }
      }
      return true
    },
    className () {
      return [
        'file-uploads',
        'file-uploads-html5',
        this.features.directory && this.directory ? 'file-uploads-directory' : undefined,
        this.features.drop && this.drop ? 'file-uploads-drop' : undefined,
        this.disabled ? 'file-uploads-disabled' : undefined
      ]
    },
    selectedFolder () {
      return this.folderRecords.get(this.selectedFolderId)
    }
  },

  watch: {
    active (active) {
      this.watchActive(active)
    },

    dropActive () {
      if (this.$parent) {
        this.$parent.$forceUpdate()
      }
    },

    drop (value) {
      this.watchDrop(value)
    },

    value (files) {
      if (this.files === files) {
        return
      }
      this.files = files
      let oldMaps = this.maps
      this.maps = {}
      for (let i = 0; i < this.files.length; i++) {
        let file = this.files[i]
        this.maps[file.id] = file
      }

      // add, update
      for (let key in this.maps) {
        let newFile = this.maps[key]
        let oldFile = oldMaps[key]
        if (newFile !== oldFile) {
          this.emitFile(newFile, oldFile)
        }
      }

      // delete
      for (let key in oldMaps) {
        if (!this.maps[key]) {
          this.emitFile(undefined, oldMaps[key])
        }
      }
    }
  },

  methods: {
    ...mapMutations('blockstack', ['setFolderRecord']),
    clear () {
      if (this.files.length) {
        let files = this.files
        this.files = []
        this.maps = {}
        this.emitInput()
        for (let i = 0; i < files.length; i++) {
          this.emitFile(undefined, files[i])
        }
      }
      return true
    },

    get (id) {
      if (!id) {
        return false
      }

      if (typeof id === 'object') {
        return this.maps[id.id] || false
      }

      return this.maps[id] || false
    },

    add (_files, index = this.addIndex) {
      let files = _files
      let isArray = files instanceof Array

      if (!isArray) {
        files = [files]
      }

      let addFiles = []
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        if (file instanceof Blob) {
          file = {
            file,
            size: file.size,
            name: file.webkitRelativePath || file.relativePath || file.name || 'unknown',
            type: file.type
          }
        }
        file = {
          fileObject: true,
          size: -1,
          name: 'Filename',
          type: '',
          active: false,
          error: '',
          success: false,
          timeout: this.timeout,
          ...file,
          response: {},
          progress: 0.00,
          speed: 0
        }

        file.headers = {
          ...{
            authorization: `bearer ${this.gaiaToken}`
          },
          ...file.headers ? file.headers : {}
        }

        if (!file.id) {
          file.id = uid()
        }
        if (!file.record) {
          file.record = this.getUploadRecord(file)
          if (file.id !== file.record.id) {
            file.id = file.record.id
          }
        }
        file.postAction = `${this.gaiaPostUrl}${file.id}`

        if (this.emitFilter(file, undefined)) {
          continue
        }

        if (this.maximum > 1 && (addFiles.length + this.files.length) >= this.maximum) {
          break
        }

        addFiles.push(file)

        if (this.maximum === 1) {
          break
        }
      }

      if (!addFiles.length) {
        return false
      }

      if (this.maximum === 1) {
        this.clear()
      }

      let newFiles
      if (index === true || index === 0) {
        newFiles = addFiles.concat(this.files)
      } else if (index) {
        newFiles = this.files.concat([])
        newFiles.splice(index, 0, ...addFiles)
      } else {
        newFiles = this.files.concat(addFiles)
      }

      this.files = newFiles

      for (let i = 0; i < addFiles.length; i++) {
        let file = addFiles[i]
        this.maps[file.id] = file
      }

      this.emitInput()
      for (let i = 0; i < addFiles.length; i++) {
        this.emitFile(addFiles[i], undefined)
      }

      return isArray ? addFiles : addFiles[0]
    },

    addInputFile (el) {
      let files = []
      if (el.files) {
        for (let i = 0; i < el.files.length; i++) {
          let file = el.files[i]
          files.push({
            size: file.size,
            name: file.webkitRelativePath || file.relativePath || file.name,
            type: file.type,
            file
          })
        }
      } else {
        var names = el.value.replace(/\\/g, '/').split('/')
        delete el.__vuex__
        files.push({
          name: names[names.length - 1],
          el
        })
      }
      return this.add(files)
    },

    addDataTransfer (dataTransfer) {
      let files = []
      if (dataTransfer.items && dataTransfer.items.length) {
        let items = []
        for (let i = 0; i < dataTransfer.items.length; i++) {
          let item = dataTransfer.items[i]
          if (item.getAsEntry) {
            item = item.getAsEntry() || item.getAsFile()
          } else if (item.webkitGetAsEntry) {
            item = item.webkitGetAsEntry() || item.getAsFile()
          } else {
            item = item.getAsFile()
          }
          if (item) {
            items.push(item)
          }
        }

        return new Promise((resolve, reject) => {
          let forEach = (i) => {
            let item = items[i]
            if (!item || (this.maximum > 0 && files.length >= this.maximum)) {
              return resolve(this.add(files))
            }
            this.getEntry(item).then(function (results) {
              files.push(...results)
              forEach(i + 1)
            })
          }
          forEach(0)
        })
      }

      if (dataTransfer.files.length) {
        for (let i = 0; i < dataTransfer.files.length; i++) {
          files.push(dataTransfer.files[i])
          if (this.maximum > 0 && files.length >= this.maximum) {
            break
          }
        }
        return Promise.resolve(this.add(files))
      }

      return Promise.resolve([])
    },

    getEntry (entry, path = '') {
      return new Promise((resolve, reject) => {
        if (entry.isFile) {
          entry.file(function (file) {
            resolve([
              {
                size: file.size,
                name: path + file.name,
                type: file.type,
                file
              }
            ])
          })
        } else if (entry.isDirectory && this.dropDirectory) {
          let files = []
          let dirReader = entry.createReader()
          let readEntries = () => {
            dirReader.readEntries((entries) => {
              let forEach = (i) => {
                if ((!entries[i] && i === 0) || (this.maximum > 0 && files.length >= this.maximum)) {
                  return resolve(files)
                }
                if (!entries[i]) {
                  return readEntries()
                }
                this.getEntry(entries[i], path + entry.name + '/').then((results) => {
                  files.push(...results)
                  forEach(i + 1)
                })
              }
              forEach(0)
            })
          }
          readEntries()
        } else {
          resolve([])
        }
      })
    },

    replace (id1, id2) {
      let file1 = this.get(id1)
      let file2 = this.get(id2)
      if (!file1 || !file2 || file1 === file2) {
        return false
      }
      let files = this.files.concat([])
      let index1 = files.indexOf(file1)
      let index2 = files.indexOf(file2)
      if (index1 === -1 || index2 === -1) {
        return false
      }
      files[index1] = file2
      files[index2] = file1
      this.files = files
      this.emitInput()
      return true
    },

    remove (id) {
      let file = this.get(id)
      if (file) {
        if (this.emitFilter(undefined, file)) {
          return false
        }
        let files = this.files.concat([])
        let index = files.indexOf(file)
        if (index === -1) {
          console.error('remove', file)
          return false
        }
        files.splice(index, 1)
        this.files = files
        delete this.maps[file.id]
        this.emitInput()
        this.emitFile(undefined, file)
      }
      return file
    },

    update (id, data) {
      let file = this.get(id)
      if (file) {
        let newFile = {
          ...file,
          ...data
        }
        if (file.fileObject && file.active && !newFile.active && !newFile.error && !newFile.success) {
          newFile.error = 'abort'
        }

        if (this.emitFilter(newFile, file)) {
          return false
        }

        let files = this.files.concat([])
        let index = files.indexOf(file)
        if (index === -1) {
          console.error('update', file)
          return false
        }
        files.splice(index, 1, newFile)
        this.files = files
        delete this.maps[file.id]
        this.maps[newFile.id] = newFile
        this.emitInput()
        this.emitFile(newFile, file)
        return newFile
      }
      return false
    },

    emitFilter (newFile, oldFile) {
      let isPrevent = false
      this.$emit('input-filter', newFile, oldFile, function () {
        isPrevent = true
        return isPrevent
      })
      return isPrevent
    },

    emitFile (newFile, oldFile) {
      this.$emit('input-file', newFile, oldFile)
      if (newFile && newFile.fileObject && newFile.active && (!oldFile || !oldFile.active)) {
        this.uploading++
        this.$nextTick(function () {
          this.upload(newFile)
        })
      } else if ((!newFile || !newFile.fileObject || !newFile.active) && oldFile && oldFile.fileObject && oldFile.active) {
        this.uploading--
      }
      if (this.active && (Boolean(newFile) !== Boolean(oldFile) || newFile.active !== oldFile.active)) {
        this.watchActive(true)
      }
    },

    emitInput () {
      this.$emit('input', this.files)
    },

    upload (id) {
      let file = this.get(id)
      let error = null
      if (!file) {
        error = new Error('not_exists')
      } else if (!file.fileObject) {
        error = new Error('file_object')
      } else if (file.error) {
        error = file.error
      }
      if (error) {
        this.update(file, {
          active: false,
          success: false,
          error: error
        })
      } else if (file.success) {
        this.update(file, {
          active: false,
          success: !file.error
        })
      } else {
        this.uploadWorker.postMessage(file)
      }
    },

    watchActive (active) {
      let file
      let index = 0
      while ((file = this.files[index])) {
        index++
        if (!file.fileObject) {
        } else if (active && !this.destroy) {
          if (this.uploading >= this.thread) {
            break
          }
          if (!file.active && !file.error && !file.success) {
            this.update(file, { active: true })
          }
        } else {
          if (file.active) {
            this.update(file, { active: false })
          }
        }
      }
      if (this.uploading === 0) {
        this.active = false
        this.newlyAddedFolders = {}
      }
    },

    watchDrop (_el) {
      let el = _el
      if (!this.features.drop) {
        return
      }

      if (this.dropElement) {
        try {
          document.removeEventListener('dragenter', this.onDragenter, false)
          document.removeEventListener('dragleave', this.onDragleave, false)
          document.removeEventListener('drop', this.onDocumentDrop, false)
          this.dropElement.removeEventListener('dragover', this.onDragover, false)
          this.dropElement.removeEventListener('drop', this.onDrop, false)
        } catch (e) {
        }
      }

      if (!el) {
        el = false
      } else if (typeof el === 'string') {
        el = document.querySelector(el) || this.$root.$el.querySelector(el)
      } else if (el === true) {
        el = this.$parent.$el
      }

      this.dropElement = el

      if (this.dropElement) {
        document.addEventListener('dragenter', this.onDragenter, false)
        document.addEventListener('dragleave', this.onDragleave, false)
        document.addEventListener('drop', this.onDocumentDrop, false)
        this.dropElement.addEventListener('dragover', this.onDragover, false)
        this.dropElement.addEventListener('drop', this.onDrop, false)
      }
    },

    onDragenter (e) {
      e.preventDefault()
      if (this.dropActive) {
        return
      }
      if (!e.dataTransfer) {
        return
      }
      let dt = e.dataTransfer
      if (dt.files && dt.files.length) {
        this.dropActive = true
      } else if (!dt.types) {
        this.dropActive = true
      } else if (dt.types.indexOf && dt.types.indexOf('Files') !== -1) {
        this.dropActive = true
      } else if (dt.types.contains && dt.types.contains('Files')) {
        this.dropActive = true
      }
    },

    onDragleave (e) {
      e.preventDefault()
      if (!this.dropActive) {
        return
      }
      if (e.target.nodeName === 'HTML' || e.target === e.explicitOriginalTarget || (!e.fromElement && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight))) {
        this.dropActive = false
      }
    },

    onDragover (e) {
      e.preventDefault()
    },

    onDocumentDrop () {
      this.dropActive = false
    },

    onDrop (e) {
      e.preventDefault()
      this.addDataTransfer(e.dataTransfer)
    },

    getFileRecord (folderId, fileName) {
      return [...this.fileRecords.values()].find(fr => fr && fr.folderId === folderId && fr.label === fileName)
    },

    getUploadRecord (fileToUpload) {
      let splits = fileToUpload.name.split('/')
      let folderId = ''
      let today = this.getFormattedDate()
      if (splits.length > 1) {
        let parent = null
        let folderCount = splits.length - 1
        for (let index = 0; index < folderCount; index++) {
          const split = splits[index]
          let newFolderName = split
          if (index === 0) {
            parent = this.newlyAddedFolders[newFolderName]
            if (!parent) {
              let children = [...this.folderRecords.values()].filter(fr => fr && fr.folderId === this.selectedFolder.id)
              if (children.find(f => f.label === newFolderName)) {
                let similarFolders = children.filter(f => f.label.startsWith(newFolderName))
                newFolderName = `${newFolderName} (${similarFolders.length})`
              }
              parent = this.getNewFolder(newFolderName, this.selectedFolder.id)
              this.setFolderRecord(parent)
              this.newlyAddedFolders[split] = parent
            }
          } else {
            let children = [...this.folderRecords.values()].filter(fr => fr && fr.folderId === parent.id)
            let current = children.find(f => f.label === split)
            if (!current) {
              current = this.getNewFolder(newFolderName, parent.id)
              this.setFolderRecord(current)
            }
            parent = current
          }
        }
        if (parent) {
          folderId = parent.id
        }
      } else {
        folderId = this.selectedFolder.id
      }
      let fileType = fileToUpload.type
      if (!fileType) {
        fileType = Mime.lookup(fileToUpload.file.name) || ''
      }
      let fileRecord = this.getFileRecord(this.selectedFolder.id, fileToUpload.file.name)
      if (fileRecord) {
        fileRecord.lastModified = today
        fileRecord.type = fileType
      } else {
        fileRecord = {
          label: fileToUpload.file.name,
          id: fileToUpload.id,
          key: this.getNewPrivateKey(),
          color: '',
          type: fileType,
          created: today,
          lastModified: today,
          opened: today,
          size: fileToUpload.size,
          sizeText: humanStorageSize(fileToUpload.size),
          folderId: folderId,
          star: false,
          ealgo: 'nacl'
        }
      }
      fileRecord.icon = this.getIcon(fileRecord.icon, fileRecord.type)
      return fileRecord
    }
  }
}
</script>
