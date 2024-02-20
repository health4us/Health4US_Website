import { Identifier, TypedIdentifier } from './types'

export const ModuleMetadataSymbol = Symbol.for('module metadata')

export const createIdentifier = <T>(sym: Identifier): TypedIdentifier<T> => sym as TypedIdentifier<T>
