import {
    registerCorvidEvent
} from '../corvidEvents';
import {
    convertGalleryItemsToUserModel
} from '../galleries';
export const onItemClickSDKFactory = api => {
    return {
        onItemClicked(handler) {
            registerCorvidEvent('onItemClicked', api, handler, ({
                componentEvent
            }) => {
                const convertedItemToUserModel = convertGalleryItemsToUserModel([api.props.items[componentEvent.itemIndex]], api.platformUtils.linkUtils)[0];
                return {
                    ...componentEvent,
                    item: convertedItemToUserModel,
                };
            });
        },
    };
};
//# sourceMappingURL=onItemClickSDKFactory.js.map