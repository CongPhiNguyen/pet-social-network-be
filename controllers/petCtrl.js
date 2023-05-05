const Pets = require("../models/petModel")

const petCtrl = {
  add: async (req, res) => {
    console.log(req.body)
    const newPet = new Pets(req.body)
    const resSave = await newPet.save()
    res.status(200).send({ success: true, resSave })
  }
}
module.exports = petCtrl
