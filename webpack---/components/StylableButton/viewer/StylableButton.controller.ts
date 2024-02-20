import {
  IPlatformData,
  withCompController,
} from '@wix/editor-elements-integrations';
import {
  AnalyticsClicksGroups,
  tryReportAnalyticsClicksBi,
} from '@wix/editor-elements-common-utils';
import {
  IStylableButtonMapperProps,
  IStylableButtonControllerProps,
  IStylableButtonStateValues,
  IStylableButtonProps,
} from '../StylableButton.types';

const useComponentProps = ({
  mapperProps,
  stateValues,
}: IPlatformData<
  IStylableButtonMapperProps,
  IStylableButtonControllerProps,
  IStylableButtonStateValues
>): IStylableButtonProps => {
  const {
    trackClicksAnalytics,
    compId,
    language,
    mainPageId,
    ...restMapperProps
  } = mapperProps;

  const reportBiOnClick: IStylableButtonProps['onClick'] = event => {
    const { fullNameCompType, label, link, isDisabled } = restMapperProps;
    const { reportBi } = stateValues;

    tryReportAnalyticsClicksBi(reportBi, {
      link,
      language,
      trackClicksAnalytics,
      elementTitle: label ?? '',
      elementType: fullNameCompType,
      pagesMetadata: { mainPageId },
      elementGroup: AnalyticsClicksGroups.Button,
      details: { isDisabled: isDisabled ?? false },
      element_id: compId ?? event.currentTarget.id,
    });
  };

  return {
    ...restMapperProps,
    reportBiOnClick,
  };
};

export default withCompController(useComponentProps);
