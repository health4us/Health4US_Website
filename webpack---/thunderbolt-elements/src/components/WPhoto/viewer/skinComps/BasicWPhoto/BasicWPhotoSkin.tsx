import * as React from 'react';
import classNames from 'clsx';
import {
  customCssClasses,
  getDataAttributes,
  isEmptyObject,
  useAnalyticsReportClicks,
} from '@wix/editor-elements-common-utils';
import { WPhotoWrapper } from '../../WPhotoWrapper';
import Link from '../../../../Link/viewer/Link';
import semanticClassNames from '../../../WPhoto.semanticClassNames';
import { BaseWPhotoSkinProps } from '../../../WPhoto.types';
import { selectProperComponent, getPropsForLink } from '../../../utils';

const BasicWPhotoSkin: React.FC<BaseWPhotoSkinProps> = props => {
  const {
    skinsStyle,
    id,
    className,
    customClassNames = [],
    link,
    imageProps,
    title,
    onClick,
    hasPlatformClickHandler = false,
    onClickBehavior,
    onDblClick,
    onMouseEnter,
    onMouseLeave,
    reportBiOnClick,
    filterEffectSvgString,
    filterEffectSvgUrl,
  } = props;
  const ImageComp = selectProperComponent(onClickBehavior);
  const isPopUp = onClickBehavior === 'zoomMode';
  const linkProps = getPropsForLink({
    onClickBehavior,
    className: skinsStyle.link,
    link,
  });

  const handleClick = useAnalyticsReportClicks({
    onClick,
    reportBiOnClick,
  });

  const imageLink = isPopUp ? link : undefined;

  const withOnClickHandler =
    !isEmptyObject(link) || hasPlatformClickHandler || isPopUp;

  return (
    <WPhotoWrapper
      id={id}
      {...getDataAttributes(props)}
      className={classNames(
        skinsStyle.root,
        className,
        customCssClasses(semanticClassNames.root, ...customClassNames),
      )}
      title={title}
      onClick={withOnClickHandler || !!onClick ? handleClick : undefined}
      onDblClick={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      withOnClickHandler={withOnClickHandler}
      filterEffectSvgString={filterEffectSvgString}
      filterEffectSvgUrl={filterEffectSvgUrl}
    >
      <Link {...linkProps}>
        <ImageComp
          id={`img_${id}`}
          {...imageProps}
          className={skinsStyle.image}
          link={imageLink}
        />
      </Link>
    </WPhotoWrapper>
  );
};

export default BasicWPhotoSkin;
