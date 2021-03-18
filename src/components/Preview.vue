<template>
  <q-dialog v-model="openPreview" maximized >
    <div :class="{ 'bg-white': !$q.dark.isActive, 'bg-dark': $q.dark.isActive, 'no-scroll': true }">
      <q-list class="full-width" >
        <q-item>
          <q-item-section top>
            <q-item-label class="q-mt-sm ellipsis">{{previewFileName}}</q-item-label>
          </q-item-section>
          <q-item-section top side>
            <q-btn
              @click.native="closePreview"
              class="q-pa-none"
              size="md"
              color="secondary"
              flat
              round
              icon="close"
              v-close-popup />
          </q-item-section>
        </q-item>
      </q-list>
      <q-linear-progress :value="statusDisplay.progress" color="secondary" size="xs"/>
      <div class="flex flex-center fit" >
        <div id='pdf-viewer' v-if="pdfPreview" class="flex flex-center q-mb-xl vertical-middle full-width" style="height: calc(100vh - 200px);">
          <canvas id="the-canvas" />
        </div>
        <q-scroll-area v-if="textPreviewData" class="text-weight-light q-pa-sm fit">
          <p class="overflow-hidden q-mb-xl q-pb-sm" style="word-break:break-all;">
            {{textPreviewData}}
          </p>
        </q-scroll-area>
        <img v-if="imagePreviewUrl" :src="imagePreviewUrl" style="max-height: 80vh; max-width:80vw;"/>
        <video controls v-if="videoPreviewUrl" :src="videoPreviewUrl" class="absolute-center q-mt-sm" style="max-height: 80vh; max-width:80vw;" />
        <audio controls v-if="audioPreviewUrl" :src="audioPreviewUrl"  class="absolute-center q-mt-sm"/>
        <q-spinner  v-if="!previewLoaded"  size="75px" color="secondary" class="absolute-center"/>
        <q-footer v-if="pdfPreview" :class="{ 'bg-white': !$q.dark.isActive, 'bg-dark': $q.dark.isActive, 'flex-center': true, flex: true }">
          <q-pagination
            :color="$q.dark.isActive ? 'secondary' : 'primary'"
            class="q-ma-sm"
            @input="queuePdfPageRender"
            v-model="pdfPagination.page"
            :min="pdfPagination.firstPage"
            :max="pdfPagination.lastPage"
            ellipses
            :max-pages="pdfPagination.maxPages" />
        </q-footer>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import pdfjs from 'pdfjs-dist/webpack'
import { mapActions, mapState } from 'vuex'
export default {
  name: 'Preview',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object
    }
  },
  data () {
    return {
      textPreviewData: null,
      previewLoaded: false,
      previewFileName: '',
      pdfPreview: false,
      audioPreviewUrl: null,
      imagePreviewUrl: null,
      videoPreviewUrl: null,
      openPreview: false,
      preview: {
        file: null,
        username: null,
        worker: null
      },
      pdfPagination: {
        page: 1,
        firstPage: 1,
        lastPage: 1,
        maxPages: 1,
        pageRendering: false,
        pageNumPending: null,
        pdfDoc: null
      }
    }
  },
  computed: {
    ...mapState('blockstack', ['statusDisplay'])
  },
  watch: {
    open: function (value) {
      if (this.item) {
        this.previewFile()
      }
    }
  },
  methods: {
    ...mapActions('blockstack', [
      'getFileContent',
      'downloadFile'
    ]),
    async previewFile () {
      try {
        if (!this.isPreviewSupported(this.item.type)) {
          this.$q.notify({ message: 'Preview is not yet supported for this file', color: 'primary' })
          return
        }
        if (this.username && !this.item.owner) {
          this.item.owner = this.username
        }
        this.preview.file = this.item
        this.item.opened = this.getFormattedDate()
        this.textPreviewData = null
        this.pdfPreview = false
        this.previewFileName = this.item.label
        this.imagePreviewUrl = null
        this.videoPreviewUrl = null
        this.audioPreviewUrl = null
        this.openPreview = true
        this.previewLoaded = false
        let self = this
        let data = await this.getFileContent(self.item)
        if (this.openPreview) {
          if (!data) {
            self.textPreviewData = 'No preview available'
            self.previewLoaded = true
          } else if (self.item.type.startsWith('text') ||
              self.item.type.startsWith('application/xml') ||
              (self.item.type.startsWith('application') &&
              (self.item.type.includes('+xml') || self.item.type.includes('json') || self.item.type.includes('html') || self.item.type.includes('script')))) {
            let dataString = ''
            if (typeof data === 'string') {
              dataString = data
            } else {
              data.forEach(it => { dataString += String.fromCharCode(it) })
            }
            self.textPreviewData = dataString
            self.previewLoaded = true
          } else if (self.item.type.startsWith('application/pdf')) {
            self.pdfPreview = true
            self.pdfPagination.pdfDoc = null
            let thePdf = await pdfjs.getDocument(new Uint8Array(data)).promise
            self.pdfPagination.pdfDoc = thePdf
            self.pdfPagination.lastPage = thePdf.numPages
            self.renderPdfPage(1)
            self.previewLoaded = true
          } else {
            let blob = new File([data], self.item.label, {type: self.item.type})
            let fileReader = new FileReader()
            fileReader.onload = function (evt) {
              self.previewLoaded = true
              if (self.item.type.startsWith('image')) {
                self.imagePreviewUrl = evt.target.result
              } else if (self.item.type.startsWith('video')) {
                self.videoPreviewUrl = evt.target.result
              } else if (self.item.type.startsWith('audio')) {
                self.audioPreviewUrl = evt.target.result
              } else {
                self.textPreviewData = 'Preview is not yet supported for this file, coming soon...'
              }
            }
            fileReader.readAsDataURL(blob)
          }
        }
      } catch (error) {
        this.previewLoaded = true
        console.log(error)
        this.$q.notify({ message: 'Failed to load preview', color: 'negative' })
      }
    },
    renderPdfPage (num) {
      let self = this
      if (!self.pdfPagination.pdfDoc) { return }
      self.pdfPagination.pageRendering = true
      self.pdfPagination.pdfDoc.getPage(num).then((page) => {
        let viewer = document.getElementById('pdf-viewer')
        let canvas = document.getElementById('the-canvas')
        let ctx = canvas.getContext('2d')
        const unscaledViewport = page.getViewport({ scale: 1 })
        const scale = Math.min((viewer.clientHeight / unscaledViewport.height), (viewer.clientWidth / unscaledViewport.width))
        let viewport = page.getViewport({ scale: scale })
        canvas.height = viewport.height
        canvas.width = viewport.width
        let renderContext = {
          canvasContext: ctx,
          viewport: viewport
        }
        var renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
          self.pdfPagination.pageRendering = false
          if (self.pdfPagination.pageNumPending !== null) {
            self.renderPdfPage(self.pdfPagination.pageNumPending)
            self.pdfPagination.pageNumPending = null
          }
        })
      })
    },
    queuePdfPageRender (num) {
      if (this.pdfPagination.pageRendering) {
        this.pdfPagination.pageNumPending = num
      } else {
        this.renderPdfPage(num)
      }
    },
    closePreview () {
      this.openPreview = false
      this.previewLoaded = false
      if (this.pdfPreview) {
        this.pdfPagination.pdfDoc = null
        this.pdfPagination.page = 1
        this.pdfPagination.lastPage = 1
        this.pdfPreview = false
      }
      if (this.preview.worker) {
        this.preview.worker.postMessage({ op: 'stop' })
      }
      this.$emit('update:open', false)
      this.$emit('update:previewFile', null)
    }
  }
}
</script>
<style>
  .pdf-page-canvas {
    display: block;
  }
</style>
