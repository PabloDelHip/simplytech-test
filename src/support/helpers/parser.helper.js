export function responseOf(status = 200, data = null, meta = null) {
  return { status, data, meta };
}