import {
    reportError
} from '../reporters';
import {
    withValidation
} from '../validations';
import {
    createMediaSrc,
    getScrollEffect,
    getFullMediaData,
    getMediaDataFromSrc,
    hasVideo,
    CORVID_BG_VIDEO_DEFAULTS as BG_VIDEO_DEFAULTS,
} from '../media';
import * as mediaItemUtils from '../media/mediaItemUtils';
/**
 * sort qualities ASC , remove 'storyboard' quality
 * @param qualities
 */
const normalizeQualities = (qualities) => {
    return qualities
        .map(item => ({ ...item,
            size: item.width * item.height
        }))
        .filter((item) => item.quality !== 'storyboard')
        .sort((item1, item2) => parseInt(item1.quality, 10) - parseInt(item2.quality, 10));
};
const _backgroundPropsSDKFactory = ({
    setProps,
    props,
    metaData,
    compRef
}) => {
    const isVideo = hasVideo(props);
    return {
        get background() {
            return {
                get src() {
                    const {
                        fillLayers = {}
                    } = props;
                    if (fillLayers ? .video ? .videoInfo ? .videoId) {
                        const {
                            videoInfo
                        } = fillLayers.video;
                        const mediaItemUri = createMediaSrc({
                            mediaId: videoInfo.videoId,
                            type: mediaItemUtils.types.VIDEO,
                            title: fillLayers.video.posterImageInfo.title,
                            width: videoInfo.videoWidth,
                            height: videoInfo.videoHeight,
                            posterId: fillLayers.video.posterImageInfo.uri,
                        });
                        if (mediaItemUri.error) {
                            return '';
                        }
                        return mediaItemUri.item || '';
                    }
                    const image = fillLayers.image || fillLayers.backgroundImage;
                    if (image) {
                        const mediaItemUri = createMediaSrc({
                            mediaId: image.uri,
                            type: mediaItemUtils.types.IMAGE,
                            width: image.width,
                            height: image.height,
                            title: image.title,
                        });
                        if (mediaItemUri.error) {
                            return '';
                        }
                        return mediaItemUri.item || '';
                    }
                    return '';
                },
                set src(newSrc) {
                    const {
                        fillLayers = {}
                    } = props;
                    if (!newSrc) {
                        // clear the background fillLayers
                        setProps({
                            fillLayers: {
                                containerId: metaData.compId,
                            },
                        });
                        return;
                    }
                    const mediaData = getMediaDataFromSrc(newSrc);
                    if (!mediaData) {
                        reportError(`The "src" property cannot be set to "${newSrc}". It must be a valid URL starting with "http://", "https://", or "wix:image://, or a valid video URL starting with "wix:video://".`);
                        return;
                    }
                    const {
                        hasBgScrollEffect,
                        bgEffectName
                    } = getScrollEffect(fillLayers);
                    if (mediaData.type === 'WixVideo') {
                        void getFullMediaData(mediaData, fullMediaRefData => {
                            if (!fullMediaRefData) {
                                return;
                            }
                            const propsFull = {
                                fillLayers: {
                                    containerId: metaData.compId,
                                    backgroundMedia: hasBgScrollEffect ?
                                        {
                                            containerId: metaData.compId,
                                            ...fillLayers.backgroundMedia,
                                        } :
                                        undefined,
                                    hasBgFullscreenScrollEffect: fillLayers.hasBgFullscreenScrollEffect,
                                    video: {
                                        ...BG_VIDEO_DEFAULTS,
                                        alt: '',
                                        posterImageInfo: {
                                            containerId: metaData.compId,
                                            hasBgScrollEffect,
                                            bgEffectName,
                                            ...mediaData.posterImageRef,
                                        },
                                        videoInfo: {
                                            containerId: metaData.compId,
                                            videoId: fullMediaRefData.mediaObject.videoId,
                                            videoWidth: fullMediaRefData.mediaObject.videoWidth,
                                            videoHeight: fullMediaRefData.mediaObject.videoHeight,
                                            qualities: normalizeQualities(fullMediaRefData.mediaObject.qualities),
                                            isVideoDataExists: '1',
                                            videoFormat: fullMediaRefData.mediaObject.videoFormat,
                                            playbackRate: fullMediaRefData.mediaObject.playbackRate,
                                            autoPlay: fullMediaRefData.mediaObject.autoPlay,
                                            hasBgScrollEffect,
                                            bgEffectName,
                                        },
                                    },
                                },
                            };
                            setProps(propsFull);
                        });
                        // change to poster (video partial props)
                        setProps({
                            fillLayers: {
                                containerId: metaData.compId,
                                hasBgFullscreenScrollEffect: fillLayers.hasBgFullscreenScrollEffect,
                                backgroundMedia: hasBgScrollEffect ?
                                    {
                                        containerId: metaData.compId,
                                        ...fillLayers.backgroundMedia,
                                    } :
                                    undefined,
                                video: {
                                    ...BG_VIDEO_DEFAULTS,
                                    alt: '',
                                    posterImageInfo: {
                                        containerId: metaData.compId,
                                        hasBgScrollEffect,
                                        bgEffectName,
                                        ...mediaData.posterImageRef,
                                    },
                                    videoInfo: {
                                        containerId: metaData.compId,
                                        videoId: mediaData.videoId,
                                        isVideoDataExists: false,
                                    },
                                },
                            },
                        });
                    } else {
                        // change to Image
                        setProps({
                            fillLayers: {
                                containerId: metaData.compId,
                                hasBgFullscreenScrollEffect: fillLayers.hasBgFullscreenScrollEffect,
                                backgroundMedia: hasBgScrollEffect ?
                                    {
                                        containerId: metaData.compId,
                                        ...fillLayers.backgroundMedia,
                                    } :
                                    undefined,
                                image: !fillLayers.backgroundImage ?
                                    {
                                        ...mediaData,
                                        uri: mediaData.mediaId || '',
                                        displayMode: fillLayers ? .image ? .displayMode,
                                        containerId: metaData.compId,
                                        name: '',
                                        width: mediaData.width || 0,
                                        height: mediaData.height || 0,
                                        alt: '',
                                        hasBgScrollEffect,
                                        bgEffectName,
                                    } :
                                    null,
                                backgroundImage: fillLayers.backgroundImage ?
                                    {
                                        ...mediaData,
                                        uri: mediaData.mediaId || '',
                                        name: mediaData.name || '',
                                        width: mediaData.width || 0,
                                        height: mediaData.height || 0,
                                        alt: mediaData.name || '',
                                        displayMode: fillLayers ? .backgroundImage ? .displayMode,
                                    } :
                                    null,
                            },
                        });
                    }
                },
                get alt() {
                    return (props.fillLayers ? .image ? .alt || props.fillLayers ? .video ? .alt || '');
                },
                set alt(newAlt) {
                    if (!props.fillLayers) {
                        return;
                    }
                    const {
                        image,
                        video
                    } = props.fillLayers;
                    const videoAttributes = video ?
                        {
                            video: { ...video,
                                alt: newAlt
                            }
                        } :
                        {};
                    const imageAttributes = image ?
                        {
                            image: { ...image,
                                alt: newAlt
                            }
                        } :
                        {};
                    setProps({
                        fillLayers: {
                            ...props.fillLayers,
                            ...videoAttributes,
                            ...imageAttributes,
                        },
                    });
                },
                play() {
                    if (isVideo) {
                        return compRef.play(true);
                    }
                },
                pause() {
                    if (isVideo) {
                        return compRef.pause();
                    }
                },
                stop() {
                    if (isVideo) {
                        return compRef.stop();
                    }
                },
            };
        },
    };
};
export const backgroundPropsSDKFactory = withValidation(_backgroundPropsSDKFactory, {
    type: ['object'],
    properties: {
        background: {
            type: ['object'],
            properties: {
                src: {
                    type: ['string', 'nil'],
                    warnIfNil: true,
                },
                alt: {
                    type: ['string', 'nil'],
                    warnIfNil: true,
                },
            },
        },
    },
});
//# sourceMappingURL=backgroundPropsSDKFactory.js.map