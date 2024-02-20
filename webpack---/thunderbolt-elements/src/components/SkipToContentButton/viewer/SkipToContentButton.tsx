import * as React from 'react';

import classNames from 'clsx';
import { getDataAttributes } from '@wix/editor-elements-common-utils';
import { ISkipToContentButtonProps } from '../SkipToContentButton.types';
import style from './style/SkipToContentButton.st.scss';

const SkipToContentButton: React.FC<ISkipToContentButtonProps> = props => {
  const { id, className, translations } = props;
  const [isHeaderContainFocusableElements, setHeaderContainFocusableElements] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    const header = document.querySelector('header');

    if (!header) {
      setHeaderContainFocusableElements(false);
    } else {
      setHeaderContainFocusableElements(
        Array.from(
          header.querySelectorAll(
            'a[href], button, input, textarea, select, summary, details, iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])',
          ),
        ).some(
          element =>
            !(
              element.hasAttribute('disabled') ||
              element.getAttribute('aria-hidden') === 'true' ||
              element.getAttribute('aria-disabled') === 'true'
            ),
        ),
      );
    }
  }, []);

  const scrollToMain = () => {
    const mainEl =
      (document.querySelector('[data-main-content]') as HTMLElement) ||
      (document.querySelector(
        '[data-main-content-parent]>section:first-of-type',
      ) as HTMLElement);
    mainEl?.focus();
  };

  if (!isHeaderContainFocusableElements) {
    return null;
  }

  return (
    <button
      id={id}
      {...getDataAttributes(props)}
      key={id}
      className={classNames(
        className,
        style.skipToContentButton,
        'has-custom-focus',
      )}
      tabIndex={0}
      onClick={scrollToMain}
    >
      {translations.buttonLabel}
    </button>
  );
};

export default SkipToContentButton;
