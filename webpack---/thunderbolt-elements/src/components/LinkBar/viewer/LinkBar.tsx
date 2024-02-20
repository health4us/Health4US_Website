import * as React from 'react';
import classNames from 'clsx';
import { getDataAttributes } from '@wix/editor-elements-common-utils';
import Link from '../../Link/viewer/Link';
import Image from '../../Image/viewer/Image';
import { LinkBarProps } from '../LinkBar.types';

const LinkBar: React.FC<LinkBarProps> = props => {
  const {
    id,
    images,
    styles,
    iconSize,
    className,
    shouldRenderPlaceholders = false,
    translations,
    onMouseEnter,
    onMouseLeave,
    getPlaceholder,
    reportBiOnClick,
  } = props;

  const getImageProps = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    link,
    ...imageProps
  }: LinkBarProps['images'][number]) => imageProps;

  const placeholderProps =
    shouldRenderPlaceholders && iconSize && getPlaceholder
      ? {
          getPlaceholder,
          containerWidth: iconSize,
          containerHeight: iconSize,
        }
      : {};

  return (
    <div
      id={id}
      {...getDataAttributes(props)}
      className={classNames(className, styles.root)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ul className={styles.container} aria-label={translations.ariaLabel}>
        {images.map((imageProps, index) => (
          <li
            id={imageProps.containerId}
            key={imageProps.containerId}
            onClick={() => reportBiOnClick(imageProps)}
            className={styles.listItem}
          >
            <Link
              className={styles.link}
              {...imageProps.link}
              aria-label={imageProps.alt}
            >
              <Image
                id={`img_${index}_${id}`}
                {...getImageProps(imageProps)}
                className={styles.image}
                {...placeholderProps}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinkBar;
