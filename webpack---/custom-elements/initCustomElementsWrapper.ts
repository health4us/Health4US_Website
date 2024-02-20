import { initCustomElements } from '@wix/thunderbolt-custom-elements'

const { experiments, media, requestUrl } = window.viewerModel
initCustomElements({ experiments, media, requestUrl })
