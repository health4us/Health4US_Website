import { withCompController } from '@wix/editor-elements-integrations';
import {
  AnalyticsClicksGroups,
  tryReportAnalyticsClicksBi,
} from '@wix/editor-elements-common-utils';
import {
  IVectorImageMapperProps,
  IVectorImageControllerProps,
  IVectorImageProps,
  IVectorImageStateRefs,
} from '../VectorImage.types';

const compController = withCompController<
  IVectorImageMapperProps,
  IVectorImageControllerProps,
  IVectorImageProps,
  IVectorImageStateRefs
>(({ stateValues, mapperProps }) => {
  const {
    compId,
    language,
    mainPageId,
    fullNameCompType,
    trackClicksAnalytics,
    ...restMapperProps
  } = mapperProps;
  const { toggle, reportBi } = stateValues;

  const reportBiOnClick: IVectorImageControllerProps['reportBiOnClick'] =
    event => {
      const { link } = restMapperProps;

      tryReportAnalyticsClicksBi(reportBi, {
        link,
        language,
        trackClicksAnalytics,
        elementType: fullNameCompType,
        pagesMetadata: { mainPageId },
        element_id: compId ?? event.currentTarget.id,
        elementGroup: AnalyticsClicksGroups.Decorative,
      });
    };

  if (toggle) {
    return {
      ...restMapperProps,
      toggle,
      reportBiOnClick,
      onKeyDown: keyboardEvent => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          void toggle(false);
        }
      },
    };
  }

  return { ...restMapperProps, reportBiOnClick };
});

export default compController;
