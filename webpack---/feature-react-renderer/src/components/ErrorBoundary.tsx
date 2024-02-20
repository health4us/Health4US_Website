import React, { Fragment, useContext } from 'react'
import type { ILogger } from '@wix/thunderbolt-symbols'
import type { RendererProps } from '../types'
import Context from './AppContext'

type Props = {
	id: string
	logger: ILogger
	Component?: React.ComponentType<any>
	compClassType: string
	sentryDsn?: string
	deleted?: boolean
	children: React.ReactNode
}

type State = {
	hasError: boolean
}

export class MissingCompError extends Error {
	constructor(componentType: string) {
		super(`${componentType} Component is missing from component library`)

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor)
		} else {
			this.stack = new Error(this.message).stack
		}
	}
}

export class MissingCompStructureError extends Error {
	constructor(compId: string) {
		super(`${compId} is missing from structure`)

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor)
		} else {
			this.stack = new Error(this.message).stack
		}
	}
}

export const DeadComp = ({ id }: { id: string }) => {
	const { BaseComponent }: RendererProps = useContext(Context)
	return <BaseComponent data-dead-comp={true} id={id} />
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)
		const { Component, compClassType, id, deleted } = props
		if (deleted) {
			this.state = { hasError: false }
			return
		}
		this.state = { hasError: !Component || !compClassType }
		if (!compClassType) {
			this.captureError(new MissingCompStructureError(id))
		} else if (!Component) {
			this.captureError(new MissingCompError(compClassType))
		}
	}

	static getDerivedStateFromError() {
		return { hasError: true }
	}

	private captureError(error: Error, componentStack: string = '') {
		this.props.logger.captureError(error, {
			tags: {
				feature: 'feature-react-renderer',
				componentType: this.props.compClassType,
				compId: this.props.id,
				componentName: 'dead-component',
			},
			extra: { componentStack },
		})
	}

	componentDidCatch(error: Error, { componentStack }: React.ErrorInfo) {
		this.captureError(error, componentStack)
	}

	render() {
		return this.state.hasError ? <DeadComp id={this.props.id} /> : <Fragment>{this.props.children}</Fragment>
	}
}
