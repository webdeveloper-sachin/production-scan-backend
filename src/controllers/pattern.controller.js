import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { parseId, requireString, requireRate, requireBulkArray, failIfErrors } from '../utils/validators.js';
import * as patternService from '../services/pattern.service.js';

export const createPattern = asyncHandler(async (req, res) => {
  const pattern_number = requireString(req.body.pattern_number, 'pattern_number');
  const rate = requireRate(req.body.rate);
  res.status(201).json(new ApiResponse(201, 'Pattern created', await patternService.createPattern({ pattern_number, rate })));
});

// CSV upload: [{ pattern_number, rate }]
export const bulkPatterns = asyncHandler(async (req, res) => {
  const list = requireBulkArray(req.body.patterns, 'patterns');
  const errors = [];
  const unique = new Map(); // duplicate pattern ho to last row jeetegi

  list.forEach((p, i) => {
    const num = typeof p?.pattern_number === 'string' ? p.pattern_number.trim() : '';
    const rate = Number(p?.rate);
    if (!num) errors.push(`Row ${i + 1}: pattern_number is required`);
    else if (p.rate === '' || p.rate == null || !Number.isFinite(rate) || rate < 0) errors.push(`Row ${i + 1}: rate must be a number >= 0`);
    else unique.set(num, rate);
  });
  failIfErrors(errors);

  const result = await patternService.bulkUpsertPatterns([...unique]);
  res.status(200).json(new ApiResponse(200, 'Rates saved', result));
});

export const listPatterns = asyncHandler(async (_req, res) => {
  res.status(200).json(new ApiResponse(200, 'Patterns fetched', await patternService.listPatterns()));
});

export const getPattern = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Pattern fetched', await patternService.getPatternById(parseId(req.params.id))));
});

export const updatePatternRate = asyncHandler(async (req, res) => {
  const pattern = await patternService.updatePatternRate(parseId(req.params.id), requireRate(req.body.rate));
  res.status(200).json(new ApiResponse(200, 'Pattern rate updated', pattern));
});

export const deletePattern = asyncHandler(async (req, res) => {
  await patternService.deletePattern(parseId(req.params.id));
  res.status(200).json(new ApiResponse(200, 'Pattern deleted'));
});
