import { expect, test } from '@playwright/test';

test('TC2 - GET /booking should return booking ids', async ({ request }) => {
  const response = await request.get('/booking');

  expect(response.status()).toBe(200);
  const responseBody = await response.json();
  expect(Array.isArray(responseBody)).toBeTruthy();
  expect(responseBody.length).toBeGreaterThan(0);
  expect(responseBody[0]).toHaveProperty('bookingid');
});

test('TC3 - GET /booking/{id} should return booking details', async ({ request }) => {
  const allBookingIdResponse = await request.get('/booking');
  expect(allBookingIdResponse.status()).toBe(200);
  const allBookingIdResponseBody = await allBookingIdResponse.json();
  expect(Array.isArray(allBookingIdResponseBody)).toBeTruthy();
  expect(allBookingIdResponseBody.length).toBeGreaterThan(0);
  expect(allBookingIdResponseBody[0]).toHaveProperty('bookingid');

  const urlParameter = allBookingIdResponseBody[0].bookingid;

  const bookingInfoResponse = await request.get(`/booking/${urlParameter}`);
  expect(bookingInfoResponse.status()).toBe(200);
  const bookingInfoResponseBody = await bookingInfoResponse.json();

  expect(bookingInfoResponseBody).toHaveProperty('firstname');
  expect(typeof bookingInfoResponseBody.firstname).toBe('string');

  expect(bookingInfoResponseBody).toHaveProperty('lastname');
  expect(typeof bookingInfoResponseBody.lastname).toBe('string');

  expect(bookingInfoResponseBody).toHaveProperty('totalprice');
  expect(typeof bookingInfoResponseBody.totalprice).toBe('number');

  expect(bookingInfoResponseBody).toHaveProperty('depositpaid');
  expect(typeof bookingInfoResponseBody.depositpaid).toBe('boolean');

  expect(bookingInfoResponseBody).toHaveProperty('bookingdates');
  expect(bookingInfoResponseBody.bookingdates).toHaveProperty('checkin');
  expect(typeof bookingInfoResponseBody.bookingdates.checkin).toBe('string');
  expect(bookingInfoResponseBody.bookingdates).toHaveProperty('checkout');
  expect(typeof bookingInfoResponseBody.bookingdates.checkout).toBe('string');

  if (bookingInfoResponseBody.additionalneeds !== undefined) {
    expect(typeof bookingInfoResponseBody.additionalneeds).toBe('string');
  }
});

test('TC4 - GET /booking/{id} should return 404 for invalid booking id', async ({ request }) => {
  const response = await request.get('/booking/999999999');

  expect(response.status()).toBe(404);
});

test('TC5 - POST /booking should create a booking', async ({ request }) => {
  const bookingPayload = {
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

  const response = await request.post('/booking', {
    data: bookingPayload
  });

  expect(response.status()).toBe(200);

  const responseBody = await response.json();

  expect(responseBody).toHaveProperty('bookingid');
  expect(typeof responseBody.bookingid).toBe('number');
  expect(responseBody).toHaveProperty('booking');
  expect(responseBody.booking).toMatchObject(bookingPayload);

  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const cleanupResponse = await request.delete(`/booking/${responseBody.bookingid}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});

test('TC6 - GET /booking should filter bookings by firstname and lastname', async ({ request }) => {
  const uniqueValue = Date.now();
  const bookingPayload = {
    firstname: `Intiser${uniqueValue}`,
    lastname: `Chowdhury${uniqueValue}`,
    totalprice: 300,
    depositpaid: false,
    bookingdates: {
      checkin: '2026-08-01',
      checkout: '2026-08-05'
    },
    additionalneeds: 'Lunch'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = await createBookingResponse.json();
  const createdBookingId = createBookingResponseBody.bookingid;

  const filterBookingResponse = await request.get(
    `/booking?firstname=${bookingPayload.firstname}&lastname=${bookingPayload.lastname}`
  );

  expect(filterBookingResponse.status()).toBe(200);

  const filterBookingResponseBody = await filterBookingResponse.json();

  expect(Array.isArray(filterBookingResponseBody)).toBeTruthy();
  expect(filterBookingResponseBody.length).toBeGreaterThan(0);
  expect(filterBookingResponseBody).toContainEqual({ bookingid: createdBookingId });

  const bookingDetailsResponse = await request.get(`/booking/${createdBookingId}`);

  expect(bookingDetailsResponse.status()).toBe(200);

  const bookingDetailsResponseBody = await bookingDetailsResponse.json();

  expect(bookingDetailsResponseBody).toMatchObject(bookingPayload);

  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const cleanupResponse = await request.delete(`/booking/${createdBookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});

test('TC8 - DELETE /booking/{id} should delete a booking with valid token', async ({ request }) => {
  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const bookingPayload = {
    firstname: 'Delete',
    lastname: 'Me',
    totalprice: 150,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-01',
      checkout: '2026-09-03'
    },
    additionalneeds: 'None'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = await createBookingResponse.json();
  const bookingId = createBookingResponseBody.bookingid;

  const deleteBookingResponse = await request.delete(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(deleteBookingResponse.status()).toBe(201);

  const getDeletedBookingResponse = await request.get(`/booking/${bookingId}`);

  expect(getDeletedBookingResponse.status()).toBe(404);
});

test('TC9 - DELETE /booking/{id} should return 403 without auth token', async ({ request }) => {
  const bookingPayload = {
    firstname: 'Unauthorized',
    lastname: 'Delete',
    totalprice: 180,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'None'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = await createBookingResponse.json();
  const bookingId = createBookingResponseBody.bookingid;

  const deleteWithoutTokenResponse = await request.delete(`/booking/${bookingId}`);

  expect(deleteWithoutTokenResponse.status()).toBe(403);

  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const cleanupResponse = await request.delete(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});

test('TC10 - POST /booking should reject booking when firstname is missing', async ({
  request
}) => {
  const invalidBookingPayload = {
    lastname: 'Chowdhury',
    totalprice: 250,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-07-01',
      checkout: '2026-07-05'
    },
    additionalneeds: 'Breakfast'
  };

  const response = await request.post('/booking', {
    data: invalidBookingPayload
  });

  // Restful Booker rejects this payload with 500. In a production API, 400 would be clearer.
  expect(response.status()).toBe(500);
});

test('TC11 - PUT /booking should update the existing booking', async ({ request }) => {
  const bookingPayload = {
    firstname: 'PUT',
    lastname: 'Test',
    totalprice: 180,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'None'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });
  expect(createBookingResponse.status()).toBe(200);
  const createBookingResponseBody = await createBookingResponse.json();
  expect(createBookingResponseBody).toHaveProperty('bookingid');
  expect(typeof createBookingResponseBody.bookingid).toBe('number');
  expect(createBookingResponseBody).toHaveProperty('booking');
  expect(createBookingResponseBody.booking).toMatchObject(bookingPayload);
  const bookingId = createBookingResponseBody.bookingid;

  const updatedBookingPayload = {
    firstname: 'PUTUPDATED',
    lastname: 'TestUPDATED',
    totalprice: 100,
    depositpaid: false,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'Breakfast'
  };

  const authPayload = {
    username: 'admin',
    password: 'password123'
  };

  const authResponse = await request.post('/auth', {
    data: authPayload
  });
  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  expect(authResponseBody).toHaveProperty('token');
  const token = authResponseBody.token;

  const putBookingResponse = await request.put(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    },
    data: updatedBookingPayload
  });

  expect(putBookingResponse.status()).toBe(200);

  const putBookingResponseBody = await putBookingResponse.json();
  expect(putBookingResponseBody).toMatchObject(updatedBookingPayload);

  const getUpdatedBookingResponse = await request.get(`/booking/${bookingId}`);
  expect(getUpdatedBookingResponse.status()).toBe(200);

  const getUpdatedBookingResponseBody = await getUpdatedBookingResponse.json();
  expect(getUpdatedBookingResponseBody).toMatchObject(updatedBookingPayload);

  const cleanupResponse = await request.delete(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});

test('TC12 - PUT /booking/{id} should return 403 without auth token', async ({ request }) => {
  const bookingPayload = {
    firstname: 'Unauthorized',
    lastname: 'Update',
    totalprice: 180,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-09-10',
      checkout: '2026-09-12'
    },
    additionalneeds: 'None'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = await createBookingResponse.json();
  const bookingId = createBookingResponseBody.bookingid;

  const updatedBookingPayload = {
    firstname: 'UnauthorizedUpdated',
    lastname: 'UpdateUpdated',
    totalprice: 200,
    depositpaid: false,
    bookingdates: {
      checkin: '2026-10-10',
      checkout: '2026-10-12'
    },
    additionalneeds: 'Breakfast'
  };

  const putWithoutTokenResponse = await request.put(`/booking/${bookingId}`, {
    data: updatedBookingPayload
  });

  expect(putWithoutTokenResponse.status()).toBe(403);

  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const cleanupResponse = await request.delete(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});

test('TC13 - PATCH /booking/{id} should partially update a booking with valid token', async ({
  request
}) => {
  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const bookingPayload = {
    firstname: 'Patch',
    lastname: 'Test',
    totalprice: 220,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-11-10',
      checkout: '2026-11-12'
    },
    additionalneeds: 'Dinner'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = await createBookingResponse.json();
  const bookingId = createBookingResponseBody.bookingid;

  const partialUpdatePayload = {
    firstname: 'Patched',
    lastname: 'Updated'
  };

  const patchBookingResponse = await request.patch(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    },
    data: partialUpdatePayload
  });

  expect(patchBookingResponse.status()).toBe(200);

  const patchBookingResponseBody = await patchBookingResponse.json();

  expect(patchBookingResponseBody.firstname).toBe(partialUpdatePayload.firstname);
  expect(patchBookingResponseBody.lastname).toBe(partialUpdatePayload.lastname);
  expect(patchBookingResponseBody.totalprice).toBe(bookingPayload.totalprice);
  expect(patchBookingResponseBody.depositpaid).toBe(bookingPayload.depositpaid);
  expect(patchBookingResponseBody.bookingdates).toMatchObject(bookingPayload.bookingdates);
  expect(patchBookingResponseBody.additionalneeds).toBe(bookingPayload.additionalneeds);

  const getPatchedBookingResponse = await request.get(`/booking/${bookingId}`);

  expect(getPatchedBookingResponse.status()).toBe(200);

  const getPatchedBookingResponseBody = await getPatchedBookingResponse.json();

  expect(getPatchedBookingResponseBody).toMatchObject({
    ...bookingPayload,
    ...partialUpdatePayload
  });

  const cleanupResponse = await request.delete(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});

test('TC14 - PATCH /booking/{id} should return 403 without auth token', async ({ request }) => {
  const bookingPayload = {
    firstname: 'Unauthorized',
    lastname: 'Patch',
    totalprice: 220,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-11-10',
      checkout: '2026-11-12'
    },
    additionalneeds: 'Dinner'
  };

  const createBookingResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(createBookingResponse.status()).toBe(200);

  const createBookingResponseBody = await createBookingResponse.json();
  const bookingId = createBookingResponseBody.bookingid;

  const partialUpdatePayload = {
    firstname: 'UnauthorizedPatched',
    lastname: 'PatchUpdated'
  };

  const patchWithoutTokenResponse = await request.patch(`/booking/${bookingId}`, {
    data: partialUpdatePayload
  });

  expect(patchWithoutTokenResponse.status()).toBe(403);

  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const cleanupResponse = await request.delete(`/booking/${bookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(cleanupResponse.status()).toBe(201);
});
test('TC15 - POST /booking should allow duplicate booking payloads', async ({ request }) => {
  const bookingPayload = {
    firstname: 'Duplicate',
    lastname: 'Payload',
    totalprice: 275,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-12-01',
      checkout: '2026-12-05'
    },
    additionalneeds: 'Breakfast'
  };

  const firstCreateResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(firstCreateResponse.status()).toBe(200);

  const firstCreateResponseBody = await firstCreateResponse.json();
  const firstBookingId = firstCreateResponseBody.bookingid;

  expect(firstCreateResponseBody.booking).toMatchObject(bookingPayload);

  const secondCreateResponse = await request.post('/booking', {
    data: bookingPayload
  });

  expect(secondCreateResponse.status()).toBe(200);

  const secondCreateResponseBody = await secondCreateResponse.json();
  const secondBookingId = secondCreateResponseBody.bookingid;

  expect(secondCreateResponseBody.booking).toMatchObject(bookingPayload);
  expect(secondBookingId).not.toBe(firstBookingId);

  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  expect(authResponse.status()).toBe(200);

  const authResponseBody = await authResponse.json();
  const token = authResponseBody.token;

  const firstCleanupResponse = await request.delete(`/booking/${firstBookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(firstCleanupResponse.status()).toBe(201);

  const secondCleanupResponse = await request.delete(`/booking/${secondBookingId}`, {
    headers: {
      Cookie: `token=${token}`
    }
  });

  expect(secondCleanupResponse.status()).toBe(201);
});
