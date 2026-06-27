import { expect, test } from '@playwright/test';
import { BookingClient } from '../../src/api/bookingClient';
import { buildBookingPayload } from '../../src/data/bookingData';
import { createAuthToken } from '../../src/helpers/authHelper';
import { validateSchema } from '../../src/helpers/schemaValidator';
import {
  bookingDetailsSchema,
  bookingIdListSchema,
  createBookingResponseSchema
} from '../../src/schemas/bookingSchemas';

test('TC2 - GET /booking should return booking ids @regression', async ({ request }) => {
  const bookingClient = new BookingClient(request);
  const response = await bookingClient.getBookingIds();

  expect(response.status()).toBe(200);
  const responseBody = await response.json();
  const bookingIds = validateSchema(bookingIdListSchema, responseBody);
  expect(bookingIds.length).toBeGreaterThan(0);
});

test('TC3 - GET /booking/{id} should return booking details @regression', async ({ request }) => {
  const bookingClient = new BookingClient(request);
  const allBookingIdResponse = await bookingClient.getBookingIds();
  expect(allBookingIdResponse.status()).toBe(200);
  const allBookingIdResponseBody = validateSchema(
    bookingIdListSchema,
    await allBookingIdResponse.json()
  );
  expect(allBookingIdResponseBody.length).toBeGreaterThan(0);

  const urlParameter = allBookingIdResponseBody[0].bookingid;

  const bookingInfoResponse = await bookingClient.getBookingById(urlParameter);
  expect(bookingInfoResponse.status()).toBe(200);
  validateSchema(bookingDetailsSchema, await bookingInfoResponse.json());
});

test('TC4 - GET /booking/{id} should return 404 for invalid booking id @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const response = await bookingClient.getBookingById(999999999);

  expect(response.status()).toBe(404);
});

test('TC5 - POST /booking should create a booking @smoke @regression', async ({ request }) => {
  const bookingClient = new BookingClient(request);
  const bookingPayload = buildBookingPayload();

  const response = await bookingClient.createBooking(bookingPayload);

  expect(response.status()).toBe(200);

  const createdBooking = validateSchema(createBookingResponseSchema, await response.json());

  expect(createdBooking.booking).toMatchObject(bookingPayload);

  const token = await createAuthToken(request);

  const cleanupResponse = await bookingClient.deleteBooking(createdBooking.bookingid, token);

  expect(cleanupResponse.status()).toBe(201);
});

test('TC6 - GET /booking should filter bookings by firstname and lastname @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const uniqueValue = Date.now();
  const bookingPayload = buildBookingPayload({
    firstname: `Intiser${uniqueValue}`,
    lastname: `Chowdhury${uniqueValue}`,
    totalprice: 300,
    depositpaid: false,
    bookingdates: {
      checkin: '2026-08-01',
      checkout: '2026-08-05'
    },
    additionalneeds: 'Lunch'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  const createdBookingId = createBookingResponseBody.bookingid;

  const filterBookingResponse = await bookingClient.filterBookingsByName(
    bookingPayload.firstname,
    bookingPayload.lastname
  );

  expect(filterBookingResponse.status()).toBe(200);

  const filterBookingResponseBody = validateSchema(
    bookingIdListSchema,
    await filterBookingResponse.json()
  );

  expect(filterBookingResponseBody.length).toBeGreaterThan(0);
  expect(filterBookingResponseBody).toContainEqual({ bookingid: createdBookingId });

  const bookingDetailsResponse = await bookingClient.getBookingById(createdBookingId);

  expect(bookingDetailsResponse.status()).toBe(200);

  const bookingDetailsResponseBody = validateSchema(
    bookingDetailsSchema,
    await bookingDetailsResponse.json()
  );

  expect(bookingDetailsResponseBody).toMatchObject(bookingPayload);

  const token = await createAuthToken(request);

  const cleanupResponse = await bookingClient.deleteBooking(createdBookingId, token);

  expect(cleanupResponse.status()).toBe(201);
});

test('TC8 - DELETE /booking/{id} should delete a booking with valid token @smoke @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const token = await createAuthToken(request);

  const bookingPayload = buildBookingPayload({
    firstname: 'Delete',
    lastname: 'Me',
    totalprice: 150,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-01',
      checkout: '2026-09-03'
    },
    additionalneeds: 'None'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  const bookingId = createBookingResponseBody.bookingid;

  const deleteBookingResponse = await bookingClient.deleteBooking(bookingId, token);

  expect(deleteBookingResponse.status()).toBe(201);

  const getDeletedBookingResponse = await bookingClient.getBookingById(bookingId);

  expect(getDeletedBookingResponse.status()).toBe(404);
});

test('TC9 - DELETE /booking/{id} should return 403 without auth token @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const bookingPayload = buildBookingPayload({
    firstname: 'Unauthorized',
    lastname: 'Delete',
    totalprice: 180,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'None'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  const bookingId = createBookingResponseBody.bookingid;

  const deleteWithoutTokenResponse = await bookingClient.deleteBooking(bookingId);

  expect(deleteWithoutTokenResponse.status()).toBe(403);

  const token = await createAuthToken(request);

  const cleanupResponse = await bookingClient.deleteBooking(bookingId, token);

  expect(cleanupResponse.status()).toBe(201);
});

test('TC10 - POST /booking should reject booking when firstname is missing @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const { firstname: _removedFirstname, ...invalidBookingPayload } = buildBookingPayload();

  const response = await bookingClient.createBooking(invalidBookingPayload);

  // Restful Booker rejects this payload with 500. In a production API, 400 would be clearer.
  expect(response.status()).toBe(500);
});

test('TC11 - PUT /booking should update the existing booking @smoke @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const bookingPayload = buildBookingPayload({
    firstname: 'PUT',
    lastname: 'Test',
    totalprice: 180,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'None'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);
  expect(createBookingResponse.status()).toBe(200);
  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  expect(createBookingResponseBody.booking).toMatchObject(bookingPayload);
  const bookingId = createBookingResponseBody.bookingid;

  const updatedBookingPayload = buildBookingPayload({
    firstname: 'PUTUPDATED',
    lastname: 'TestUPDATED',
    totalprice: 100,
    depositpaid: false,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'Breakfast'
  });

  const token = await createAuthToken(request);

  const putBookingResponse = await bookingClient.updateBooking(
    bookingId,
    updatedBookingPayload,
    token
  );

  expect(putBookingResponse.status()).toBe(200);

  const putBookingResponseBody = validateSchema(
    bookingDetailsSchema,
    await putBookingResponse.json()
  );
  expect(putBookingResponseBody).toMatchObject(updatedBookingPayload);

  const getUpdatedBookingResponse = await bookingClient.getBookingById(bookingId);
  expect(getUpdatedBookingResponse.status()).toBe(200);

  const getUpdatedBookingResponseBody = validateSchema(
    bookingDetailsSchema,
    await getUpdatedBookingResponse.json()
  );
  expect(getUpdatedBookingResponseBody).toMatchObject(updatedBookingPayload);

  const cleanupResponse = await bookingClient.deleteBooking(bookingId, token);

  expect(cleanupResponse.status()).toBe(201);
});

test('TC12 - PUT /booking/{id} should return 403 without auth token @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const bookingPayload = buildBookingPayload({
    firstname: 'Unauthorized',
    lastname: 'Update',
    totalprice: 180,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'None'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  const bookingId = createBookingResponseBody.bookingid;

  const updatedBookingPayload = buildBookingPayload({
    firstname: 'UnauthorizedUpdated',
    lastname: 'UpdateUpdated',
    totalprice: 200,
    depositpaid: false,
    bookingdates: {
      checkin: '2026-10-10',
      checkout: '2026-10-12'
    },
    additionalneeds: 'Breakfast'
  });

  const putWithoutTokenResponse = await bookingClient.updateBooking(
    bookingId,
    updatedBookingPayload
  );

  expect(putWithoutTokenResponse.status()).toBe(403);

  const token = await createAuthToken(request);

  const cleanupResponse = await bookingClient.deleteBooking(bookingId, token);

  expect(cleanupResponse.status()).toBe(201);
});

test('TC13 - PATCH /booking/{id} should partially update a booking with valid token @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const token = await createAuthToken(request);

  const bookingPayload = buildBookingPayload({
    firstname: 'Patch',
    lastname: 'Test',
    totalprice: 220,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-11-10',
      checkout: '2026-11-12'
    },
    additionalneeds: 'Dinner'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  const bookingId = createBookingResponseBody.bookingid;

  const partialUpdatePayload = {
    firstname: 'Patched',
    lastname: 'Updated'
  };

  const patchBookingResponse = await bookingClient.partialUpdateBooking(
    bookingId,
    partialUpdatePayload,
    token
  );

  expect(patchBookingResponse.status()).toBe(200);

  const patchBookingResponseBody = validateSchema(
    bookingDetailsSchema,
    await patchBookingResponse.json()
  );

  expect(patchBookingResponseBody.firstname).toBe(partialUpdatePayload.firstname);
  expect(patchBookingResponseBody.lastname).toBe(partialUpdatePayload.lastname);
  expect(patchBookingResponseBody.totalprice).toBe(bookingPayload.totalprice);
  expect(patchBookingResponseBody.depositpaid).toBe(bookingPayload.depositpaid);
  expect(patchBookingResponseBody.bookingdates).toMatchObject(bookingPayload.bookingdates);
  expect(patchBookingResponseBody.additionalneeds).toBe(bookingPayload.additionalneeds);

  const getPatchedBookingResponse = await bookingClient.getBookingById(bookingId);

  expect(getPatchedBookingResponse.status()).toBe(200);

  const getPatchedBookingResponseBody = validateSchema(
    bookingDetailsSchema,
    await getPatchedBookingResponse.json()
  );

  expect(getPatchedBookingResponseBody).toMatchObject({
    ...bookingPayload,
    ...partialUpdatePayload
  });

  const cleanupResponse = await bookingClient.deleteBooking(bookingId, token);

  expect(cleanupResponse.status()).toBe(201);
});

test('TC14 - PATCH /booking/{id} should return 403 without auth token @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const bookingPayload = buildBookingPayload({
    firstname: 'Unauthorized',
    lastname: 'Patch',
    totalprice: 220,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-11-10',
      checkout: '2026-11-12'
    },
    additionalneeds: 'Dinner'
  });

  const createBookingResponse = await bookingClient.createBooking(bookingPayload);

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = validateSchema(
    createBookingResponseSchema,
    await createBookingResponse.json()
  );
  const bookingId = createBookingResponseBody.bookingid;

  const partialUpdatePayload = {
    firstname: 'UnauthorizedPatched',
    lastname: 'PatchUpdated'
  };

  const patchWithoutTokenResponse = await bookingClient.partialUpdateBooking(
    bookingId,
    partialUpdatePayload
  );

  expect(patchWithoutTokenResponse.status()).toBe(403);

  const token = await createAuthToken(request);

  const cleanupResponse = await bookingClient.deleteBooking(bookingId, token);

  expect(cleanupResponse.status()).toBe(201);
});
test('TC15 - POST /booking should allow duplicate booking payloads @regression', async ({
  request
}) => {
  const bookingClient = new BookingClient(request);
  const bookingPayload = buildBookingPayload({
    firstname: 'Duplicate',
    lastname: 'Payload',
    totalprice: 275,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-12-01',
      checkout: '2026-12-05'
    },
    additionalneeds: 'Breakfast'
  });

  const firstCreateResponse = await bookingClient.createBooking(bookingPayload);

  expect(firstCreateResponse.status()).toBe(200);

  const firstCreateResponseBody = validateSchema(
    createBookingResponseSchema,
    await firstCreateResponse.json()
  );
  const firstBookingId = firstCreateResponseBody.bookingid;

  expect(firstCreateResponseBody.booking).toMatchObject(bookingPayload);

  const secondCreateResponse = await bookingClient.createBooking(bookingPayload);

  expect(secondCreateResponse.status()).toBe(200);

  const secondCreateResponseBody = validateSchema(
    createBookingResponseSchema,
    await secondCreateResponse.json()
  );
  const secondBookingId = secondCreateResponseBody.bookingid;

  expect(secondCreateResponseBody.booking).toMatchObject(bookingPayload);
  expect(secondBookingId).not.toBe(firstBookingId);

  const token = await createAuthToken(request);

  const firstCleanupResponse = await bookingClient.deleteBooking(firstBookingId, token);

  expect(firstCleanupResponse.status()).toBe(201);

  const secondCleanupResponse = await bookingClient.deleteBooking(secondBookingId, token);

  expect(secondCleanupResponse.status()).toBe(201);
});
