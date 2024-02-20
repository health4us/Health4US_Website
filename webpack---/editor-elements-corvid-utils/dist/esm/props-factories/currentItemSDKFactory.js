import {
    withValidation
} from '../validations';
import {
    convertGalleryItemsToUserModel
} from '../galleries';
const _currentItemSDKFactory = ({
    registerEvent,
    platformUtils: {
        linkUtils
    },
    props
}) => {
    return {
        get currentItem() {
            if (!props.items || props.items.length === 0) {
                return undefined;
            }
            const currentItem = props.items[props.currentIndex];
            const convertedItemToUserModel = convertGalleryItemsToUserModel([currentItem], linkUtils);
            return convertedItemToUserModel[0];
        },
        get currentIndex() {
            return props.currentIndex;
        },
        onCurrentItemChanged(handler) {
            registerEvent('onCurrentItemChanged', (event) => {
                const changedItem = props.items[event.itemIndex];
                [event.item] = convertGalleryItemsToUserModel([changedItem], linkUtils);
                handler(event);
            });
        },
    };
};
export const currentItemSDKFactory = withValidation(_currentItemSDKFactory, {
    type: ['object'],
    properties: {
        onCurrentItemChanged: {
            type: ['function'],
            args: [{
                type: ['function']
            }],
        },
    },
});
//# sourceMappingURL=currentItemSDKFactory.js.map