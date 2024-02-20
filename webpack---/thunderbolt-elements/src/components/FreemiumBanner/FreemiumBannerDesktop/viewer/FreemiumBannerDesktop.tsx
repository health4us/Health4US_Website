import classNamesFn from 'clsx';
import * as React from 'react';
import { getDataAttributes } from '@wix/editor-elements-common-utils';
import { WixLogo } from '../../common/assets/logos';
import Link from '../../../Link/viewer/Link';
import { TestIds } from '../../common/constants';
import { FreemiumBannerDesktopProps } from '../FreemiumBannerDesktop.types';
import defaultTranslations from './constants';
import style from './style/FreemiumBannerDesktop.scss';

const defaultDirection = 'ltr';

const FreemiumBannerDesktop: React.FC<FreemiumBannerDesktopProps> = props => {
  const {
    id = 'WIX_ADS',
    translations,
    useOverlay = false,
    direction,
    href = '',
    classNames = [defaultDirection],
    className,
  } = props;

  const anchorClassNames = classNamesFn(
    ...classNames.map(name => style[name]),
    style.desktopTop,
    'has-custom-focus',
  );

  const isWixLogoInText =
    translations.bannerText!.indexOf(defaultTranslations.wixLogoPlaceHolder) >=
    0;
  let textBeforeLogo = translations.bannerText;
  let textAfterLogo = '';
  if (isWixLogoInText) {
    const textParts = translations.bannerText!.split(
      defaultTranslations.wixLogoPlaceHolder,
    );
    textBeforeLogo = textParts[0];
    textAfterLogo = textParts[1];
  }

  return (
    <div
      id={id}
      {...getDataAttributes(props)}
      className={classNamesFn(className, style.desktop, style.freemiumBanner)}
    >
      {useOverlay ? (
        <div data-testid={TestIds.overlay} className={anchorClassNames} />
      ) : (
        <Link
          className={anchorClassNames}
          href={href}
          target="_blank"
          rel="nofollow"
        >
          <span className={style.contents}>
            <span className={style.text}>
              {textBeforeLogo}
              {isWixLogoInText && (
                <div
                  data-testid={TestIds.logo}
                  style={{ direction: 'ltr', display: 'inline-flex' }}
                >
                  <div>
                    <WixLogo rootClass={style.wixLogo} dotClass={style.dot} />
                  </div>
                  <div className={style.com}>.com</div>
                </div>
              )}
              {textAfterLogo}
            </span>
            <span className={`${style.button} ${style[direction]}`}>
              {translations.buttonText}
            </span>
          </span>
        </Link>
      )}
    </div>
  );
};

export default FreemiumBannerDesktop;
