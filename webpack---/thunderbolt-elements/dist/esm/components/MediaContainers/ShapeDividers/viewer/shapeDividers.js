import * as React from 'react';
import classNames from 'clsx';
import styles from './style/shapeDividers.scss';
const generateLayers = (hasDivider, layersSize) => {
    return hasDivider ?
        [...Array(1 + (layersSize || 0)).keys()]
        .reverse()
        .map(i => (React.createElement("div", {
            key: `divider-layer-${i}`,
            style: {
                '--divider-layer-i': i
            },
            className: styles.dividerLayer,
            "data-testid": `divider-layer-${i}`,
            "data-divider-layer": i
        }))) :
        null;
};
export const generateDivider = (side, hasDivider, size) => {
    const dividerLayers = generateLayers(!!hasDivider, size);
    return hasDivider ? (React.createElement("div", {
        className: classNames(styles.shapeDivider, {
            [styles.topShapeDivider]: side === 'top',
            [styles.bottomShapeDivider]: side === 'bottom',
        }),
        "data-testid": `${side}-divider`
    }, dividerLayers)) : null;
};
const ShapeDividers = dividers => {
    const topDivider = React.useMemo(() => {
        return generateDivider('top', dividers ? .hasTopDivider, dividers ? .topLayers ? .size);
    }, [dividers ? .hasTopDivider, dividers ? .topLayers ? .size]);
    const bottomDivider = React.useMemo(() => {
        return generateDivider('bottom', dividers ? .hasBottomDivider, dividers ? .bottomLayers ? .size);
    }, [dividers ? .hasBottomDivider, dividers ? .bottomLayers ? .size]);
    return (React.createElement(React.Fragment, null,
        topDivider,
        bottomDivider));
};
export default ShapeDividers;
//# sourceMappingURL=shapeDividers.js.map