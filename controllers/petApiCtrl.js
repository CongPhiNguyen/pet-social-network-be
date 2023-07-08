// const dogApiCollection = global.mongoClient.db("social").collection("dogApi")
const petApiCtrl = {
  getDog: async (req, res) => {
    const dogList = await global.mongoClient
      .db("social")
      .collection("dogApi")
      .find({})
      .toArray()
    res.status(200).send({ success: true, dogList: dogList })
  },
  getCat: async (req, res) => {
    const catList = await global.mongoClient
      .db("social")
      .collection("catApi")
      .find({})
      .toArray()
    res.status(200).send({ success: true, catList: catList })
  }
}
module.exports = petApiCtrl
