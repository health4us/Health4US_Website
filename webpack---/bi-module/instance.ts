import { BiModule } from '@wix/thunderbolt-environment'

export const instance = BiModule()
window.bi = instance
window.bi.wixBiSession.isServerSide = window.clientSideRender ? 0 : 1
window.bi.wixBiSession.isSuccessfulSSR = !window.clientSideRender

if (window.clientSideRender) {
	window.bi.wixBiSession.fallbackReason = window.santaRenderingError?.errorInfo
}
/**
 *  This code runs inline in the head response. here: https://github.com/wix-private/thunderbolt/blob/fcb9b3af0b177c5520e94867e0e072050eca6f78/packages/thunderbolt-app/src/templates/main-head.ejs#L127
 */
instance.sendBeat(1, 'Init')
