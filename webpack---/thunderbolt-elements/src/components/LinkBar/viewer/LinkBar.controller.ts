import {
  IPlatformData,
  withCompController,
} from '@wix/editor-elements-integrations';
import {
  AnalyticsClicksGroups,
  tryReportAnalyticsClicksBi,
} from '@wix/editor-elements-common-utils';
import { ImageProps } from '@wix/thunderbolt-components-native';
import {
  LinkBarProps,
  LinkBarMapperProps,
  LinkBarStateValues,
  LinkBarControllerProps,
} from '../LinkBar.types';

const useComponentProps = ({
  mapperProps,
  stateValues,
}: IPlatformData<
  LinkBarMapperProps,
  LinkBarControllerProps,
  LinkBarStateValues
>): LinkBarProps => {
  const {
    compId,
    language,
    fullNameCompType,
    trackClicksAnalytics,
    ...restMapperProps
  } = mapperProps;

  const reportBiOnClick = (image: ImageProps) => {
    tryReportAnalyticsClicksBi(stateValues.reportBi, {
      language,
      trackClicksAnalytics,
      element_id: compId,
      value: image.link?.href,
      elementTitle: image.title,
      details: { uri: image.uri },
      elementType: fullNameCompType,
      elementGroup: AnalyticsClicksGroups.Social,
    });
  };

  return {
    ...restMapperProps,
    reportBiOnClick,
  };
};

export default withCompController(useComponentProps);
