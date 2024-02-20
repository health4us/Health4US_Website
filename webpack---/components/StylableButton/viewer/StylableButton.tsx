import * as React from 'react';
import { ReactNode } from 'react';
import {
  activateBySpaceButton,
  activateByEnterButton,
  getAriaAttributes,
  customCssClasses,
  getQaDataAttributes,
  getDataAttributes,
  useAnalyticsReportClicks,
} from '@wix/editor-elements-common-utils';
import Link, {
  isValidLink,
  LinkRef,
} from '@wix/thunderbolt-elements/components/Link';
import {
  IStylableButtonProps,
  IStylableButtonEventHandlers,
  IStylableButtonImperativeActions,
} from '../StylableButton.types';
import { TestIds } from '../constants';
import stylableButtonSemanticClassNames from '../StylableButton.semanticClassNames';
import { classes, st } from './StylableButton.component.st.css';
import ButtonContent from './StylableButtonContent';

const createIconFromString = (svg: string) => {
  return React.createElement('div', {
    dangerouslySetInnerHTML: {
      __html: svg || '',
    },
  });
};

const getEventHandlers = (
  {
    onClick,
    onDblClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  }: Partial<IStylableButtonEventHandlers>,
  isLink: boolean,
  isDisabled: boolean,
) => {
  return {
    onClick,
    onMouseEnter,
    onMouseLeave,
    onKeyDown: isLink ? activateBySpaceButton : activateByEnterButton,
    onDoubleClick: !isDisabled && onDblClick ? onDblClick : undefined,
    onFocus: !isDisabled && onFocus ? onFocus : undefined,
    onBlur: !isDisabled && onBlur ? onBlur : undefined,
  };
};

const StylableButton: React.ForwardRefRenderFunction<
  IStylableButtonImperativeActions,
  IStylableButtonProps
> = (props, ref) => {
  const {
    id,
    link,
    type = 'button',
    svgString,
    label,
    isDisabled,
    className,
    stylableButtonClassName,
    customClassNames = [],
    isQaMode,
    fullNameCompType,
    reportBiOnClick,
    a11y,
    corvid,
    isMaxContent = false,
    isWrapText = false,
    onDblClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ariaAttributes,
    onClick: propsOnClick,
  } = props;

  const semanticClassNames =
    props.semanticClassNames || stylableButtonSemanticClassNames;

  const buttonOrLinkRef = React.useRef<HTMLButtonElement | LinkRef>(null);

  React.useImperativeHandle(ref, () => {
    return {
      focus: () => {
        buttonOrLinkRef.current?.focus();
      },
      blur: () => {
        buttonOrLinkRef.current?.blur();
      },
    };
  });

  const a11yAttr = React.useMemo(
    () =>
      getAriaAttributes({
        ...ariaAttributes,
        ...a11y,
        disabled: a11y.disabled ?? isDisabled,
        label: ariaAttributes?.label ?? a11y.label ?? label,
      }),
    [a11y, label, ariaAttributes, isDisabled],
  );

  const onClick = useAnalyticsReportClicks({
    reportBiOnClick,
    onClick: !isDisabled && propsOnClick ? propsOnClick : undefined,
  });

  const eventHandlers = React.useMemo(
    () =>
      getEventHandlers(
        {
          onClick,
          onDblClick,
          onMouseLeave,
          onMouseEnter,
          onFocus,
          onBlur,
        },
        isValidLink(link),
        isDisabled,
      ),
    [
      onClick,
      onDblClick,
      onMouseLeave,
      onMouseEnter,
      onFocus,
      onBlur,
      link,
      isDisabled,
    ],
  );

  const {
    hasBackgroundColor = false,
    hasBorderColor = false,
    hasBorderRadius = false,
    hasBorderWidth = false,
    hasColor = false,
    iconSvgString,
    iconCollapsed,
  } = corvid || {};

  // TODO hasError - seems to be static in wix-ui-santa
  const rootClassName = st(
    classes.root,
    {
      error: false,
      disabled: isDisabled,
      hasBackgroundColor,
      hasBorderColor,
      hasBorderRadius,
      hasBorderWidth,
      hasColor,
      isMaxContent,
      isWrapText,
    },
    stylableButtonClassName,
    customCssClasses(semanticClassNames.root, ...customClassNames),
  );

  let buttonIcon: ReactNode = null;
  let overrideIcon: boolean = false;
  // The null value in the iconSvgString indicates that iconSvgString is set in the Velo interface
  // and we have to hide any icon even there is the default value in svgString.
  // iconSvgString can be undefined - it means that it was not set in Velo.
  // Once iconSvgString is not null (from Velo) but undefined,
  // then show the default icon string if it is set
  if (!iconCollapsed && iconSvgString !== null) {
    if (iconSvgString) {
      buttonIcon = createIconFromString(iconSvgString);
      // this will prevent icon element from hiding by CSS rule
      // when the user set the button as text only but set up the icon property in Velo
      overrideIcon = true;
    } else if (svgString) {
      buttonIcon = createIconFromString(svgString);
    }
  }

  const renderLinkedButton = () => {
    const {
      onFocus: onFocusCapture,
      onBlur: onBlurCapture,
      ...restEvents
    } = eventHandlers;

    return (
      <div
        id={id}
        className={className}
        {...restEvents}
        {...getDataAttributes(props)}
        {...getQaDataAttributes(isQaMode, fullNameCompType)}
        data-semantic-classname={semanticClassNames.root}
      >
        <Link
          {...link}
          {...a11yAttr}
          href={isDisabled ? undefined : link!.href}
          className={st(rootClassName, classes.link)}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
          ref={buttonOrLinkRef as React.RefObject<LinkRef>}
        >
          <ButtonContent
            label={label}
            icon={buttonIcon}
            semanticClassNames={semanticClassNames}
          />
        </Link>
      </div>
    );
  };

  const renderRegularButton = () => (
    // TODO - should we reuse some Button component for unity?
    <div
      id={id}
      className={className}
      {...getQaDataAttributes(isQaMode, fullNameCompType)}
      {...getDataAttributes(props)}
      data-semantic-classname={semanticClassNames.root}
    >
      <button
        type={type}
        disabled={isDisabled}
        className={rootClassName}
        data-testid={TestIds.buttonContent}
        {...a11yAttr}
        {...eventHandlers}
        ref={buttonOrLinkRef as React.RefObject<HTMLButtonElement>}
      >
        <ButtonContent
          label={label}
          icon={buttonIcon}
          override={overrideIcon}
          semanticClassNames={semanticClassNames}
        />
      </button>
    </div>
  );

  return isValidLink(link) ? renderLinkedButton() : renderRegularButton();
};

export default React.forwardRef(StylableButton);
