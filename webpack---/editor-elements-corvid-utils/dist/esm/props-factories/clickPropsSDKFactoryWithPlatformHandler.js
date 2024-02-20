import {
    clickPropsSDKFactory,
} from './clickPropsSDKFactory';
export const clickPropsSDKFactoryWithUpdatePlatformHandler = api => {
    const clickPropsApi = clickPropsSDKFactory(api);
    const {
        setProps,
        props
    } = api;
    return {
        ...clickPropsApi,
        onClick: handler => {
            clickPropsApi.onClick(handler);
            if (!props.hasPlatformClickHandler) {
                setProps({
                    hasPlatformClickHandler: true,
                });
            }
        },
    };
};
//# sourceMappingURL=clickPropsSDKFactoryWithPlatformHandler.js.map