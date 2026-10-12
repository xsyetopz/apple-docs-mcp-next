import { mock } from "bun:test";
import * as httpClientActual from "../../src/core/http-client.ts";

/**
 * The factory for `mock.module` of the HTTP client: every method of `httpClient` is a fresh mock,
 * and the other exports stay real, such as the error classes.
 */
export const httpClientModule = () => ({
  ...httpClientActual,
  httpClient: {
    get: mock(),
    getJson: mock(),
    getText: mock(),
    postText: mock(),
  },
});
