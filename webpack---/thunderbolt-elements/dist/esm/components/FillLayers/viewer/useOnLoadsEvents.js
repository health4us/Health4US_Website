import {
    useEffect
} from 'react';
export const useOnLoadsEvents = ({
    onReady,
    image
}) => {
    useEffect(() => {
        if (onReady && !image) {
            onReady();
        }
    }, [onReady, image]);
    return {
        onImageLoad: (e) => {
            if (image ? .onLoad) {
                image.onLoad(e);
            }
            if (onReady) {
                onReady();
            }
        },
    };
};
//# sourceMappingURL=useOnLoadsEvents.js.map