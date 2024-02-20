export type RequireContext = ReturnType<typeof require.context>

export function importAll<T>(requireContext: RequireContext): Array<T> {
	return requireContext.keys().map<T>((key) => requireContext(key).default)
}
