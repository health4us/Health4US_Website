import * as React from 'react';
import classNames from 'clsx';
import {
  customCssClasses,
  useVideoAPI,
  getDataAttributes,
  getTabIndexAttribute,
} from '@wix/editor-elements-common-utils';
import type { MediaContainerVideoAPI } from '@wix/editor-elements-types/components';
import FillLayers from '@wix/thunderbolt-elements/components/FillLayers';
import ShapeDividers from '@wix/thunderbolt-elements/components/ShapeDividers';
import { StripColumnsContainerProps } from '../StripColumnsContainer.types';
import { TestIds } from '../constants';
import semanticClassNames from '../StripColumnsContainer.semanticClassNames';
import styles from './style/StripColumnsContainer.scss';

const StripColumnsContainer: React.ForwardRefRenderFunction<
  MediaContainerVideoAPI,
  StripColumnsContainerProps
> = (props, compRef) => {
  const {
    id,
    className,
    customClassNames = [],
    fillLayers,
    children,
    onMouseEnter,
    onMouseLeave,
    onClick,
    onDblClick,
    getPlaceholder,
    a11y = {},
    onStop,
    dividers,
    onReady,
  }: StripColumnsContainerProps = props;
  const sdkEventHandlers = {
    onMouseEnter,
    onMouseLeave,
    onClick,
    onDoubleClick: onDblClick,
  };

  // fix content in front of background in position:fixed disappearing when scrolling to it - Chromium +85 bug
  const shouldFixContentFlashing = fillLayers.hasBgFullscreenScrollEffect;

  const hasVideo = !!fillLayers.video;
  const videoRef = useVideoAPI(compRef, hasVideo, onStop);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tabindex, ...restA11y } = a11y;

  return (
    <section
      id={id}
      {...getDataAttributes(props)}
      {...sdkEventHandlers}
      {...restA11y}
      {...getTabIndexAttribute(a11y)}
      className={classNames(
        className,
        styles.stripColumnsContainer,
        customCssClasses(semanticClassNames.root, ...customClassNames),
      )}
    >
      <FillLayers
        {...fillLayers}
        getPlaceholder={getPlaceholder}
        onReady={onReady}
        videoRef={videoRef}
      />
      {dividers && <ShapeDividers {...dividers} />}
      <div
        data-testid={TestIds.columns}
        className={classNames(styles.columns, {
          [styles.fixFlashingContent]: shouldFixContentFlashing,
        })}
      >
        {children()}
      </div>
    </section>
  );
};

export default React.forwardRef(StripColumnsContainer);
