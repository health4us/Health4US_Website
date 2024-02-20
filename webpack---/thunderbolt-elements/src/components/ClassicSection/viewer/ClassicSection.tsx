import * as React from 'react';
import classNames from 'clsx';
import {
  customCssClasses,
  useVideoAPI,
  getDataAttributes,
  getTabIndexAttribute,
} from '@wix/editor-elements-common-utils';
import type { MediaContainerVideoAPI } from '@wix/editor-elements-types/components';
import MeshContainer from '../../../thunderbolt-core-components/MeshContainer/viewer/MeshContainer';
import FillLayers from '../../FillLayers/viewer/FillLayers';
import { ClassicSectionProps } from '../ClassicSection.types';
import ShapeDividers from '../../MediaContainers/ShapeDividers/viewer/shapeDividers';
import semanticClassNames from '../ClassicSection.semanticClassNames';
import styles from './style/ClassicSection.scss';

const ClassicSection: React.ForwardRefRenderFunction<
  MediaContainerVideoAPI,
  ClassicSectionProps
> = (props, compRef) => {
  const {
    id,
    fillLayers = {},
    className,
    customClassNames = [],
    meshProps = {
      wedges: [],
      rotatedComponents: [],
    },
    anchorUrlFragment,
    children,
    onMouseEnter,
    onMouseLeave,
    onClick,
    onDblClick,
    getPlaceholder,
    a11y = {},
    onStop,
    onReady,
    dividers,
  }: ClassicSectionProps = props;

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
        styles.container,
        className,
        customCssClasses(semanticClassNames.root, ...customClassNames),
      )}
      data-block-level-container="ClassicSection"
    >
      {anchorUrlFragment && (
        <div className={styles.anchorElement} id={anchorUrlFragment} />
      )}
      <FillLayers
        {...fillLayers}
        onReady={onReady}
        getPlaceholder={getPlaceholder}
        videoRef={videoRef}
      />
      {dividers && <ShapeDividers {...dividers} />}

      <MeshContainer
        id={id}
        {...meshProps}
        extraClassName={classNames({
          [styles.fixFlashingContent]: shouldFixContentFlashing,
        })}
      >
        {children}
      </MeshContainer>
    </section>
  );
};

export default React.forwardRef(ClassicSection);
