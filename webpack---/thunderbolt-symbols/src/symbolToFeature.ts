import { IPageDidUnmountHandler } from './types'

export const RegisterToUnmountSym = Symbol('RegisterToUnmount')

export type RegisterToUnmount = {
	registerToPageDidUnmount: (pageDidUnmount: IPageDidUnmountHandler['pageDidUnmount']) => void
}
