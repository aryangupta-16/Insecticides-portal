import ExcelJS from 'exceljs';

import { prisma } from '../lib/prisma.js';
import { sortableColumns } from '../utils/constants.js';
import type { QueryFilters } from '../types/domain.js';

function buildWhere(filters: QueryFilters) {
  const search = filters.search?.trim();

  return {
    month: filters.months.length ? { in: filters.months } : undefined,
    year: filters.years.length ? { in: filters.years } : undefined,
    state: filters.states.length ? { in: filters.states } : undefined,
    staff: filters.staffs.length ? { in: filters.staffs } : undefined,
    OR: search
      ? [
          { vp: { contains: search, mode: 'insensitive' as const } },
          { state: { contains: search, mode: 'insensitive' as const } },
          { staff: { contains: search, mode: 'insensitive' as const } },
          { partyId: { contains: search, mode: 'insensitive' as const } },
          { party: { contains: search, mode: 'insensitive' as const } },
        ]
      : undefined,
  };
}

export async function getMonthlyData(filters: QueryFilters) {
  const orderByField = sortableColumns.has(filters.sortBy || '') ? filters.sortBy : 'updatedAt';
  const orderBy = { [orderByField as string]: filters.sortOrder === 'asc' ? 'asc' : 'desc' };
  const page = Math.max(filters.page || 1, 1);
  const requestedPageSize = Math.max(filters.pageSize || 50, 1);
  const pageSize = filters.bypassPageLimit ? requestedPageSize : Math.min(requestedPageSize, 200);
  const skip = (page - 1) * pageSize;
  const where = buildWhere(filters);

  const [rows, totalCount, aggregates, uniquePartyRows] = await prisma.$transaction([
    prisma.monthlyData.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.monthlyData.count({ where }),
    prisma.monthlyData.aggregate({
      where,
      _sum: {
        totalOutstanding: true,
        agingAbove540: true,
      },
    }),
    prisma.monthlyData.findMany({
      where,
      distinct: ['partyId'],
      select: { partyId: true },
    }),
  ]);

  const comments = rows.length
    ? await prisma.comment.findMany({
        where: {
          OR: rows.map((row) => ({
            month: row.month,
            year: row.year,
            rowSequence: row.rowSequence,
          })),
        },
      })
    : [];

  const commentMap = new Map(comments.map((comment) => [`${comment.month}-${comment.year}-${comment.rowSequence}`, comment]));

  const mappedRows = rows.map((row) => {
    const comment = commentMap.get(`${row.month}-${row.year}-${row.rowSequence}`);

    return {
      id: row.id,
      vp: row.vp,
      state: row.state,
      staff: row.staff,
      partyId: row.partyId,
      party: row.party,
      month: row.month,
      year: row.year,
      totalOutstanding: Number(row.totalOutstanding),
      aging121To150: Number(row.aging121To150),
      aging151To180: Number(row.aging151To180),
      aging181To240: Number(row.aging181To240),
      aging241To365: Number(row.aging241To365),
      aging366To540: Number(row.aging366To540),
      agingAbove540: Number(row.agingAbove540),
      rowSequence: row.rowSequence,
      zmComment: comment?.zmComment || '',
      staffComment: comment?.staffComment || '',
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return {
    rows: mappedRows,
    summary: {
      totalOutstanding: Number(aggregates._sum.totalOutstanding || 0),
      highAging: Number(aggregates._sum.agingAbove540 || 0),
      uniqueParties: uniquePartyRows.length,
      totalRecords: totalCount,
    },
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    },
  };
}

export async function getFilterOptions() {
  const [months, years, states, staffs] = await Promise.all([
    prisma.monthlyData.findMany({ distinct: ['month'], select: { month: true }, orderBy: { month: 'asc' } }),
    prisma.monthlyData.findMany({ distinct: ['year'], select: { year: true }, orderBy: { year: 'desc' } }),
    prisma.monthlyData.findMany({ distinct: ['state'], select: { state: true }, orderBy: { state: 'asc' } }),
    prisma.monthlyData.findMany({ distinct: ['staff'], select: { staff: true }, orderBy: { staff: 'asc' } }),
  ]);

  return {
    months: months.map((item) => item.month),
    years: years.map((item) => item.year),
    states: states.map((item) => item.state),
    staffs: staffs.map((item) => item.staff),
  };
}

export async function updateComment(id: string, field: 'zmComment' | 'staffComment', value: string) {
  const record = await prisma.monthlyData.findUnique({
    where: { id },
    select: { month: true, year: true, rowSequence: true },
  });

  if (!record) {
    throw new Error('Row not found');
  }

  return prisma.comment.upsert({
    where: {
      month_year_rowSequence: {
        month: record.month,
        year: record.year,
        rowSequence: record.rowSequence,
      },
    },
    create: {
      month: record.month,
      year: record.year,
      rowSequence: record.rowSequence,
      zmComment: field === 'zmComment' ? value : '',
      staffComment: field === 'staffComment' ? value : '',
    },
    update: {
      [field]: value,
    },
  });
}

export async function buildExportWorkbook(filters: QueryFilters) {
  const { rows } = await getMonthlyData({
    ...filters,
    page: 1,
    pageSize: 100000,
    bypassPageLimit: true,
  });
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Data');

  worksheet.columns = [
    { header: 'VP', key: 'vp', width: 20 },
    { header: 'State', key: 'state', width: 18 },
    { header: 'Staff', key: 'staff', width: 22 },
    { header: 'Party Id', key: 'partyId', width: 18 },
    { header: 'Party', key: 'party', width: 28 },
    { header: 'Month', key: 'month', width: 14 },
    { header: 'Year', key: 'year', width: 10 },
    { header: 'Total O/S', key: 'totalOutstanding', width: 18 },
    { header: '121-150', key: 'aging121To150', width: 12 },
    { header: '151-180', key: 'aging151To180', width: 12 },
    { header: '181-240', key: 'aging181To240', width: 12 },
    { header: '241-365', key: 'aging241To365', width: 12 },
    { header: '366-540', key: 'aging366To540', width: 12 },
    { header: '>540', key: 'agingAbove540', width: 12 },
    { header: 'ZM Comment', key: 'zmComment', width: 30 },
    { header: 'Staff Comment', key: 'staffComment', width: 30 },
  ];

  rows.forEach((row) => worksheet.addRow(row));
  worksheet.getRow(1).font = { bold: true };

  return workbook.xlsx.writeBuffer();
}