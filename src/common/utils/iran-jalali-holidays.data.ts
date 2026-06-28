/** تعطیلات رسمی ملی ایران (غیر از جمعه‌ها) */
export const IRAN_OFFICIAL_HOLIDAYS: Record<
  number,
  ReadonlyArray<{ month: number; day: number }>
> = {
  1403: [
    { month: 1, day: 1 }, { month: 1, day: 2 }, { month: 1, day: 3 }, { month: 1, day: 4 },
    { month: 1, day: 12 }, { month: 1, day: 13 }, { month: 1, day: 22 }, { month: 1, day: 23 },
    { month: 2, day: 2 }, { month: 3, day: 14 }, { month: 3, day: 15 }, { month: 3, day: 25 },
    { month: 4, day: 14 }, { month: 4, day: 15 }, { month: 5, day: 23 }, { month: 6, day: 2 },
    { month: 6, day: 10 }, { month: 6, day: 19 }, { month: 7, day: 3 }, { month: 8, day: 3 },
    { month: 10, day: 13 }, { month: 11, day: 22 }, { month: 12, day: 20 }, { month: 12, day: 29 },
  ],
  1404: [
    { month: 1, day: 1 }, { month: 1, day: 2 }, { month: 1, day: 3 }, { month: 1, day: 4 },
    { month: 1, day: 11 }, { month: 1, day: 12 }, { month: 1, day: 13 }, { month: 2, day: 4 },
    { month: 3, day: 14 }, { month: 3, day: 15 }, { month: 3, day: 16 }, { month: 3, day: 24 },
    { month: 4, day: 14 }, { month: 4, day: 15 }, { month: 5, day: 23 }, { month: 6, day: 2 },
    { month: 6, day: 10 }, { month: 6, day: 19 }, { month: 7, day: 3 }, { month: 8, day: 3 },
    { month: 10, day: 13 }, { month: 11, day: 15 }, { month: 11, day: 22 }, { month: 12, day: 20 },
    { month: 12, day: 29 },
  ],
  1405: [
    { month: 1, day: 1 }, { month: 1, day: 2 }, { month: 1, day: 3 }, { month: 1, day: 4 },
    { month: 1, day: 12 }, { month: 1, day: 13 }, { month: 1, day: 24 }, { month: 3, day: 3 },
    { month: 3, day: 6 }, { month: 3, day: 14 }, { month: 3, day: 15 }, { month: 4, day: 3 },
    { month: 4, day: 4 }, { month: 4, day: 15 }, { month: 5, day: 13 }, { month: 5, day: 21 },
    { month: 6, day: 8 }, { month: 8, day: 22 }, { month: 10, day: 2 }, { month: 10, day: 14 },
    { month: 10, day: 16 }, { month: 11, day: 4 }, { month: 11, day: 22 }, { month: 12, day: 9 },
    { month: 12, day: 19 }, { month: 12, day: 20 }, { month: 12, day: 29 },
  ],
  1406: [
    { month: 1, day: 1 }, { month: 1, day: 2 }, { month: 1, day: 3 }, { month: 1, day: 4 },
    { month: 1, day: 12 }, { month: 1, day: 13 }, { month: 3, day: 14 }, { month: 3, day: 15 },
    { month: 11, day: 22 }, { month: 12, day: 29 },
  ],
  1407: [
    { month: 1, day: 1 }, { month: 1, day: 2 }, { month: 1, day: 3 }, { month: 1, day: 4 },
    { month: 1, day: 12 }, { month: 1, day: 13 }, { month: 3, day: 14 }, { month: 3, day: 15 },
    { month: 11, day: 22 }, { month: 12, day: 29 },
  ],
};

export const IRAN_FIXED_SOLAR_HOLIDAYS: ReadonlyArray<{ month: number; day: number }> = [
  { month: 1, day: 1 }, { month: 1, day: 2 }, { month: 1, day: 3 }, { month: 1, day: 4 },
  { month: 1, day: 12 }, { month: 1, day: 13 }, { month: 3, day: 14 }, { month: 3, day: 15 },
  { month: 11, day: 22 }, { month: 12, day: 29 },
];
