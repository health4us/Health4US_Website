import { scalePreset } from '../../common/constants/defaultPresets';

export const TestIds = {
  buttonContent: 'buttonContent',
  buttonLabel: 'stylablebutton-label',
  buttonIcon: 'stylablebutton-icon',
  layoutPanel: {
    root: 'stylablebutton-layoutPanel',
    buttonFlowThumbnails: 'stylablebutton-layoutPanel-buttonFlow',
    alignmentThumbnails: 'stylablebutton-layoutPanel-alignment',
    iconLabelSpacingSlider: 'stylablebutton-layoutPanel-iconLabelSpacing',
    buttonTypeDropDown: 'stylablebutton-layoutPanel-buttonType',
    buttonMaxContentBtnGroup: 'stylablebutton-layoutPanel-buttonMaxContent',
    buttonIsWrapTextToggle: 'stylablebutton-layoutPanel-wrapText',
  },
};

export const stylableSelectors = {
  root: '.root',
  container: '.root::container',
  label: '.root::label',
  icon: '.root::icon',
};

export const sizingBehaviorPresets = {
  Scale: scalePreset,
  RelativeWidth: {
    key: 'RelativeWidth',
    propsToApply: {
      componentLayout: {
        width: 'percentage',
        height: 'px',
        minWidth: 'none',
        maxWidth: 'none',
        minHeight: 'none',
        maxHeight: 'none',
      },
    },
    propsToValidate: {
      componentLayout: ['width', 'minWidth', 'maxWidth'],
    },
  },
  Fixed: {
    key: 'Fixed',
    propsToApply: {
      componentLayout: {
        height: 'px',
        width: 'px',
        minHeight: 'none',
        maxHeight: 'none',
        minWidth: 'none',
        maxWidth: 'none',
      },
    },
    propsToValidate: {
      componentLayout: [
        'width',
        'height',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ],
    },
  },
};
