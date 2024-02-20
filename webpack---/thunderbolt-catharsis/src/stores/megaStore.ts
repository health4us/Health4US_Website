import { WithOverrides } from '../nodeFactory/compNodeUtils'
import { IStore, Subscriber, IChildStores, Unsubscribe } from './megaStore.types'

const subscriptions = new WeakMap<IStore, Map<string, Set<Subscriber>>>()
const childStores = new WeakMap<IStore, Map<string, IStore>>()
const ALL = '***ALL***'

const invokeSubscribers = (store: IStore, id: string): void => {
	const mySubscriptions = subscriptions.get(store)!
	const mySubscribers = mySubscriptions.get(id)
	const allSubscribers = mySubscriptions.get(ALL)
	if (mySubscribers) {
		const value = store.getById(id)
		mySubscribers.forEach((callback) => callback(id, value))
	}
	if (allSubscribers) {
		const value = store.getById(id)
		allSubscribers.forEach((callback) => callback(id, value))
	}

	const children = childStores.get(store)
	if (children) {
		children.forEach((childStore) => {
			invokeSubscribers(childStore, id)
		})
	}
}

export class PrivateMegaStore<TStore extends IStore> implements IStore, IChildStores<TStore> {
	private readonly myStore: Map<string, any> = new Map()

	constructor(private readonly parentStore?: TStore) {
		childStores.set(this, new Map())
	}

	getById<T = unknown>(id: string): T {
		const parentValue = this.parentStore?.getById(id)
		const myValue = this.myStore.get(id)
		return parentValue ? { ...parentValue, ...myValue } : (myValue as T)
	}

	getByIdWithOverrides<T>(id: string): WithOverrides<T> {
		const myChildStores = childStores.get(this)
		const myValue: T = this.myStore.get(id)

		if (typeof myValue === 'undefined') {
			return myValue as WithOverrides<T>
		}

		const allValues = {
			'': myValue,
		} as WithOverrides<T>

		if (myChildStores) {
			for (const [childId, childStore] of myChildStores) {
				const childValue = (childStore as PrivateMegaStore<TStore>).myStore.get(id)
				if (typeof childValue !== 'undefined') {
					allValues[childId] = childValue
				}
			}
		}

		return allValues
	}

	getChildStore(contextId: string): TStore {
		let childStore = childStores.get(this)?.get(contextId) as TStore
		if (!childStore) {
			// @ts-ignore
			childStore = new this.constructor(this) as TStore
			childStores.get(this)!.set(contextId, childStore)
		}
		return childStore
	}

	removeById(id: string): void {
		this.myStore.delete(id)
	}

	updateById<T = unknown>(id: string, data: T): void {
		// this is temp solution until we split the store to multiple stores (structure, props, css, etc)
		// and decide the how to "merge" the data
		// css store should override the data, but props store should merge the data
		// we need to refine each store's behavior
		if (shouldNotAssignValue(data)) {
			this.myStore.set(id, data)
		} else {
			this.myStore.set(id, this.myStore.has(id) ? { ...this.myStore.get(id), ...data } : data)
		}
	}
}

const shouldNotAssignValue = (data: unknown): boolean =>
	data === null ||
	data === undefined ||
	typeof data === 'string' ||
	typeof data === 'number' ||
	data instanceof Set ||
	Array.isArray(data)

export class MegaStore extends PrivateMegaStore<MegaStore> {}

export class MegaStoreWithSubscriptions extends PrivateMegaStore<MegaStoreWithSubscriptions> {
	constructor(parentStore?: MegaStoreWithSubscriptions) {
		super(parentStore)
		subscriptions.set(this, new Map())
	}

	subscribeById(id: string, callback: Subscriber): Unsubscribe {
		const mySubscriptions = subscriptions.get(this)!
		if (!mySubscriptions.has(id)) {
			mySubscriptions.set(id, new Set())
		}
		mySubscriptions.get(id)!.add(callback)
		return () => {
			mySubscriptions.get(id)!.delete(callback)
		}
	}

	removeById(id: string): void {
		super.removeById(id)
		invokeSubscribers(this, id)
	}

	updateById<T = unknown>(id: string, data: T): void {
		super.updateById(id, data)
		invokeSubscribers(this, id)
	}

	subscribe(callback: Subscriber): Unsubscribe {
		return this.subscribeById(ALL, callback)
	}
}
