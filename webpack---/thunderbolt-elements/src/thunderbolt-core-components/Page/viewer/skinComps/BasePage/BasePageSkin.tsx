import React from 'react';
import classnames from 'clsx';
import { customCssClasses } from '@wix/editor-elements-common-utils';
import { SkinPageProps } from '../SkinPage';
import { TestIds } from '../../../constants';
import semanticClassNames from '../../../Page.semanticClassNames';

export type BasePageSkinProps = SkinPageProps & {
  skinsStyle: { [key: string]: string };
};

const BasePageSkin: React.FC<BasePageSkinProps> = ({
  id,
  className,
  customClassNames = [],
  pageDidMount,
  onClick,
  onDblClick,
  children,
  skinsStyle,
  onMouseEnter,
  onMouseLeave,
}) => {
  const computedClass = classnames(
    skinsStyle.root,
    skinsStyle.pageWrapper,
    className,
  );

  return (
    <div
      id={id}
      className={computedClass}
      ref={pageDidMount}
      onClick={onClick}
      onDoubleClick={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={classnames(
          skinsStyle.bg,
          customCssClasses(semanticClassNames.root, ...customClassNames),
        )}
        data-testid={TestIds.background}
      />
      <div className={skinsStyle.inlineContent}>{children()}</div>
    </div>
  );
};

export default BasePageSkin;
