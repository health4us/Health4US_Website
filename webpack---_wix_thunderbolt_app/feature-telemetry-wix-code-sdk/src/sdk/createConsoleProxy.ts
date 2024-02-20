import type { TelemetryConsole, Listener, ConsoleMessageData } from '../types'
import { LogLevel } from '../types'
import { isError } from 'lodash'
import { normalizeCollection } from '../formatters/normalizeCollection'

const supportedConsoleMethods = {
	info: LogLevel.INFO,
	warn: LogLevel.WARN,
	error: LogLevel.ERROR,
	log: LogLevel.LOG,
	debug: LogLevel.DEBUG,
	assert: LogLevel.ASSERT,
	dir: LogLevel.DIR,
	table: LogLevel.TABLE,
	trace: LogLevel.TRACE,
}

const callbackRegistrar = () => {
	const listeners = new Set<Listener>()

	const call = (data: ConsoleMessageData): void => {
		listeners.forEach((listenerFn) => listenerFn(data))
	}

	const register = (cb: Listener) => {
		listeners.add(cb)
		return () => listeners.delete(cb)
	}

	return { register, call }
}

const wrapConsoleMethod = (
	consoleInstance: Console,
	logLevel: LogLevel,
	key: keyof Console,
	onLog: (data: ConsoleMessageData) => void
) => (...args: Array<any>) => {
	const stack = isError(args[0]) ? args[0].stack : new Error().stack
	const normalizedArgs = normalizeCollection(args, [], 0)
	const messageData: ConsoleMessageData = {
		logLevel,
		args: normalizedArgs,
		stack,
	}
	onLog(messageData)
	;(consoleInstance[key] as Function)(...args)
}

export const createConsoleProxy = (
	consoleInstance: Console
): { onLog: (cb: Listener) => () => void; proxy: TelemetryConsole } => {
	const { register: onLog, call: callOnLogListeners } = callbackRegistrar()

	const consoleEntries = Object.entries(console)
	const boundConsoleMethods = Object.fromEntries(
		consoleEntries.map(([key, value]) => {
			if (typeof value === 'function') {
				return [key, value.bind(consoleInstance)]
			} else {
				return [key, value]
			}
		})
	)

	const proxy: TelemetryConsole = {
		...(boundConsoleMethods as Console),
		verbose: consoleInstance.log.bind(consoleInstance),
	}

	for (const method in supportedConsoleMethods) {
		if (supportedConsoleMethods.hasOwnProperty(method) && consoleInstance.hasOwnProperty(method)) {
			const key = method as keyof typeof supportedConsoleMethods

			const consoleMethodAlternative = wrapConsoleMethod(
				consoleInstance,
				supportedConsoleMethods[key],
				key,
				callOnLogListeners
			)

			proxy[key] = consoleMethodAlternative
		}
	}

	proxy.verbose = wrapConsoleMethod(consoleInstance, LogLevel.VERBOSE, 'log', callOnLogListeners)

	return { onLog, proxy }
}
