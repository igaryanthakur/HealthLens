const test = require("node:test");
const assert = require("node:assert/strict");
const {
  meHandler,
  updateProfileHandler,
  updateAccountHandler,
  changePasswordHandler,
  validateProfileInput,
  validateAccountInput,
  validatePasswordInput,
} = require("../routes/users");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const stubUserId = "507f1f77bcf86cd799439099";

const mockUser = {
  _id: stubUserId,
  name: "Jane Doe",
  email: "jane@example.com",
  password: "hashed-secret",
  profile: {
    gender: "Female",
    heightCm: 165,
    weightKg: 60,
    chronicConditions: ["Hypertension"],
    lifestyle: {
      smokingStatus: "Never",
      alcoholConsumption: "None",
    },
  },
  save: async function save() {
    return this;
  },
};

test("me handler returns user without password", async () => {
  const res = createMockRes();

  await meHandler(
    { user: { id: stubUserId } },
    res,
    {
      findUserById: async () => ({ ...mockUser }),
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.user.email, "jane@example.com");
  assert.equal(res.body.user.profile.gender, "Female");
  assert.equal(res.body.user.password, undefined);
});

test("me handler returns 404 when user not found", async () => {
  const res = createMockRes();

  await meHandler(
    { user: { id: stubUserId } },
    res,
    {
      findUserById: async () => null,
    },
  );

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});

test("update profile handler merges profile fields", async () => {
  const res = createMockRes();
  const user = {
    ...mockUser,
    profile: {},
    save: async function save() {
      return this;
    },
  };

  await updateProfileHandler(
    {
      user: { id: stubUserId },
      body: {
        gender: "Male",
        bloodGroup: "O+",
        heightCm: 180,
        weightKg: 75,
        chronicConditions: ["Type 2 Diabetes"],
        lifestyle: {
          smokingStatus: "Former",
          alcoholConsumption: "Occasional",
        },
      },
    },
    res,
    {
      findUserById: async () => user,
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(user.profile.gender, "Male");
  assert.equal(user.profile.bloodGroup, "O+");
  assert.equal(user.profile.heightCm, 180);
  assert.equal(user.profile.weightKg, 75);
  assert.deepEqual(user.profile.chronicConditions, ["Type 2 Diabetes"]);
  assert.equal(user.profile.lifestyle.smokingStatus, "Former");
  assert.equal(user.profile.lifestyle.alcoholConsumption, "Occasional");
});

test("validateProfileInput rejects invalid enum values", () => {
  assert.equal(validateProfileInput({ gender: "Invalid" }), "Invalid gender value.");
  assert.equal(
    validateProfileInput({ lifestyle: { smokingStatus: "Sometimes" } }),
    "Invalid smokingStatus value.",
  );
});

test("update account handler updates name and email", async () => {
  const res = createMockRes();
  const user = {
    ...mockUser,
    save: async function save() {
      return this;
    },
  };

  await updateAccountHandler(
    {
      user: { id: stubUserId },
      body: { name: "Priya Sharma", email: "priya@example.com" },
    },
    res,
    {
      findUserById: async () => user,
      findUserByEmail: async () => null,
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.name, "Priya Sharma");
  assert.equal(res.body.user.email, "priya@example.com");
  assert.equal(user.name, "Priya Sharma");
  assert.equal(user.email, "priya@example.com");
});

test("update account handler rejects duplicate email", async () => {
  const res = createMockRes();
  const user = { ...mockUser, save: async () => user };

  await updateAccountHandler(
    {
      user: { id: stubUserId },
      body: { email: "taken@example.com" },
    },
    res,
    {
      findUserById: async () => user,
      findUserByEmail: async () => ({ _id: "other-user-id" }),
    },
  );

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /already in use/i);
});

test("change password handler updates password when current matches", async () => {
  const res = createMockRes();
  const user = {
    ...mockUser,
    password: "hashed-secret",
    matchPassword: async (entered) => entered === "OldPass123",
    save: async function save() {
      return this;
    },
  };

  await changePasswordHandler(
    {
      user: { id: stubUserId },
      body: { currentPassword: "OldPass123", newPassword: "NewPass456" },
    },
    res,
    { findUserById: async () => user },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(user.password, "NewPass456");
});

test("change password handler rejects incorrect current password", async () => {
  const res = createMockRes();
  const user = {
    ...mockUser,
    matchPassword: async () => false,
    save: async () => user,
  };

  await changePasswordHandler(
    {
      user: { id: stubUserId },
      body: { currentPassword: "wrong", newPassword: "NewPass456" },
    },
    res,
    { findUserById: async () => user },
  );

  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /incorrect/i);
});

test("validateAccountInput and validatePasswordInput guard bad input", () => {
  assert.equal(validateAccountInput({ name: "A" }), "Name must be at least 2 characters.");
  assert.equal(validateAccountInput({ email: "bad-email" }), "Invalid email address.");
  assert.equal(validatePasswordInput({}), "Current password and new password are required.");
  assert.equal(
    validatePasswordInput({ currentPassword: "SamePass1!", newPassword: "SamePass1!" }),
    "New password must be different from the current password.",
  );
});
