const errorCtrl = {
  throwError: async (req, res) => {
    res.status(200).send({ error: true })
    throw new Error("Not oke. I don't feel so good")
  }
}

module.exports = errorCtrl
