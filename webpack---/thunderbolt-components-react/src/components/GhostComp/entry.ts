import { GHOST_COMP_TYPE } from '@wix/thunderbolt-commons'
import type { ComponentEntry } from '../../core/common-types'

const entry: ComponentEntry = {
	componentType: GHOST_COMP_TYPE,
	loadComponent: () => import('./GhostComp' /* webpackChunkName: "GhostComp" */),
}

export default entry
