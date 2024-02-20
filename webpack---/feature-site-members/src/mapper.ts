import type { IStatus, MemberDetails, Member } from './types'
import { Role, Status } from './types'

// To see if reducing the bundle would help here

const statusToIStatus: Partial<Record<Status, IStatus>> = {
	[Status.APPROVED]: 'ACTIVE',
	[Status.PENDING]: 'PENDING',
}

const toStatus = (status?: Status) => {
	return status ? statusToIStatus[status] ?? 'APPLICANT' : 'APPLICANT'
}

export const toMemberDetails = ({ member, role }: { member?: Member; role?: Role }): MemberDetails => ({
	id: member?.id ?? '',
	contactId: member?.contactId ?? '',
	loginEmail: member?.loginEmail ?? '',
	imageUrl: member?.profile?.photo?.url ?? '',
	nickname: member?.profile?.nickname ?? '',
	profilePrivacyStatus: member?.privacyStatus ?? '',
	slug: member?.profile?.slug ?? '',
	status: toStatus(member?.status),
	// those are already ISO date strings
	creationDate: member?.createdDate ?? '',
	// those are already ISO date strings
	lastUpdateDate: member?.updatedDate ?? '',
	// those are already ISO date strings
	lastLoginDate: member?.lastLoginDate ?? '',
	emailVerified: member?.loginEmailVerified ?? false,
	role: role ?? 'MEMBER',
	owner: role === Role.OWNER,
	firstName: member?.contact?.firstName ?? '',
	lastName: member?.contact?.lastName ?? '',
	memberName: `${member?.contact?.firstName} ${member?.contact?.lastName}`,
	// @ts-ignore
	groups: undefined, // not returned
	// @ts-ignore
	emails: undefined, // not returned
	// @ts-ignore
	phones: undefined, // not returned
	// @ts-ignore
	addresses: undefined, // not returned
	// @ts-ignore
	labels: undefined, // not returned
	// @ts-ignore
	customFields: undefined, // not returned
})
