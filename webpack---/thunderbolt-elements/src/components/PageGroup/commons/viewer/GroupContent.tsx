import * as React from 'react';
import { ReactElement } from 'react';
import { TransitionGroup } from 'react-transition-group';
import { getDataAttributes } from '@wix/editor-elements-common-utils';
import { IGroupContentProps } from '../commons.types';
import Transition from '../../../Transition/Transition';
import { TRANSITION_GROUP_ID } from '../constants';

const GroupContent: React.FC<IGroupContentProps> = props => {
  const {
    id = TRANSITION_GROUP_ID,
    transition = 'none',
    transitionDuration = 0,
    transitionEnabled = true,
    onTransitionComplete = () => {},
    onTransitionStarting = () => {},
    className,
    children,
    shouldUseViewTransition,
  } = props;

  const childrenArray = React.Children.toArray(children());
  const child = childrenArray[0] as ReactElement;
  const childId = child?.props.id;

  const noTransition = transition === 'none';
  const reverse = transition === 'SlideVertical';

  const supportsViewTransition =
    typeof window !== 'undefined' ? 'startViewTransition' in document : false;
  const useViewTransition = supportsViewTransition && shouldUseViewTransition;

  const getContent = () => {
    if (noTransition) {
      return children();
    }

    if (useViewTransition) {
      return (
        <div id={id} {...getDataAttributes(props)} className={className}>
          {children()}
        </div>
      );
    }

    return (
      <TransitionGroup
        id={id}
        {...getDataAttributes(props)}
        className={className}
        childFactory={_child => React.cloneElement(_child, { reverse })}
      >
        <Transition
          type={transition}
          key={childId}
          timeout={transitionDuration}
          onEntered={onTransitionComplete}
          onExiting={onTransitionStarting}
          enter={transitionEnabled}
          exit={transitionEnabled}
          unmountOnExit
        >
          {() => child}
        </Transition>
      </TransitionGroup>
    );
  };

  return <>{getContent()}</>;
};

export default GroupContent;
