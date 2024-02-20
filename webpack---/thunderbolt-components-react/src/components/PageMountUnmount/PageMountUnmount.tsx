import React, { Fragment, ComponentType, ReactNode, useEffect, useLayoutEffect, ReactElement } from 'react'

const useIsomorphicLayoutEffect = process.env.browser ? useLayoutEffect : () => {}

export type PageMountUnmountProps = {
	children: () => ReactNode
	pageDidMount: (isMounted: boolean) => void
	codeEmbedsCallback?: Function
	ComponentCss?: ReactElement
}

const PageMountUnmount: ComponentType<PageMountUnmountProps> = ({
	children,
	pageDidMount = () => {},
	codeEmbedsCallback,
	ComponentCss,
}) => {
	useEffect(() => {
		pageDidMount(true)
		return () => pageDidMount(false)
	}, [pageDidMount])

	useIsomorphicLayoutEffect(() => {
		codeEmbedsCallback?.()
		return undefined // destroy function
	})
	return (
		<Fragment>
			{ComponentCss}
			{children()}
		</Fragment>
	)
}

export default PageMountUnmount
