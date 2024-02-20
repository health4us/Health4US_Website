import React from 'react';
import { IHeaderContainerProps } from '../../../HeaderContainer.types';
import AfterScroll from '../../../../ScreenWidthContainer/viewer/skinComps/AfterScroll/AfterScroll';
import HeaderContainer from '../../HeaderContainer';

const AfterScrollHeader: React.FC<
  Omit<IHeaderContainerProps, 'skin'>
> = props => <HeaderContainer {...props} skin={AfterScroll}></HeaderContainer>;

export default AfterScrollHeader;
