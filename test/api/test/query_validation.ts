Get({
  query: v.object({
    key: v.string(),
  }),
}, () => {
  return { ok: true }
})
