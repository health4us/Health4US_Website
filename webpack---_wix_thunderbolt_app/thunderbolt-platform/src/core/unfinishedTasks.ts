import _ from 'lodash'
import type { IUnfinishedTasks, IViewerHandlers } from './types'
import { Experiments } from '@wix/thunderbolt-symbols'

export const UnfinishedTasks = ({ viewerHandlers }: IViewerHandlers, experiments: Experiments): IUnfinishedTasks => {
	const isThunderboltRenderer = process.env.PACKAGE_NAME === 'thunderbolt-renderer'
	const shouldSkipTrackingInCSR = Boolean(experiments['specs.thunderbolt.SkipTrackingUnfinishedTasksInCSR'])

	return {
		add: (name) => {
			if (isThunderboltRenderer || (process.env.browser && shouldSkipTrackingInCSR)) {
				return _.noop
			} else {
				const id = _.uniqueId()
				viewerHandlers.unfinishedTasks.add(id, name)

				return () => {
					viewerHandlers.unfinishedTasks.remove(id)
				}
			}
		},
	}
}
