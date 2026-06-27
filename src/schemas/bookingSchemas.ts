import type { JSONSchemaType } from 'ajv';
import type { BookingPayload } from '../data/bookingData';

export type BookingIdResponse = {
  bookingid: number;
};

export type CreateBookingResponse = {
  bookingid: number;
  booking: BookingPayload;
};

export const bookingIdListSchema: JSONSchemaType<BookingIdResponse[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      bookingid: {
        type: 'number'
      }
    },
    required: ['bookingid'],
    additionalProperties: false
  }
};

export const bookingDetailsSchema: JSONSchemaType<BookingPayload> = {
  type: 'object',
  properties: {
    firstname: {
      type: 'string'
    },
    lastname: {
      type: 'string'
    },
    totalprice: {
      type: 'number'
    },
    depositpaid: {
      type: 'boolean'
    },
    bookingdates: {
      type: 'object',
      properties: {
        checkin: {
          type: 'string'
        },
        checkout: {
          type: 'string'
        }
      },
      required: ['checkin', 'checkout'],
      additionalProperties: false
    },
    additionalneeds: {
      type: 'string'
    }
  },
  required: ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates'],
  additionalProperties: false
};

export const createBookingResponseSchema: JSONSchemaType<CreateBookingResponse> = {
  type: 'object',
  properties: {
    bookingid: {
      type: 'number'
    },
    booking: bookingDetailsSchema
  },
  required: ['bookingid', 'booking'],
  additionalProperties: false
};
