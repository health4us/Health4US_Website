import { AUTHORIZATION_CODE_QUERY_PARAM } from '@wix/thunderbolt-symbols'

export const isSiteContextOverrideMessage = (msg: any) => msg.type === AUTHORIZATION_CODE_QUERY_PARAM
