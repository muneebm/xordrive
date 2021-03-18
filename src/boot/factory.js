// eslint-disable-next-line import/no-webpack-loader-syntax
import DowloadWorker from 'worker-loader!./downloadWorker'
// eslint-disable-next-line import/no-webpack-loader-syntax
import UploadWorker from 'worker-loader!./uploadWorker'
const workerFactory = {
  createDownloadWorker: () => { return new DowloadWorker() },
  createUploadWorker: () => { return new UploadWorker() }
}
export default ({ Vue }) => {
  Vue.prototype.$wf = workerFactory
}

export { workerFactory }
