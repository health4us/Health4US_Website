import * as React from 'react';
const defaultIdPrefix = 'bgImg_';
const BackgroundImage = props => {
    const {
        className,
        customIdPrefix,
        getPlaceholder,
        hasAnimation,
        allowWEBPTransform,
        ...backgroundImage
    } = props;
    const tileImagedInfoString = React.useMemo(() => JSON.stringify({
        containerId: backgroundImage.containerId,
        alignType: backgroundImage.alignType,
        fittingType: backgroundImage.displayMode,
        hasAnimation,
        imageData: {
            width: backgroundImage.width,
            height: backgroundImage.height,
            uri: backgroundImage.uri,
            name: backgroundImage.name,
            ...(backgroundImage.quality && {
                quality: backgroundImage.quality
            }),
            displayMode: backgroundImage.displayMode,
        },
    }), [backgroundImage, hasAnimation]);
    const imagePlaceholderData = React.useRef(null);
    if (!imagePlaceholderData.current) {
        imagePlaceholderData.current = getPlaceholder ?
            getPlaceholder({
                fittingType: backgroundImage.displayMode,
                src: {
                    id: backgroundImage.uri,
                    width: backgroundImage.width,
                    height: backgroundImage.height,
                    name: backgroundImage.name,
                },
                target: {
                    width: backgroundImage.containerWidth,
                    height: backgroundImage.containerHeight,
                    alignment: backgroundImage.alignType,
                    htmlTag: 'bg',
                },
                options: {
                    hasAnimation,
                    allowWEBPTransform,
                },
            }) : // to keep an empty placeholder data
            {
                uri: undefined,
                css: {
                    img: {}
                },
                attr: {
                    img: {},
                    container: {}
                },
            };
    }
    const currentPlaceholder = imagePlaceholderData.current;
    const src = currentPlaceholder ? .uri ? ? '';
    const placeholderStyle = currentPlaceholder.css ? .container ? ? {};
    const placeholder = Object.assign(src ?
        {
            backgroundImage: `url(${src})`,
        } :
        {}, placeholderStyle);
    return (
        // 	Custom element defined in: https://github.com/wix-private/santa-core/blob/master/wix-custom-elements/src/elements/wixBgImage/wixBgImage.js
        React.createElement("wix-bg-image", {
            id: `${customIdPrefix || defaultIdPrefix}${backgroundImage.containerId}`,
            class: className,
            style: placeholder,
            "data-tiled-image-info": tileImagedInfoString,
            "data-has-bg-scroll-effect": backgroundImage.hasBgScrollEffect || '',
            "data-bg-effect-name": backgroundImage.bgEffectName || ''
        }));
};
export default BackgroundImage;
//# sourceMappingURL=BackgroundImage.js.map