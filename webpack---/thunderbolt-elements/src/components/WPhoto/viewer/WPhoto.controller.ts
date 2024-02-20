import { withCompController } from '@wix/editor-elements-integrations';
import {
  AnalyticsClicksGroups,
  tryReportAnalyticsClicksBi,
} from '@wix/editor-elements-common-utils';
import type {
  IWPhotoProps,
  IWPhotoControllerProps,
  IWPhotoStateValues,
  IWPhotoMapperProps,
} from '../WPhoto.types';

export default withCompController<
  IWPhotoMapperProps,
  IWPhotoControllerProps,
  IWPhotoProps,
  IWPhotoStateValues
>(({ controllerUtils, mapperProps, stateValues }) => {
  const { reportBi } = stateValues;
  const {
    compId,
    language,
    mainPageId,
    fullNameCompType,
    trackClicksAnalytics,
    ...restMapperProps
  } = mapperProps;

  const reportBiOnClick: IWPhotoControllerProps['reportBiOnClick'] = () => {
    const { link, title, uri } = restMapperProps;

    tryReportAnalyticsClicksBi(reportBi, {
      link,
      language,
      trackClicksAnalytics,
      details: { uri },
      element_id: compId,
      elementTitle: title,
      elementType: fullNameCompType,
      pagesMetadata: { mainPageId },
      elementGroup: AnalyticsClicksGroups.Image,
    });
  };

  return {
    ...restMapperProps,
    reportBiOnClick,
    onSizeChange: (width, height) => {
      controllerUtils.updateProps({ width, height });
    },
  };
});
