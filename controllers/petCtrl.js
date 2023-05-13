const Pets = require("../models/petModel")

const petCtrl = {
  add: async (req, res) => {
    console.log(req.body)
    const newPet = new Pets(req.body)
    const resSave = await newPet.save()
    res.status(200).send({ success: true, resSave })
  },

  getList: async (req, res) => {
    const { userId } = req.query
    const listPet = await Pets.find({ owner: userId })
    res.status(200).send({ success: true, listPet: listPet })
  }
}
module.exports = petCtrl
