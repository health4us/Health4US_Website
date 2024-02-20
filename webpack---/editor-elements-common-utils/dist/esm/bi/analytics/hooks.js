import {
    useCallback
} from 'react';
export const useAnalyticsReportClicks = ({
    reportBiOnClick,
    onClick: propsOnClick,
}) => {
    return useCallback(event => {
        reportBiOnClick ? .(event);
        propsOnClick ? .(event);
    }, [reportBiOnClick, propsOnClick]);
};
//# sourceMappingURL=hooks.js.map