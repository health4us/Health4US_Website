import * as React from 'react';
import classNamesFn from 'clsx';
import {
  CSS_EDITING_SCOPE_CLASS,
  getDataAttributes,
} from '@wix/editor-elements-common-utils';
import { IMasterPageProps } from '../MasterPage.types';

const MasterPage: React.FC<IMasterPageProps> = props => {
  const { classNames = {}, pageDidMount, children, className } = props;
  const wrapperClasses = classNamesFn(
    Object.values(classNames),
    className,
    CSS_EDITING_SCOPE_CLASS,
  );

  return (
    <div
      id="masterPage"
      {...getDataAttributes(props)}
      className={wrapperClasses}
      ref={pageDidMount}
    >
      {children()}
    </div>
  );
};

export default MasterPage;
