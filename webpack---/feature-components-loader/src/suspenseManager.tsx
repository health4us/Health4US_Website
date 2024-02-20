import { createPromise } from '@wix/thunderbolt-commons'
import React, { Suspense, useEffect, useMemo } from 'react'
import type { WithHydrateWrapper } from './types'

const EmptyDiv = () => <div />
const hydrated = new Set()

function SuspenseInner(props: any) {
	props.api.read()
	return props.children
}
function wrapPromise(promise: Promise<any>) {
	let status = 'pending'
	let response: any

	const suspender = promise.then(
		(res: any) => {
			status = 'success'
			response = res
		},
		(err: any) => {
			status = 'error'
			response = err
		}
	)

	const read = () => {
		switch (status) {
			case 'pending':
				throw suspender
			case 'error':
				throw response
			default:
				return response
		}
	}

	return { read, status }
}

const createIntersectionWrapper = () => {
	const { resolver, promise } = createPromise()
	const api = wrapPromise(promise)
	return { api, promise, resolver }
}

export const createHydrateWrapper = () => {
	const createObserver = (compId: string, target: Element, cb: Function) => {
		if (!target) {
			// If there was a mismatch we want to hydrate immediatly and not wait for intersection
			// as the target element might be null and promise will remain hanging
			cb()
			return
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && entry.intersectionRatio > 0) {
					observer.disconnect()
					cb()
				}
			},
			{ root: null }
		)
		observer.observe(target)
		return observer
	}

	// called once per comp type when the component is loaded to the store
	const WithHydrateWrapper: WithHydrateWrapper = ({ Comp }) => {
		// called for each render
		const ViewportHydrator = (props: any) => {
			const targetElement = useMemo(() => {
				if (hydrated.has(props.id)) {
					return null
				}
				const elem = document.getElementById(props.id)
				if (!elem) {
					// If first SSR render failed and we got to client fallback
					// there will be no targetElement, and hydrated would be empty.
					// problem is if a element with same id was rendered in the dom, in previous render as we get stale targetElement.
					hydrated.add(props.id)
				}
				return elem
			}, [props.id])

			const suspender = useMemo(() => {
				const { api, resolver } = createIntersectionWrapper()
				// To keep <Suspense> in output we resolve the promise so nothing is pending when gets rendered.
				if (hydrated.has(props.id)) {
					resolver()
				}
				return { api, resolver }
			}, [props.id])

			useEffect(() => {
				if (!targetElement) {
					return
				}
				const obs = createObserver(props.id, targetElement, () => {
					hydrated.add(props.id)
					suspender.resolver()
				})
				return () => {
					obs?.disconnect()
				}
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [])

			if (!targetElement) {
				return <Comp {...props} />
			}

			return (
				<Suspense fallback={EmptyDiv()}>
					<SuspenseInner api={suspender.api}>
						<Comp {...props} />
					</SuspenseInner>
				</Suspense>
			)
		}

		return ViewportHydrator
	}

	return {
		WithHydrateWrapper,
	}
}
