import type { Experiments } from '@wix/thunderbolt-symbols'
import type { IHttpClient } from '@wix/http-client'
import { getMemberPrivacySettings } from '@wix/ambassador-members-v1-member-privacy-settings/http'
import { Candidates as PublicMemberCandidates } from '@wix/ambassador-members-v1-member-privacy-settings/types'
import type { PrivacyNoteType, SiteMembersMasterPageConfig, SiteMembersSiteConfig } from './types'

type SmSettings = SiteMembersMasterPageConfig['smSettings']

// Some sites may not have privacyNoteType set. In that case, default value is CHECKBOX
const getPrivacyNoteType = (smSettings: SmSettings): PrivacyNoteType => {
	const joinCommunityCheckedByDefault = smSettings.joinCommunityCheckedByDefault ?? true
	const privacyNoteType = smSettings.privacyNoteType ?? 'CHECKBOX'
	return joinCommunityCheckedByDefault ? privacyNoteType : 'CHECKBOX'
}

const getJoinCommunityCheckedByDefault = (smSettings: SmSettings) => {
	const privacyNoteType = getPrivacyNoteType(smSettings)
	if (privacyNoteType === 'NOTE') {
		return true
	}
	return smSettings.joinCommunityCheckedByDefault ?? true
}

export const getCommunityOptions = (
	smSettings: SmSettings,
	experiments: Experiments
): { privacyNoteType: PrivacyNoteType; joinCommunityCheckedByDefault: boolean } => {
	return experiments['specs.thunderbolt.enableSignUpPrivacyNoteType']
		? {
				privacyNoteType: getPrivacyNoteType(smSettings),
				joinCommunityCheckedByDefault: getJoinCommunityCheckedByDefault(smSettings),
		  }
		: {
				privacyNoteType: 'CHECKBOX',
				joinCommunityCheckedByDefault: smSettings.joinCommunityCheckedByDefault ?? true,
		  }
}

const fetchMemberPrivacySettings = async (httpClient: IHttpClient, signedInstance: string) => {
	const { data } = await httpClient.request(getMemberPrivacySettings({}), { signedInstance })
	return data.memberPrivacySettings
}

export const createMemberPrivacySettingsService = (httpClient: IHttpClient, getSignedInstance: () => string) => {
	let _canHavePublicMembers: Promise<boolean>

	return {
		canHavePublicMembers: async () => {
			if (_canHavePublicMembers) {
				return _canHavePublicMembers
			}

			_canHavePublicMembers = new Promise(async (resolve) => {
				const memberPrivacySettings = await fetchMemberPrivacySettings(httpClient, getSignedInstance())
				const publicMemberCandidates = memberPrivacySettings?.publicMemberCandidates
				const canAnyoneBePublicMembers = publicMemberCandidates === PublicMemberCandidates.ANYONE
				resolve(canAnyoneBePublicMembers)
			})

			return _canHavePublicMembers
		},
	}
}

export const createCommunityService = (
	memberPrivacySettingsService: ReturnType<typeof createMemberPrivacySettingsService>,
	siteFeatureConfig: Pick<SiteMembersSiteConfig, 'isCommunityInstalled'>,
	experiments: Experiments
) => {
	const { isCommunityInstalled } = siteFeatureConfig

	return {
		canHavePublicCommunity: async () => {
			if (experiments['specs.thunderbolt.shouldUseMemberPrivacySettingsService']) {
				return memberPrivacySettingsService.canHavePublicMembers()
			}

			return isCommunityInstalled
		},
	}
}
