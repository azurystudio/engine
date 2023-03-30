function createResponse(message: string, code: number) {
  return new Response(
    JSON.stringify({
      code,
      message,
    }),
    {
      status: code,
      headers: {
        'content-type': 'application/json; charset=utf-8;',
      },
    }
  )
}

export const AccessDenied = createResponse('Access Denied', 403)
export const BadRequest = createResponse('Bad Request', 400)
export const MalformedRequest = createResponse('Malformed Request', 405)
export const NotFound = createResponse('Not Found', 404)
export const PayloadTooLarge = createResponse('Payload Too Large', 413)
export const ServiceUnavailable = createResponse('Service Unavailable', 503)
export const SomethingWentWrong = createResponse('Something Went Wrong', 500)
export const Unauthorized = createResponse('Unauthorized', 401)
