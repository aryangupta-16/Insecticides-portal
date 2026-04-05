import { Router } from 'express';
import { z } from 'zod';

import { buildExportWorkbook, getFilterOptions, getMonthlyData, updateComment } from '../services/dataService.js';
import { toArrayParam } from '../utils/helpers.js';

const querySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});

export const dataRouter = Router();

dataRouter.get('/', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const result = await getMonthlyData({
      months: toArrayParam(req.query.months),
      years: toArrayParam(req.query.years).map(Number).filter(Number.isFinite),
      states: toArrayParam(req.query.states),
      staffs: toArrayParam(req.query.staffs),
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      pageSize: query.pageSize,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

dataRouter.get('/filters', async (_req, res, next) => {
  try {
    const filters = await getFilterOptions();
    res.json(filters);
  } catch (error) {
    next(error);
  }
});

dataRouter.patch('/comments/:id', async (req, res, next) => {
  try {
    const body = z
      .object({
        field: z.enum(['zmComment', 'staffComment']),
        value: z.string().max(5000),
      })
      .parse(req.body);

    const comment = await updateComment(req.params.id, body.field, body.value);
    res.json({ comment });
  } catch (error) {
    next(error);
  }
});

dataRouter.get('/export', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const buffer = await buildExportWorkbook({
      months: toArrayParam(req.query.months),
      years: toArrayParam(req.query.years).map(Number).filter(Number.isFinite),
      states: toArrayParam(req.query.states),
      staffs: toArrayParam(req.query.staffs),
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="monthly-data-export.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
});