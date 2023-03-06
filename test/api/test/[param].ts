Get({
  parameters: v.object({
    param: v.string(),
  }),
}, (c) => {
  return c.req.param
})
