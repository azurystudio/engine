Get({
  postHandler(c) {
    c.res.header('custom', 'second')
  },
}, (c) => {
  c.res.header('custom', 'first')
})
