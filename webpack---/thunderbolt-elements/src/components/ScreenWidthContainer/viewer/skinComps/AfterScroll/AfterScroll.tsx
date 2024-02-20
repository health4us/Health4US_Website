import * as React from 'react';
import classNames from 'clsx';
import WrapperElement from '../../WrapperElement';
import { SkinScreenWidthContainerProps } from '../../../SkinScreenWidthContainer';
import { useScrollPosition } from '../../../../../providers/useScrollPosition';

import skinStyles from './styles/skins.scss';

const SCROLLED_Y = 2;
const AfterScroll: React.FC<SkinScreenWidthContainerProps> = ({
  wrapperProps,
  children,
}) => {
  const [scrolled, setScrolled] = React.useState<boolean>(false);

  useScrollPosition(
    ({ currPos }) => {
      if (currPos.y * -1 >= SCROLLED_Y) {
        if (!scrolled) {
          setScrolled(true);
        }
      } else if (scrolled) {
        setScrolled(false);
      }
    },
    [scrolled],
  );

  return (
    <WrapperElement
      {...wrapperProps}
      skinClassName={skinStyles.AfterScroll}
      skinStyles={skinStyles}
    >
      <div
        className={classNames(
          skinStyles.screenWidthBackground,
          scrolled && skinStyles.scrolled,
        )}
      ></div>
      <div>
        <div>{children}</div>
      </div>
    </WrapperElement>
  );
};

export default AfterScroll;
