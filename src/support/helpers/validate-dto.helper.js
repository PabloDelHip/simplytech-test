
export function fullValidate(schema, request, options = {
  abortEarly: false,
  convert: true,
  stripUnknown: true
}) {
  const { error, value } = schema.validate(request, options);
  if (error) {
    const err = new Error('Parámetros inválidos');
    err.status = 400;
    err.details = error.details;
    throw err;
  }
  return value;
}
