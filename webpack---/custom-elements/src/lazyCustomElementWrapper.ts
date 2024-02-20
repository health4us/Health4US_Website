import { initLazyCustomElements } from './wixLazyCustomElementRegistry'

initLazyCustomElements()
// since initCustomElements script is loaded before lazyCustomElementWrapper,
// imageClientApi is already loaded at this point
window.resolveExternalsRegistryModule('imageClientApi')
