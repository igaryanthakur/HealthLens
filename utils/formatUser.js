function formatUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    profile: user.profile ?? {},
  };
}

module.exports = { formatUser };
