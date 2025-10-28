const validateUserInput = (body, isUpdate = false) => {
  const errors = {};

  if (!isUpdate || body.username) {
    if (!body.username || body.username.trim() === "")
      errors.username = "Username is required";
  }

  if (!isUpdate || body.email) {
    if (!body.email) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
      errors.email = "Invalid email format";
  }

  if (!isUpdate || body.password) {
    if (!body.password || body.password.length < 6)
      errors.password = "Password must be at least 6 characters";
  }

  return errors;
};

module.exports = { validateUserInput };