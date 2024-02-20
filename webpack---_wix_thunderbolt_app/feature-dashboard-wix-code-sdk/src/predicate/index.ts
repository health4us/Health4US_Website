import { PlatformEnvData } from '@wix/thunderbolt-symbols'

export const isDashboardWixCodeSdkRequired = ({ platformEnvData }: { platformEnvData: PlatformEnvData }) => {
	if (process.env.PACKAGE_NAME === 'thunderbolt-ds') {
		return true
	}

	const url = new URL(platformEnvData.location.rawUrl)
	const inBizMgr = url.searchParams.get('inBizMgr')
	return inBizMgr === 'true'
}
