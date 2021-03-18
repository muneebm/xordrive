import { secretbox, randomBytes } from 'tweetnacl'
import { decodeBase64 } from 'tweetnacl-util'
const chunkDefaultOptions = {
  minSize: 5000000,
  maxActive: 1,
  maxRetries: 3
}
const newNonce = () => randomBytes(secretbox.nonceLength)
const arrayBufferFromBlob = (blob) => {
  return (new FileReaderSync()).readAsArrayBuffer(blob)
}
const encrypt = (messageArrayBuffer, key) => {
  const keyUint8Array = decodeBase64(key)
  const nonce = newNonce()
  const box = secretbox(messageArrayBuffer, nonce, keyUint8Array)
  const fullMessage = new Uint8Array(nonce.length + box.length)
  fullMessage.set(nonce)
  fullMessage.set(box, nonce.length)
  return fullMessage
}

export const decrypt = (messageWithNonce, key) => {
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

onmessage = function (e) {
  try {
    do {
      if (!e || !e.data || !(e.data instanceof Object)) {
        console.log('Invalid upload request')
        break
      }
      (new ChunkUploadHandler(e.data, chunkDefaultOptions)).upload()
    } while (false)
  } catch (error) {
    console.log(error)
  }
}

class ChunkUploadHandler {
  constructor (file, options) {
    this.file = file
    this.options = options
  }

  get maxRetries () {
    return parseInt(this.options.maxRetries)
  }

  get maxActiveChunks () {
    return parseInt(this.options.maxActive)
  }

  get chunkSize () {
    return parseInt(this.options.minSize)
  }

  get fileType () {
    return this.file.type
  }

  get fileSize () {
    return this.file.size
  }

  get fileName () {
    return this.file.name
  }

  get action () {
    return this.file.postAction || null
  }

  get headers () {
    return this.file.headers || {}
  }

  get readyToUpload () {
    return !!this.chunks
  }

  get progress () {
    const completedProgress = (this.chunksUploaded.length / this.chunks.length)
    const uploadingProgress = this.chunksUploading.reduce((progress, chunk) => {
      return progress + (chunk.progress / this.chunks.length)
    }, 0)
    return Math.min(completedProgress + uploadingProgress, 1)
  }

  get chunksToUpload () {
    return this.chunks.filter(chunk => {
      return !chunk.active && !chunk.uploaded
    })
  }

  get hasChunksToUpload () {
    return this.chunksToUpload.length > 0
  }

  get chunksUploading () {
    return this.chunks.filter(chunk => {
      return chunk.active && !chunk.uploaded
    })
  }

  get chunksUploaded () {
    return this.chunks.filter(chunk => {
      return !!chunk.uploaded
    })
  }

  createRequest (options) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', options.postAction)
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        xhr.setRequestHeader(key, options.headers[key])
      })
    }
    return xhr
  }

  createChunks () {
    try {
      this.chunks = []
      let start = 0
      let end = this.chunkSize < this.fileSize ? this.chunkSize : this.fileSize
      let chunkCount = 0
      while (start < this.fileSize) {
        this.chunks.push({
          blob: this.file.file.slice(start, end),
          active: false,
          retries: this.maxRetries,
          postAction: `${this.action}_${chunkCount}`
        })
        start = end
        end = start + this.chunkSize
        chunkCount++
      }
      this.file.record.chunks = this.chunks.length
      postMessage({
        id: this.file.id,
        record: this.file.record
      })
    } catch (error) {
      console.log(error)
    }
  }

  updateFileProgress () {
    this.file.progress = this.progress
    postMessage({
      id: this.file.id,
      progress: this.progress})
  }

  pause () {
    this.file.active = false
    this.stopChunks()
  }

  stopChunks () {
    this.chunksUploading.forEach(chunk => {
      chunk.xhr.abort()
      chunk.active = false
    })
    postMessage({
      id: this.file.id,
      success: false,
      error: this.file.error
    })
  }

  resume () {
    this.file.active = true
    this.startChunking()
  }

  upload () {
    this.createChunks()
    this.startChunking()
  }

  startChunking () {
    for (let i = 0; i < this.maxActiveChunks; i++) {
      this.uploadNextChunk()
    }
  }

  uploadNextChunk () {
    if (this.file.active) {
      if (this.hasChunksToUpload && this.chunksUploading < this.maxActiveChunks) {
        return this.uploadChunk(this.chunksToUpload[0])
      }

      if (this.chunksUploading.length === 0) {
        return this.finish()
      }
    }
  }

  uploadChunk (chunk) {
    chunk.progress = 0
    chunk.active = true
    this.updateFileProgress()
    let xhr = this.createRequest({
      headers: this.headers,
      postAction: chunk.postAction
    })
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        chunk.progress = e.loaded / e.total
        this.updateFileProgress()
      }
    }
    let fn = (e) => {
      chunk.error = null
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
      if (xhr.responseText) {
        chunk.response = xhr.responseText
      }
      chunk.active = false
      chunk.uploaded = !chunk.error
      if (!chunk.uploaded && chunk.retries-- <= 0) {
        this.file.error = chunk.error
        this.stopChunks()
      } else {
        this.uploadNextChunk()
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
    let arrayBuffer = chunk.blob
    if (arrayBuffer instanceof Blob) {
      arrayBuffer = arrayBufferFromBlob(chunk.blob)
    }
    let messageUint8Array = new Uint8Array(arrayBuffer)
    if (this.file.record.key) {
      messageUint8Array = encrypt(messageUint8Array, this.file.record.key)
    }
    xhr.send(messageUint8Array)
  }

  finish () {
    this.updateFileProgress()
    postMessage({
      id: this.file.id,
      success: !this.file.error
    })
  }
}
