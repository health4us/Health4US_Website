import React from 'react';
export function useVideoAPI(compRef, hasVideo, onStop) {
    const videoRef = React.useRef(null);
    const videoAPI = React.useRef(null);
    if (hasVideo) {
        if (!videoAPI.current) {
            videoAPI.current = {
                play: () => videoRef.current ? .play(),
                load: () => videoRef.current ? .load(),
                pause: () => videoRef.current ? .pause(),
                stop: () => {
                    if (videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0;
                        if (onStop) {
                            onStop(videoRef.current);
                        }
                    }
                },
            };
        }
    } else {
        // no video remove video API
        videoAPI.current = null;
    }
    React.useImperativeHandle(compRef, () => {
        return videoAPI.current || {
            load() {},
            stop() {}
        };
    });
    return videoRef;
}
//# sourceMappingURL=useVideoAPI.js.map