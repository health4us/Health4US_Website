import * as React from 'react';
import classNames from 'clsx';
import type { MediaContainerVideoAPI } from '@wix/editor-elements-types/components';
import {
  useVideoAPI,
  getDataAttributes,
} from '@wix/editor-elements-common-utils';
import FillLayers from '../../FillLayers/viewer/FillLayers';
import { PageBackgroundProps } from '../PageBackground.types';
import styles from './style/PageBackground.scss';

const PageBackground: React.ForwardRefRenderFunction<
  MediaContainerVideoAPI,
  PageBackgroundProps
> = (props, compRef) => {
  const {
    id,
    className,
    fillLayers,
    isMediaPositionOverride,
    mediaHeightOverrideType,
    getPlaceholder,
    onStop,
  } = props;

  const hasVideo = !!fillLayers.video;
  const videoRef = useVideoAPI(compRef, hasVideo, onStop);

  return (
    <div
      id={id}
      {...getDataAttributes(props)}
      data-media-height-override-type={mediaHeightOverrideType}
      // todo: remove the data-media-position-override when TB includes wix-custom-elements that supports the updated attribute
      data-media-position-override={isMediaPositionOverride}
      className={classNames(className, styles.pageBackground)}
    >
      <FillLayers
        {...fillLayers}
        getPlaceholder={getPlaceholder}
        videoRef={videoRef}
      />
    </div>
  );
};

export default React.forwardRef(PageBackground);
