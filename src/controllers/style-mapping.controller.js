import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { parseId, requireString, requireBulkArray, failIfErrors } from '../utils/validators.js';
import * as mappingService from '../services/style-mapping.service.js';

export const saveMapping = asyncHandler(async (req, res) => {
  const style_number = requireString(req.body.style_number, 'style_number');
  const pattern_number = requireString(req.body.pattern_number, 'pattern_number');
  const data = await mappingService.saveMapping({ style_number, pattern_number });
  res.status(200).json(new ApiResponse(200, 'Pattern mapped to style', data));
});

// CSV upload: [{ style_number, pattern_number }]
export const bulkMappings = asyncHandler(async (req, res) => {
  const list = requireBulkArray(req.body.mappings, 'mappings');
  const errors = [];
  const unique = new Map();

  list.forEach((m, i) => {
    const style = typeof m?.style_number === 'string' ? m.style_number.trim() : '';
    const pattern = typeof m?.pattern_number === 'string' ? m.pattern_number.trim() : '';
    if (!style || !pattern) errors.push(`Row ${i + 1}: style_number and pattern_number are required`);
    else unique.set(style, pattern);
  });
  failIfErrors(errors);

  const result = await mappingService.bulkSaveMappings([...unique]);
  res.status(200).json(new ApiResponse(200, 'Styles saved', result));
});

export const listStyles = asyncHandler(async (_req, res) => {
  res.status(200).json(new ApiResponse(200, 'Styles fetched', await mappingService.listStyles()));
});

export const getStyleDetails = asyncHandler(async (req, res) => {
  const data = await mappingService.getStyleDetails(requireString(req.params.styleNumber, 'styleNumber'));
  res.status(200).json(new ApiResponse(200, 'Style details fetched', data));
});

export const deleteMapping = asyncHandler(async (req, res) => {
  await mappingService.deleteMapping(parseId(req.params.id));
  res.status(200).json(new ApiResponse(200, 'Mapping deleted'));
});
