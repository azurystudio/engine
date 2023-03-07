Get({
  preValidator(c) {
    if (c.req.headers.custom === 'darkflare') {
      return 'a'
    }
  },
}, (c) => {
  const res = Core.parseUserAgent(c)

  console.log(res)

  return 'b'
})
