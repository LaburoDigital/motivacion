import { expect, test } from "vitest";
import worker from "../src/index";

test("responde", async () => {
  const res = await worker.fetch(new Request("http://x/"), {} as any);
  expect(res.status).toBe(200);
});
