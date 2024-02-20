import type {
	FactoryWithDependencies,
	Identifier,
	Factory,
	NamedIdentifier,
	MultiIdentifier,
	Dependencies,
	OptionalIdentifier,
	TypedIdentifier,
} from './types'
import { ModuleMetadataSymbol } from './symbols'

export const withDependencies = <
	T = any,
	Deps extends ReadonlyArray<Dependencies<any>> = ReadonlyArray<Dependencies<any>>
>(
	dependencies: Deps,
	target: Factory<Deps, T>
): FactoryWithDependencies<T, Deps> => {
	return Object.assign(target.bind(null), { [ModuleMetadataSymbol]: { dependencies } })
}

export const getDependencies = <Deps extends ReadonlyArray<Dependencies<any>>>(
	target: FactoryWithDependencies<any, Deps>
) => target[ModuleMetadataSymbol].dependencies

export const named = <T, Name extends keyof T>(
	identifier: Identifier | TypedIdentifier<T>,
	name: T extends object ? Name : string
): NamedIdentifier<T, Name> => ({
	name: name as Name,
	identifier,
})

export const isNamed = (identifier: any): identifier is NamedIdentifier<any, any> =>
	!!(identifier.name && identifier.identifier)

export const multi = <T extends Identifier | TypedIdentifier<any>>(identifier: T) =>
	({
		identifier,
		multi: true,
	} as T extends TypedIdentifier<infer U> ? MultiIdentifier<U> : MultiIdentifier<any>)

export const isMulti = (identifier: any): identifier is MultiIdentifier<any> =>
	!!(identifier.multi && identifier.identifier)

export const optional = <T>(identifier: Identifier | TypedIdentifier<T>): OptionalIdentifier<T> => ({
	identifier,
	optional: true,
})

export const isOptional = (identifier: any): identifier is OptionalIdentifier<any> =>
	!!(identifier.optional && identifier.identifier)
