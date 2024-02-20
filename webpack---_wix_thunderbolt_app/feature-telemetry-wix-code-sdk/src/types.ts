export type TelemetryConsole = Console & { verbose: Console['log'] }
export type Listener = (data: ConsoleMessageData) => void | Promise<void>
export type ConsoleMessageData = {
	logLevel: LogLevel
	args: Array<any>
	stack?: string
}
export type DeveloperConsoleMessageData = Omit<ConsoleMessageData, 'logLevel'> & { logLevel: string }

export enum LogLevel {
	INFO = 'INFO',
	WARN = 'WARNING',
	ERROR = 'ERROR',
	LOG = 'LOG',
	VERBOSE = 'VERBOSE',
	DEBUG = 'DEBUG',
	ASSERT = 'ASSERT',
	DIR = 'DIR',
	TABLE = 'TABLE',
	TRACE = 'TRACE',
}

export interface TelemetryWixCodeSdkWixCodeApi {
	console: TelemetryConsole
}
