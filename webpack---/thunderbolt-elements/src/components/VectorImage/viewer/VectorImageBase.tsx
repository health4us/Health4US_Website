import * as React from 'react';
import classNamesFn from 'clsx';

import {
  customCssClasses,
  getDataAttributes,
  getTabIndexAttribute,
  isEmptyObject,
  replaceCompIdPlaceholder,
  replaceContentIds,
  useAnalyticsReportClicks,
  setAriaLabel,
} from '@wix/editor-elements-common-utils';
import { IVectorImageBaseProps } from '../VectorImage.types';
import Link from '../../Link/viewer/Link';
import semanticClassNames from '../VectorImage.semanticClassNames';
import styles from './style/VectorImage.scss';

const VectorImage: React.FC<IVectorImageBaseProps> = props => {
  const {
    id,
    svgContent,
    shouldScaleStroke,
    withShadow,
    withStroke,
    link,
    ariaLabel,
    ariaExpanded,
    ariaAttributes: sdkAriaAttributes,
    className = '',
    customClassNames = [],
    containerClass = '',
    onClick,
    onDblClick,
    onMouseEnter,
    onMouseLeave,
    hasPlatformClickHandler,
    onKeyDown,
    toggle,
    reportBiOnClick,
    tag: RootEl = 'div',
  } = props;

  const isClickable = hasPlatformClickHandler || onClick;
  const hasLink = !isEmptyObject(link);
  const classes = classNamesFn(
    styles.svgRoot,
    {
      [styles.nonScalingStroke]: !shouldScaleStroke,
      [styles.hasShadow]: withShadow,
      [styles.hasStroke]: withStroke,
      [styles.clickable]: isClickable,
    },
    className,
  );

  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    let listener: Parameters<HTMLElement['addEventListener']>[1];
    const component = ref.current;

    if (toggle) {
      listener = () => toggle(false);
      component?.addEventListener('click', listener);
    }

    return () => {
      if (listener) {
        component?.removeEventListener('click', listener);
      }
    };
  }, [ref, toggle]);

  const processedSvgContent = React.useMemo(() => {
    if (!svgContent) {
      return svgContent;
    }

    // avoid duplicate IDs in same document
    // mostly happens during page transitions - causes visual bugs - mostly on Safari
    const contentWithoutDuplicateIds = replaceContentIds(svgContent, id);
    const content = sdkAriaAttributes?.label
      ? setAriaLabel(contentWithoutDuplicateIds, sdkAriaAttributes?.label)
      : contentWithoutDuplicateIds;

    return replaceCompIdPlaceholder(content, id);
  }, [id, svgContent, sdkAriaAttributes?.label]);

  const svgContentElement = (
    <div
      data-testid={`svgRoot-${id}`}
      className={classes}
      dangerouslySetInnerHTML={{
        __html: processedSvgContent,
      }}
    />
  );

  const handleClick = useAnalyticsReportClicks({
    onClick,
    reportBiOnClick,
  });

  return (
    <RootEl
      id={id}
      {...getDataAttributes(props)}
      {...getTabIndexAttribute(props.a11y)}
      className={classNamesFn(
        containerClass,
        className,
        customCssClasses(semanticClassNames.root, ...customClassNames),
      )}
      onClick={isClickable || hasLink ? handleClick : undefined}
      onDoubleClick={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
      ref={ref as any}
      aria-expanded={ariaExpanded}
    >
      {hasLink ? (
        <Link className={styles.link} aria-label={ariaLabel} {...link}>
          {svgContentElement}
        </Link>
      ) : (
        svgContentElement
      )}
    </RootEl>
  );
};

export default VectorImage;
