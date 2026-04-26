const ApiError = require("../utils/ApiError");

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure, it formats Zod's errors into a clean, readable response.
 *
 * Usage:
 *   router.post("/signup", validate(signupSchema), signup);
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Format Zod errors into a flat array of readable messages
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    // Throw as a structured 400 error
    return next(
      new ApiError(400, errors[0].message, true)
    );
  }

  // Attach the validated (and coerced) data back to req.body
  req.body = result.data;
  next();
};

module.exports = validate;
