export const expectedHeaders = {
  vp: ['vp'],
  state: ['state'],
  staff: ['staff', 'concerned staff'],
  partyId: ['party id', 'partyid'],
  party: ['party'],
  totalOutstanding: ['total o/s', 'total os', 'total outstanding', 'outstanding'],
  aging121To150: ['121-150', '121 to 150', '121_150'],
  aging151To180: ['151-180', '151 to 180', '151_180'],
  aging181To240: ['181-240', '181 to 240', '181_240'],
  aging241To365: ['241-365', '241 to 365', '241_365'],
  aging366To540: ['366-540', '366 to 540', '366_540'],
  agingAbove540: ['>540', 'above 540', '540+'],
  zmComment: ['zm comment'],
  staffComment: ['staff comment', 'concerned staff comment'],
} as const;

export const sortableColumns = new Set([
  'vp',
  'state',
  'staff',
  'partyId',
  'party',
  'month',
  'year',
  'totalOutstanding',
  'updatedAt',
]);