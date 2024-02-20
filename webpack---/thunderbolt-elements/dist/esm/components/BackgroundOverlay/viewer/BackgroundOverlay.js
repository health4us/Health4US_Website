import * as React from 'react';
import {
    TestIds
} from '../constants';
import BackgroundImage from '../../BackgroundImage/viewer/BackgroundImage';
import styles from './style/BackgroundOverlay.scss';
const BackgroundOverlay = props => {
    const {
        imageOverlay
    } = props;
    return (React.createElement("div", {
        "data-testid": TestIds.bgOverlay,
        className: styles.bgOverlay
    }, imageOverlay && (React.createElement(BackgroundImage, {
        customIdPrefix: "bgImgOverlay_",
        className: styles.bgImgOverlay,
        ...imageOverlay
    }))));
};
export default BackgroundOverlay;
//# sourceMappingURL=BackgroundOverlay.js.map