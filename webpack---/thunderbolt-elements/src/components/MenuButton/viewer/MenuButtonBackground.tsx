import React from 'react';
import classnames from 'clsx';

export const MenuButtonBackgroundLabel: React.FC<{
  dir?: string;
  textAlign?: string;
  className: string;
  children: React.ReactNode;
  tagName?: keyof JSX.IntrinsicElements;
  id: string;
}> = ({ dir, textAlign, className, children, tagName: TagName = 'p', id }) => {
  return (
    <TagName
      className={className}
      style={{ textAlign }}
      dir={dir}
      id={`${id}label`}
    >
      {children}
    </TagName>
  );
};

export type MenuButtonBackgroundProps = {
  children?: React.ReactNode;
  wrapperProps: {
    dir?: string;
    textAlign?: string;
    id: string;
  };
  classNames: { bg: string; label: string };
};

const MenuButtonBackground: React.FC<MenuButtonBackgroundProps> = ({
  wrapperProps: { dir, textAlign, id },
  classNames,
  children,
}) => {
  return (
    // TODO: replace the inline style with classes
    <div
      className={classnames(classNames.bg)}
      style={{ textAlign: textAlign as React.CSSProperties['textAlign'] }}
    >
      <MenuButtonBackgroundLabel
        dir={dir}
        textAlign={textAlign}
        className={classNames.label}
        id={id}
      >
        {children}
      </MenuButtonBackgroundLabel>
    </div>
  );
};

export default MenuButtonBackground;
