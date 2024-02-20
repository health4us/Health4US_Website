import { ComponentEntry } from '../../core/common-types'

const entry: ComponentEntry = {
	componentType: 'ByocStyles',
	loadComponent: () => import('./ByocStyles' /* webpackChunkName: "ByocStyles" */),
}

export default entry
