import { getEditorSDKurl } from '@wix/platform-editor-sdk/lib/loader'
import { EditorSDKModule, EditorSDK, ApplicationContextOptions } from '@wix/platform-editor-sdk'
import { Experiments } from '@wix/thunderbolt-symbols'

export interface InitEditorSdkOptions {
	loadEditorScript: (sdkScriptSrc: string) => Promise<unknown>
	sendMessageToEditor: (ev: MessageEvent) => void
	getWindowUrl: () => string
	experiments: Experiments
}

export const getMainFrameUrlParams = (windowUrl: string) => {
	const params = new URL(windowUrl).searchParams
	const sdkVersion = params.get('sdkVersion')
	const appDefinitionId = params.get('appDefinitionId')
	const applicationIdParam = params.get('applicationId')

	return {
		sdkVersion,
		appDefinitionId,
		applicationIdParam,
	}
}

export const initEditorSdk = async (options: InitEditorSdkOptions): Promise<EditorSDK> => {
	const { sendMessageToEditor, loadEditorScript, getWindowUrl, experiments } = options
	const channel = new MessageChannel()

	const windowUrl = getWindowUrl()

	const { sdkVersion, appDefinitionId, applicationIdParam } = getMainFrameUrlParams(windowUrl)

	if (typeof appDefinitionId !== 'string') {
		throw new Error('appDefinitionId should be string')
	}

	if (!sdkVersion) {
		throw new Error('Could not find sdkVersion')
	}

	const applicationIdAsNumber = Number(applicationIdParam)
	const applicationId =
		!experiments['specs.thunderbolt.deprecateAppId'] && applicationIdParam && !isNaN(applicationIdAsNumber)
			? applicationIdAsNumber
			: undefined

	const contextOptions: ApplicationContextOptions = {
		appDefinitionId,
		applicationId,
	}

	channel.port1.onmessage = (ev) => {
		sendMessageToEditor(ev)
	}

	const sdkScriptSrc = getEditorSDKurl(windowUrl)

	await loadEditorScript(sdkScriptSrc)

	await editorSDK.__initWithTarget(channel.port2, [], '')

	return editorSDK.getBoundedSDK(contextOptions)
}

declare const editorSDK: EditorSDKModule
