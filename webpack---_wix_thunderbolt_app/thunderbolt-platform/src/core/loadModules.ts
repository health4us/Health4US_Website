// wix code and blocks viewer apps expects regeneratorRuntime to be defined :/
// https://wix.slack.com/archives/CKDB50KE2/p1655630884212889
// https://wix.slack.com/archives/CGJREGM7B/p1653330082949059
import 'regenerator-runtime/runtime'

import _ from 'lodash'
import { amdLoaderFactory } from '@wix/thunderbolt-renderer-utils'
import type { ScriptCache, ModuleLoader } from '@wix/thunderbolt-renderer-utils'

declare let self: DedicatedWorkerGlobalScope & {
	define?: ((nameOrDependencies: string | Array<string>, dependenciesOrFactory: Array<string> | Function, factory?: Function) => void) & { amd?: boolean }
}

export default function ({ scriptsCache }: { scriptsCache: ScriptCache }): ModuleLoader {
	const defaultDependencies: { [name: string]: unknown } = {
		lodash: _,
		_,
		'wix-data': { default: { dsn: 'https://b58591105c1c42be95f1e7a3d5b3755e@sentry.io/286440' } },
	}

	return amdLoaderFactory({ scriptsCache, defaultDependencies, globalThis: self, fetch })
}
