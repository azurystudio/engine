Get({
  preValidator(c) {
    if (c.req.headers.custom === 'darkflare') {
      return 'a'
    }
  },
}, () => {
  return 'b'
})
