import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { BookingPayload } from '../data/bookingData';

export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  async getBookingIds(): Promise<APIResponse> {
    return this.request.get('/booking');
  }

  async getBookingById(bookingId: number): Promise<APIResponse> {
    return this.request.get(`/booking/${bookingId}`);
  }

  async filterBookingsByName(firstname: string, lastname: string): Promise<APIResponse> {
    return this.request.get(`/booking?firstname=${firstname}&lastname=${lastname}`);
  }

  async createBooking(bookingPayload: unknown): Promise<APIResponse> {
    return this.request.post('/booking', {
      data: bookingPayload
    });
  }

  async updateBooking(
    bookingId: number,
    bookingPayload: BookingPayload,
    token?: string
  ): Promise<APIResponse> {
    return this.request.put(`/booking/${bookingId}`, {
      headers: this.getAuthHeaders(token),
      data: bookingPayload
    });
  }

  async partialUpdateBooking(
    bookingId: number,
    partialBookingPayload: Partial<BookingPayload>,
    token?: string
  ): Promise<APIResponse> {
    return this.request.patch(`/booking/${bookingId}`, {
      headers: this.getAuthHeaders(token),
      data: partialBookingPayload
    });
  }

  async deleteBooking(bookingId: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${bookingId}`, {
      headers: this.getAuthHeaders(token)
    });
  }

  private getAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
      return {};
    }

    return {
      Cookie: `token=${token}`
    };
  }
}
