import * as React from 'react';
import classNames from 'clsx';
import Image from '../../Image/viewer/Image';
import BackgroundImage from '../../BackgroundImage/viewer/BackgroundImage';
import Video from '../../Video/viewer/Video';
import BackgroundMedia from '../../BackgroundMedia/viewer/BackgroundMedia';
import BackgroundOverlay from '../../BackgroundOverlay/viewer/BackgroundOverlay';
import {
    TestIds
} from '../constants';
import hoverBoxUtils from '../../MediaContainers/HoverBox/utils';
import styles from './style/FillLayers.scss';
import {
    useOnLoadsEvents
} from './useOnLoadsEvents';
const IMAGE_CLASS_FOR_LAYOUT = 'bgImage';
const FillLayers = props => {
    const {
        videoRef,
        canvasRef,
        hasBgFullscreenScrollEffect,
        image,
        backgroundImage,
        backgroundMedia,
        video,
        backgroundOverlay,
        shouldPadMedia,
        extraClass = '',
        shouldRenderUnderlay = !video,
        reducedMotion = false,
        getPlaceholder,
    } = props;
    const {
        onImageLoad
    } = useOnLoadsEvents(props);
    // fix containerId to support hoverBox component
    const containerId = hoverBoxUtils.getDefaultId(props.containerId);
    const fixedImageId = `img_${hoverBoxUtils.getDefaultId(containerId)}`;
    const ImageComponent = image && (React.createElement(Image, {
        id: fixedImageId,
        className: classNames(styles.fillLayer, styles.imageFillLayer, styles.transforms, IMAGE_CLASS_FOR_LAYOUT),
        // overriding dimensions returned from  imageClientApi.getPlaceholder().css.img
        imageStyles: {
            width: '100%',
            height: '100%'
        },
        getPlaceholder: getPlaceholder,
        ...image,
        onLoad: onImageLoad
    }));
    const BackgroundImageComponent = backgroundImage && (React.createElement(BackgroundImage, { ...backgroundImage,
        containerId: containerId,
        className: classNames(styles.fillLayer, styles.imageFillLayer, styles.transforms, IMAGE_CLASS_FOR_LAYOUT),
        getPlaceholder: getPlaceholder
    }));
    const VideoComponent = video && (React.createElement(Video, {
        id: `videoContainer_${containerId}`,
        ...video,
        extraClassName: styles.videoFillLayer,
        reducedMotion: reducedMotion,
        videoRef: videoRef,
        getPlaceholder: getPlaceholder
    }));
    const Media = (React.createElement(React.Fragment, null,
        ImageComponent,
        BackgroundImageComponent,
        VideoComponent,
        canvasRef && (React.createElement("canvas", {
            id: `${containerId}webglcanvas`,
            ref: canvasRef,
            className: classNames(styles.alphaCanvas, 'webglcanvas'),
            "aria-label": video ? .alt || '',
            role: "presentation",
            "data-testid": TestIds.canvas
        }))));
    const BgMedia = backgroundMedia ? (React.createElement(BackgroundMedia, {
        id: `bgMedia_${containerId}`,
        ...backgroundMedia
    }, Media)) : (React.createElement("div", {
        id: `bgMedia_${containerId}`,
        className: styles.bgMedia
    }, Media));
    const BgOverlay = backgroundOverlay && (React.createElement(BackgroundOverlay, { ...backgroundOverlay
    }));
    return (React.createElement("div", {
            id: `${TestIds.bgLayers}_${containerId}`,
            "data-hook": TestIds.bgLayers,
            className: classNames(styles.layersContainer, extraClass, {
                [styles.fullScreenScrollEffect]: hasBgFullscreenScrollEffect,
            })
        },
        shouldRenderUnderlay && (React.createElement("div", {
            "data-testid": TestIds.colorUnderlay,
            className: classNames(styles.bgUnderlay, styles.fillLayer)
        })),
        shouldPadMedia ? (React.createElement("div", {
                "data-testid": TestIds.mediaPadding,
                className: styles.mediaPaddingLayer
            },
            BgMedia,
            BgOverlay)) : (React.createElement(React.Fragment, null,
            BgMedia,
            BgOverlay))));
};
export default FillLayers;
//# sourceMappingURL=FillLayers.js.map