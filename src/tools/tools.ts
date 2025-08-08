import { getListDatasourcesTool } from './listDatasources/listDatasources.js';
import { getListFieldsTool } from './listFields.js';
import { getListFieldsFixedTool } from './listFieldsFixed.js';
import { getGeneratePulseMetricValueInsightBundleTool } from './pulse/generateMetricValueInsightBundle/generatePulseMetricValueInsightBundleTool.js';
import { getListAllPulseMetricDefinitionsTool } from './pulse/listAllMetricDefinitions/listAllPulseMetricDefinitions.js';
import { getListPulseMetricDefinitionsFromDefinitionIdsTool } from './pulse/listMetricDefinitionsFromDefinitionIds/listPulseMetricDefinitionsFromDefinitionIds.js';
import { getListPulseMetricsFromMetricDefinitionIdTool } from './pulse/listMetricsFromMetricDefinitionId/listPulseMetricsFromMetricDefinitionId.js';
import { getListPulseMetricsFromMetricIdsTool } from './pulse/listMetricsFromMetricIds/listPulseMetricsFromMetricIds.js';
import { getListPulseMetricSubscriptionsTool } from './pulse/listMetricSubscriptions/listPulseMetricSubscriptions.js';
import { getQueryDatasourceTool } from './queryDatasource/queryDatasource.js';
import { getQueryDatasourceFixedTool } from './queryDatasource/queryDatasourceFixed.js';
import { getReadMetadataTool } from './readMetadata.js';
import { getReadMetadataFixedTool } from './readMetadataFixed.js';

export const toolFactories = [
  getListDatasourcesTool,
  getListFieldsTool,
  getListFieldsFixedTool,
  getQueryDatasourceTool,
  getQueryDatasourceFixedTool,
  getReadMetadataTool,
  getReadMetadataFixedTool,
  getListAllPulseMetricDefinitionsTool,
  getListPulseMetricDefinitionsFromDefinitionIdsTool,
  getListPulseMetricsFromMetricDefinitionIdTool,
  getListPulseMetricsFromMetricIdsTool,
  getListPulseMetricSubscriptionsTool,
  getGeneratePulseMetricValueInsightBundleTool,
];
