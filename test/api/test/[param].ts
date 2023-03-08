Get({
  parameters: v.object({
    param: v.string(),
  }),
}, (c) => {
  console.log(ObjectId.isValid('adadad'))

  return c.req.param
})
