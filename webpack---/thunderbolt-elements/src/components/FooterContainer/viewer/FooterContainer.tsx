import * as React from 'react';
import classNames from 'clsx';
import {
  customCssClasses,
  getDataAttributes,
} from '@wix/editor-elements-common-utils';
import MeshContainer from '../../../thunderbolt-core-components/MeshContainer/viewer/MeshContainer';
import { IFooterContainerProps } from '../FooterContainer.types';
import semanticClassNames from '../FooterContainer.semanticClassNames';

const DEFAULT_TAB_INDEX = '-1';

const FooterContainer: React.FC<IFooterContainerProps> = props => {
  const {
    id,
    className,
    customClassNames = [],
    skin: FooterContainerClass,
    children,
    meshProps,
  } = props;

  const sdkEventHandlers = {
    onMouseEnter: props.onMouseEnter,
    onMouseLeave: props.onMouseLeave,
    onClick: props.onClick,
    onDoubleClick: props.onDblClick,
  };

  const rootClassNames = classNames(
    className,
    customCssClasses(semanticClassNames.root, ...customClassNames),
  );

  return (
    <FooterContainerClass
      wrapperProps={{
        ...getDataAttributes(props),
        id,
        eventHandlers: sdkEventHandlers,
        tabIndex: DEFAULT_TAB_INDEX,
        className: rootClassNames,
      }}
      data-block-level-container="FooterContainer"
    >
      <MeshContainer id={id} {...meshProps}>
        {children}
      </MeshContainer>
    </FooterContainerClass>
  );
};

export default FooterContainer;
