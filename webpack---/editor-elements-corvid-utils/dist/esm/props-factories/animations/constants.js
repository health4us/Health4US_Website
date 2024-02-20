export const sharedEffectDefaultOptions = {
    duration: 1200,
    delay: 0,
};
export const effectDefaultOptions = {
    arc: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    bounce: {
        ...sharedEffectDefaultOptions,
        direction: 'topLeft',
        intensity: 'medium',
    },
    puff: {
        ...sharedEffectDefaultOptions,
    },
    zoom: {
        ...sharedEffectDefaultOptions,
    },
    fade: {
        ...sharedEffectDefaultOptions,
    },
    flip: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    float: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    fly: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    fold: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    glide: {
        ...sharedEffectDefaultOptions,
        angle: 0,
        distance: 0,
    },
    roll: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    slide: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    spin: {
        ...sharedEffectDefaultOptions,
        direction: 'cw',
        cycles: 5,
    },
    turn: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    ArcIn: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    ArcOut: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    BounceIn: {
        ...sharedEffectDefaultOptions,
        direction: 'topLeft',
        intensity: 'medium',
    },
    BounceOut: {
        ...sharedEffectDefaultOptions,
        direction: 'topLeft',
        intensity: 'medium',
    },
    ExpandIn: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    CollapseOut: {
        ...sharedEffectDefaultOptions,
    },
    Conceal: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    Reveal: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    FadeIn: {
        ...sharedEffectDefaultOptions,
    },
    FadeOut: {
        ...sharedEffectDefaultOptions,
    },
    FlipIn: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    FlipOut: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    FloatIn: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    FloatOut: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    FlyIn: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    FlyOut: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    FoldIn: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    FoldOut: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    GlideIn: {
        ...sharedEffectDefaultOptions,
        angle: 0,
        distance: 150,
    },
    GlideOut: {
        ...sharedEffectDefaultOptions,
        angle: 0,
        distance: 150,
    },
    DropIn: {
        ...sharedEffectDefaultOptions,
    },
    PopOut: {
        ...sharedEffectDefaultOptions,
    },
    SlideIn: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    SlideOut: {
        ...sharedEffectDefaultOptions,
        direction: 'left',
    },
    SpinIn: {
        ...sharedEffectDefaultOptions,
        direction: 'cw',
        cycles: 2,
    },
    SpinOut: {
        ...sharedEffectDefaultOptions,
        direction: 'cw',
        cycles: 2,
    },
    TurnIn: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
    TurnOut: {
        ...sharedEffectDefaultOptions,
        direction: 'right',
    },
};
export const EFFECTS = {
    HIDE: {
        suffix: 'out',
        deprecatedValues: [
            'ArcOut',
            'BounceOut',
            'CollapseOut',
            'Conceal',
            'FadeOut',
            'FlipOut',
            'FloatOut',
            'FlyOut',
            'FoldOut',
            'GlideOut',
            'PopOut',
            'SlideOut',
            'SpinOut',
            'TurnOut',
        ],
    },
    SHOW: {
        suffix: 'in',
        deprecatedValues: [
            'ArcIn',
            'BounceIn',
            'DropIn',
            'ExpandIn',
            'FadeIn',
            'FlipIn',
            'FloatIn',
            'FlyIn',
            'FoldIn',
            'GlideIn',
            'Reveal',
            'SlideIn',
            'SpinIn',
            'TurnIn',
        ],
    },
};
export const effectInfoLink = (propertyName) => `https://www.wix.com/corvid/reference/$w/hiddenmixin/${propertyName}`;
//# sourceMappingURL=constants.js.map