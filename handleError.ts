export function handleError(errorMessage: string, request: Request) {
  const code = errorMessage.startsWith('Malformed')
      ? 400
      : errorMessage === 'NOT FOUND'
      ? 404
      : 500,
    message = errorMessage.startsWith('Malformed')
      ? errorMessage.replace('Malformed', '')
      : errorMessage === 'Not Found'
      ? 'Not Found'
      : 'Something Went Wrong'

  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        code,
        message,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8;',
        },
        status: code,
      },
    )
  } else {
    return new Response(
      message,
      {
        headers: {
          'content-type': 'text/plain; charset=utf-8;',
        },
        status: code,
      },
    )
  }
}
