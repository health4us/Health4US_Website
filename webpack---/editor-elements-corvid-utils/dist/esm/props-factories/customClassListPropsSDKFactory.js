import {
    handleMandatoryVals,
    handleMandatorySingleVal,
    isValidClassName,
} from './validations/customClassListValidation/customClassListValidation';
export const customClassListPropsSDKFactory = (api) => {
    const {
        setProps,
        props
    } = api;
    return {
        customClassList: {
            get value() {
                return props.customClassNames ? props.customClassNames ? .join(' ') : '';
            },
            values() {
                return props.customClassNames ? props.customClassNames : [];
            },
            add(...classNames) {
                const customClassListSet = props.customClassNames ?
                    new Set(props.customClassNames) :
                    new Set([]);
                if (!classNames.length) {
                    handleMandatorySingleVal('className', 'customClassList.add');
                    return;
                }
                for (const className of classNames) {
                    if (isValidClassName(className, 'customClassList.add')) {
                        customClassListSet.add(className);
                    } else {
                        return;
                    }
                }
                setProps({
                    customClassNames: Array.from(customClassListSet)
                });
            },
            remove(...classNames) {
                if (!classNames.length) {
                    handleMandatorySingleVal('className', 'customClassList.remove');
                    return;
                }
                const customClassListSet = new Set(props.customClassNames);
                for (const className of classNames) {
                    if (isValidClassName(className, 'customClassList.remove')) {
                        customClassListSet.delete(className);
                    } else {
                        return;
                    }
                }
                setProps({
                    customClassNames: Array.from(customClassListSet)
                });
            },
            contains(className) {
                if (!className) {
                    handleMandatorySingleVal('className', 'customClassList.contains');
                    return;
                }
                if (isValidClassName(className, 'customClassList.contains')) {
                    return props.customClassNames ?
                        props.customClassNames.includes(className) :
                        false;
                } else {
                    return;
                }
            },
            replace(currentClassName, newClassName) {
                if (!currentClassName || !newClassName) {
                    handleMandatoryVals(['currentClassName, newClassName'], 'customClassList.replace');
                    return false;
                }
                if (isValidClassName(newClassName, 'customClassList.replace') &&
                    isValidClassName(currentClassName, 'customClassList.replace')) {
                    if (this.contains(currentClassName)) {
                        this.remove(currentClassName);
                        this.add(newClassName);
                        return true;
                    }
                    return false;
                }
                return false;
            },
            toggle(className) {
                if (!className) {
                    handleMandatorySingleVal('className', 'customClassList.toggle');
                    return false;
                }
                if (isValidClassName(className, 'customClassList.toggle')) {
                    if (this.contains(className)) {
                        this.remove(className);
                        return false;
                    } else {
                        this.add(className);
                        return true;
                    }
                }
                return false;
            },
        },
    };
};
//# sourceMappingURL=customClassListPropsSDKFactory.js.map