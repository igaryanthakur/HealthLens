const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiters } = require("../middleware/rateLimiters");

function createReq(userId = "507f1f77bcf86cd799439099") {
  return {
    ip: "127.0.0.1",
    user: { id: userId },
    method: "POST",
    url: "/api/chat",
    headers: {},
  };
}

function createRes(onLimited) {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      onLimited?.();
      return this;
    },
    send(payload) {
      this.body = payload;
      onLimited?.();
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  return res;
}

function invokeLimiter(limiter, req) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const res = createRes(() => finish({ nextCalled: false, res }));

    limiter(req, res, () => {
      finish({ nextCalled: true, res });
    });
  });
}

test("createRateLimiters exports all five named limiters", () => {
  const limiters = createRateLimiters();
  assert.ok(limiters.standardApiLimiter);
  assert.ok(limiters.authLimiter);
  assert.ok(limiters.uploadLimiter);
  assert.ok(limiters.aiInterpretLimiter);
  assert.ok(limiters.chatLimiter);
});

test("chatLimiter returns 429 after max requests", async () => {
  const { chatLimiter } = createRateLimiters({
    chat: { windowMs: 60_000, max: 3 },
  });
  const userId = "rate-limit-chat-001";

  for (let i = 0; i < 3; i++) {
    const { nextCalled } = await invokeLimiter(chatLimiter, createReq(userId));
    assert.equal(nextCalled, true, `request ${i + 1} should pass`);
  }

  const { nextCalled, res } = await invokeLimiter(chatLimiter, createReq(userId));
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error);
});

test("aiInterpretLimiter returns 429 after max requests", async () => {
  const { aiInterpretLimiter } = createRateLimiters({
    interpret: { windowMs: 60_000, max: 2 },
  });
  const userId = "rate-limit-interpret-001";

  for (let i = 0; i < 2; i++) {
    const { nextCalled } = await invokeLimiter(aiInterpretLimiter, createReq(userId));
    assert.equal(nextCalled, true);
  }

  const { nextCalled, res } = await invokeLimiter(
    aiInterpretLimiter,
    createReq(userId),
  );
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.success, false);
});

test("uploadLimiter returns 429 after max requests", async () => {
  const { uploadLimiter } = createRateLimiters({
    upload: { windowMs: 60_000, max: 2 },
  });
  const userId = "rate-limit-upload-001";

  for (let i = 0; i < 2; i++) {
    const { nextCalled } = await invokeLimiter(uploadLimiter, createReq(userId));
    assert.equal(nextCalled, true);
  }

  const { nextCalled, res } = await invokeLimiter(uploadLimiter, createReq(userId));
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
});
