import { ComponentEntry } from '../../core/common-types'

const entry: ComponentEntry = {
	componentType: 'FontFaces',
	loadComponent: () => import('./FontFaces' /* webpackChunkName: "FontFaces" */),
}

export default entry
