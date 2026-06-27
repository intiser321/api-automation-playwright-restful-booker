export type BookingDates = {
  checkin: string;
  checkout: string;
};

export type BookingPayload = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds: string;
};

export type BookingPayloadOverrides = Partial<Omit<BookingPayload, 'bookingdates'>> & {
  bookingdates?: Partial<BookingDates>;
};

export function buildBookingPayload(overrides: BookingPayloadOverrides = {}): BookingPayload {
  const defaultPayload: BookingPayload = {
    firstname: 'Intiser',
    lastname: 'Chowdhury',
    totalprice: 250,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-07-01',
      checkout: '2026-07-05'
    },
    additionalneeds: 'Breakfast'
  };

  return {
    ...defaultPayload,
    ...overrides,
    bookingdates: {
      ...defaultPayload.bookingdates,
      ...overrides.bookingdates
    }
  };
}
