import { customCssClasses } from '@wix/editor-elements-common-utils';
import classNames from 'clsx';
import * as React from 'react';
import semanticClassNames from '../../../SiteButton.semanticClassNames';
import { ISiteButtonImperativeActions } from '../../../SiteButton.types';
import SiteButtonContent from '../../SiteButtonContent';
import { SkinButtonProps } from '../SkinButton.types';

type BaseButtonSkinProps = SkinButtonProps & {
  skinsStyle: Record<string, string>;
};

const BaseButtonSkin: React.ForwardRefRenderFunction<
  ISiteButtonImperativeActions,
  BaseButtonSkinProps
> = (
  {
    wrapperProps,
    linkProps,
    a11yProps,
    elementType,
    skinsStyle,
    label,
    autoFocus,
    customClassNames = [],
    onFocus,
    onBlur,
  },
  ref,
) => {
  return (
    <div
      {...wrapperProps}
      className={classNames(wrapperProps.className, skinsStyle.root)}
    >
      <SiteButtonContent
        disabled={a11yProps['aria-disabled'] ? true : undefined}
        linkProps={linkProps}
        a11yProps={a11yProps}
        elementType={elementType}
        className={classNames(
          skinsStyle.link,
          customCssClasses(semanticClassNames.root, ...customClassNames),
        )}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={ref}
      >
        <span
          className={classNames(
            skinsStyle.label,
            customCssClasses(semanticClassNames.buttonLabel),
          )}
        >
          {label}
        </span>
      </SiteButtonContent>
    </div>
  );
};

export default React.forwardRef(BaseButtonSkin);
