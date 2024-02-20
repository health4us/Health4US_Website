import * as React from 'react';
import { getDataAttributes } from '@wix/editor-elements-common-utils';
import { PageProps } from '../Page.types';

const Page: React.FC<PageProps> = props => {
  const {
    id,
    className,
    customClassNames = [],
    skin: PageClass,
    pageDidMount,
    onClick = () => {},
    onDblClick = () => {},
    onMouseEnter,
    onMouseLeave,
    children,
  } = props;
  return (
    <PageClass
      id={id}
      className={className}
      customClassNames={customClassNames}
      {...getDataAttributes(props)}
      pageDidMount={pageDidMount}
      onClick={onClick}
      onDblClick={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </PageClass>
  );
};

export default Page;
