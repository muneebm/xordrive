import { UserSession } from 'blockstack'
import { secretbox } from 'tweetnacl'
import { decodeBase64 } from 'tweetnacl-util'
const DEFAULT_CORE_NODE = 'https://core.blockstack.org'
const NAME_LOOKUP_PATH = '/v1/names'
var session = null
var downloadHandler = null
const chunkDefaultOptions = {
  minSize: 3000000,
  maxActive: 3,
  maxRetries: 3
}
const prefix = 'multifile:'
var getFileUrlOptions = null
onmessage = function (e) {
  try {
    do {
      if (!e || !e.data || !(e.data instanceof Object)) {
        console.log('Invalid download request')
        break
      }
      if (e.data.appConfig && e.data.sessionOptions) {
        getFileUrlOptions = {
          app: e.data.appConfig.appDomain
        }
        if (!(e.data.sessionOptions.sessionData) || !(e.data.sessionOptions.sessionData.userData)) {
          getFileUrlOptions.zoneFileLookupURL = `${DEFAULT_CORE_NODE}${NAME_LOOKUP_PATH}`
        }
        let store = new InstanceDataStore(e.data.sessionOptions)
        session = new UserSession({
          appConfig: e.data.appConfig,
          sessionStore: store
        })
        break
      }
      if (e.data.op === 'stop' && downloadHandler) {
        downloadHandler.stop()
        downloadHandler = null
        break
      }
      const fileRecord = e.data.fileRecord
      const options = e.data.options
      downloadHandler = new ChunkDownloadHandler(fileRecord, { ...options, ...chunkDefaultOptions })
      downloadHandler.download()
    } while (false)
  } catch (error) {
    console.log(error)
  }
}

class InstanceDataStore {
  constructor (sessionData) {
    this.setSessionData(sessionData)
  }

  getSessionData () {
    return this.sessionData
  }

  setSessionData (session) {
    this.sessionData = session
    return true
  }

  deleteSessionData () {
    this.setSessionData({})
    return true
  }
}

class ChunkDownloadHandler {
  constructor (fileRecord, options) {
    this.fileRecord = fileRecord
    this.options = options
  }

  get maxRetries () {
    return parseInt(this.options.maxRetries)
  }

  get maxActiveChunks () {
    return parseInt(this.options.maxActive)
  }

  get headers () {
    return this.options.headers || {}
  }

  get username () {
    return this.fileRecord.owner || ''
  }

  get isEncrypted () {
    return this.fileRecord.ealgo === 'nacl' || !(this.fileRecord.shared && this.fileRecord.shared.includes('public'))
  }

  get progress () {
    const completedProgress = (this.chunksDownloaded.length / this.chunks.length)
    const downloadingProgress = this.chunksDownloading.reduce((progress, chunk) => {
      return progress + (chunk.progress / this.chunks.length)
    }, 0)
    return Math.min(completedProgress + downloadingProgress, 1)
  }

  get chunksToDownload () {
    return this.chunks.filter(chunk => {
      return !chunk.active && !chunk.downloaded
    })
  }

  get hasChunksToDownload () {
    return this.chunksToDownload.length > 0
  }

  get chunksDownloading () {
    return this.chunks.filter(chunk => {
      return chunk.active && !chunk.downloaded
    })
  }

  get chunksDownloaded () {
    return this.chunks.filter(chunk => {
      return !!chunk.downloaded
    })
  }

  createRequest (options) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', options.getAction, true)
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        xhr.setRequestHeader(key, options.headers[key])
      })
    }
    return xhr
  }

  async createChunks () {
    this.chunks = []
    if (this.fileRecord.ealgo === 'nacl') {
      let chunkCount = this.fileRecord.chunks || 1
      for (let index = 0; index < chunkCount; index++) {
        this.chunks.push({
          active: false,
          retries: this.maxRetries,
          getAction: await this.getFileUrl(`${this.fileRecord.id}_${index}`)
        })
      }
    } else {
      let fileContent = await this.getFileContent()
      if (typeof fileContent === 'string') {
        const fileString = String(fileContent)
        if (fileString.length > 10 && fileString.substring(0, 10) === prefix) {
          let fileNames = fileString.substring(10, fileString.length).split(',')
          fileNames = fileNames.filter(e => e)
          for (let index = 0; index < fileNames.length; index++) {
            const fileName = fileNames[index]
            this.chunks.push({
              active: false,
              retries: this.maxRetries,
              getAction: await this.getFileUrl(fileName)
            })
          }
        } else {
          this.chunks.push({
            active: false,
            retries: this.maxRetries,
            getAction: await this.getFileUrl(this.fileRecord.id),
            downloaded: true,
            response: fileContent
          })
        }
      } else {
        this.chunks.push({
          active: false,
          retries: this.maxRetries,
          getAction: await this.getFileUrl(this.fileRecord.id),
          downloaded: true,
          response: fileContent
        })
      }
    }
  }

  async getFileUrl (path) {
    let fileUrl = ''
    try {
      getFileUrlOptions.username = this.username
      fileUrl = await session.getFileUrl(path, getFileUrlOptions)
    } catch (error) {
      console.log(error)
    }
    return fileUrl
  }

  async getFileContent () {
    let fileContent = null
    try {
      fileContent = await session.getFile(this.fileRecord.id, { username: this.username, decrypt: !this.fileRecord.key && this.isEncrypted })
      if (this.fileRecord.key && this.isEncrypted) {
        fileContent = session.decryptContent(fileContent, { privateKey: this.fileRecord.key })
      }
    } catch (error) {
      console.log(error)
    }
    return fileContent
  }

  updateFileProgress () {
    postMessage({
      id: this.fileRecord.id,
      active: this.fileRecord.active,
      progress: this.progress})
  }

  pause () {
    this.fileRecord.active = false
    this.stopChunks()
  }

  stop () {
    this.fileRecord.error = new Error('stopped')
    this.stopChunks()
    this.finish()
  }

  stopChunks () {
    this.chunksDownloading.forEach(chunk => {
      chunk.xhr.abort()
      chunk.active = false
    })
  }

  resume () {
    this.fileRecord.active = true
    this.startChunking()
  }

  async download () {
    this.fileRecord.active = true
    await this.createChunks()
    this.startChunking()
  }

  startChunking () {
    for (let i = 0; i < this.maxActiveChunks; i++) {
      this.downloadNextChunk()
    }
  }

  downloadNextChunk () {
    if (this.fileRecord.active) {
      if (this.hasChunksToDownload) {
        return this.downloadChunk(this.chunksToDownload[0])
      }

      if (this.chunksDownloading.length === 0) {
        return this.finish()
      }
    }
  }

  downloadChunk (chunk) {
    chunk.progress = 0
    chunk.active = true
    this.updateFileProgress()
    let xhr = this.createRequest({
      getAction: chunk.getAction
    })
    xhr.responseType = this.fileRecord.ealgo !== 'nacl' && this.isEncrypted ? 'text' : 'arraybuffer'
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        chunk.progress = e.loaded / e.total
        this.updateFileProgress()
      }
    }
    let fn = (e) => {
      switch (e.type) {
        case 'timeout':
        case 'abort':
          chunk.error = e.type
          break
        case 'error':
          if (!xhr.status) {
            chunk.error = 'network'
          } else if (xhr.status >= 500) {
            chunk.error = 'server'
          } else if (xhr.status >= 400) {
            chunk.error = 'denied'
          }
          break
        default:
          if (xhr.status >= 500) {
            chunk.error = 'server'
          } else if (xhr.status >= 400) {
            chunk.error = 'denied'
          } else {
            chunk.progress = 1
          }
      }
      chunk.active = false
      chunk.downloaded = !chunk.error
      if (!chunk.downloaded) {
        if (chunk.retries-- <= 0) {
          this.fileRecord.error = chunk.error
          this.stopChunks()
        }
      } else {
        if (xhr && xhr.response) {
          if (this.fileRecord.ealgo === 'nacl') {
            let response = new Uint8Array(xhr.response)
            chunk.response = this.isEncrypted ? this.decrypt(response, this.fileRecord.key) : xhr.response
          } else {
            chunk.response = this.isEncrypted ? session.decryptContent(xhr.response, { privateKey: this.fileRecord.key }) : xhr.response
          }
          postMessage({
            id: this.fileRecord.id,
            active: this.fileRecord.active,
            data: chunk.response})
        }
        this.downloadNextChunk()
      }
    }
    xhr.onload = fn
    xhr.onerror = fn
    xhr.onabort = fn
    xhr.ontimeout = fn
    if (this.timeout) {
      xhr.timeout = this.timeout
    }
    chunk.xhr = xhr
    chunk.xhr.send('')
  }

  decrypt (messageWithNonce, key) {
    const keyUint8Array = decodeBase64(key)
    const messageWithNonceAsUint8Array = messageWithNonce
    const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength)
    const message = messageWithNonceAsUint8Array.slice(
      secretbox.nonceLength,
      messageWithNonce.length
    )
    const decrypted = secretbox.open(message, nonce, keyUint8Array)
    if (!decrypted) {
      throw new Error('Could not decrypt data')
    }
    return decrypted
  }

  appendBuffer (buffer1, buffer2) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
    tmp.set(new Uint8Array(buffer1), 0)
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
    return tmp.buffer
  }

  finish () {
    this.updateFileProgress()
    this.fileRecord.active = false
    var data = null
    if (!this.fileRecord.error) {
      data = this.chunks[0].response
      this.chunks.forEach((chunk, index) => {
        if (index !== 0) {
          data = this.appendBuffer(data, chunk.response)
        }
      })
    }
    postMessage({
      id: this.fileRecord.id,
      active: this.fileRecord.active,
      success: !this.fileRecord.error,
      data: data
    })
  }
}
