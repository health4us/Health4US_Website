import * as React from 'react';
import {
  getAriaAttributes,
  getQaDataAttributes,
  getDataAttributes,
  useAnalyticsReportClicks,
} from '@wix/editor-elements-common-utils';
import { ElementType } from '../constants';
import { isValidLink } from '../../Link/viewer/Link';
import type {
  ISiteButtonImperativeActions,
  ISiteButtonProps,
} from '../SiteButton.types';

const noop = () => {};

const getTabIndex = (
  elementType: ElementType,
  link: ISiteButtonProps['link'],
  isDisabled: boolean,
  tabIndex?: number,
) => {
  if (isDisabled) {
    return -1;
  }

  if (elementType === ElementType.Button) {
    return tabIndex;
  }

  if (isEmptyLink(elementType, link)) {
    return tabIndex ?? 0;
  }

  return tabIndex;
};

const getRole = (
  elementType: ElementType,
  link: ISiteButtonProps['link'],
  isDisabled: boolean,
) =>
  isEmptyLink(elementType, link) || isDisabledLink(elementType, isDisabled)
    ? 'button'
    : undefined;

const isEmptyLink = (
  elementType: ElementType,
  link: ISiteButtonProps['link'],
) => elementType === ElementType.Link && !isValidLink(link);

const isDisabledLink = (elementType: ElementType, isDisabled: boolean) =>
  elementType === ElementType.Link && isDisabled;

const SiteButton: React.ForwardRefRenderFunction<
  ISiteButtonImperativeActions,
  ISiteButtonProps
> = (props, ref) => {
  const {
    id,
    className,
    customClassNames = [],
    autoFocus,
    label = '',
    skin: ButtonClass,
    hasPlatformClickHandler = false,
    link = undefined,
    ariaLabel,
    isQaMode,
    fullNameCompType,
    reportBiOnClick,
    onFocus,
    onBlur,
    onClick: propsOnClick = noop,
    onDblClick = noop,
    onMouseEnter = noop,
    onMouseLeave = noop,
    ariaAttributes,
    a11y = {},
  } = props;
  let { isDisabled = false } = props;

  // TODO - this is a temp workaround for SSR setting isDisabled value as `null`
  if (isDisabled !== true) {
    isDisabled = false;
  }

  const elementType = hasPlatformClickHandler
    ? ElementType.Button
    : ElementType.Link;

  const { tabIndex, ...a11yProps } = getAriaAttributes({
    ...ariaAttributes,
    ...a11y,
    disabled: a11y.disabled ?? isDisabled,
    label: ariaAttributes?.label ?? a11y.label ?? ariaLabel,
  });

  const finalTabIndex = getTabIndex(elementType, link, isDisabled, tabIndex);
  const role = getRole(elementType, link, isDisabled);

  const linkProps = link && {
    href: isDisabled ? undefined : link.href,
    target: link.target,
    rel: link.rel,
    linkPopupId: link.linkPopupId,
    anchorDataId: link.anchorDataId,
    anchorCompId: link.anchorCompId,
    activateByKey: 'Enter',
  };

  const onClick = useAnalyticsReportClicks({
    reportBiOnClick,
    onClick: isDisabled ? noop : propsOnClick,
  });

  return (
    <ButtonClass
      wrapperProps={{
        ...getDataAttributes(props),
        className,
        id,
        role,
        tabIndex: finalTabIndex,
        'aria-disabled': a11yProps['aria-disabled'],
        onClick,
        onDoubleClick: isDisabled ? noop : onDblClick,
        onMouseEnter,
        onMouseLeave,
        ...getQaDataAttributes(isQaMode, fullNameCompType),
      }}
      autoFocus={autoFocus}
      elementType={elementType}
      linkProps={linkProps}
      a11yProps={a11yProps}
      label={label}
      onFocus={isDisabled ? undefined : onFocus}
      onBlur={isDisabled ? undefined : onBlur}
      ref={ref}
      customClassNames={customClassNames}
    />
  );
};

export default React.forwardRef(SiteButton);
