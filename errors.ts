function createResponse(message: string, code: number) {
  return new Response(JSON.stringify({
    code,
    message,
  }), {
    status: code,
    headers: {
      'content-type': 'application/json; charset=utf-8;'
    }
  })
}

export function AccessDenied() {
  return createResponse('Access Denied', 403)
}

export function BadRequest() {
  return createResponse('Bad Request', 400)
}

export function MalformedRequest() {
  return createResponse('Malformed Request', 405)
}

export function NotFound() {
  return createResponse('Not Found', 404)
}

export function PayloadTooLarge() {
  return createResponse('Payload Too Large', 413)
}

export function ServiceUnavailable() {
  return createResponse('Service Unavailable', 503)
}

export function SomethingWentWrong() {
  return createResponse('Something Went Wrong', 500)
}

export function Unauthorized() {
  return createResponse('Unauthorized', 401)
}
