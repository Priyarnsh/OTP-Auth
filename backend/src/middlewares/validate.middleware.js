/**
 * Zod Validation Middleware Factory.
 * Wraps a Zod schema and validates req.body against it.
 *
 * @param {import("zod").ZodSchema} schema
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Replace body with parsed (cleaned) data
    req.body = result.data;
    next();
  };
}
