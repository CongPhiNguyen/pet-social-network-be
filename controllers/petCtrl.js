const Pets = require("../models/petModel")
const { isObjectId } = require("../helpers/stringValidation")
const petCtrl = {
  add: async (req, res) => {
    const newPet = new Pets(req.body)
    const resSave = await newPet.save()
    res.status(200).send({ success: true, resSave })
  },

  getList: async (req, res) => {
    const { userId } = req.query
    const listPet = await Pets.find({ owner: userId })
    res.status(200).send({ success: true, listPet: listPet })
  },

  getPetById: async (req, res) => {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, msg: "PetId is not valid" })
    }
    const petInfo = await Pets.findById(id)
    if (!petInfo) {
      return res.status(404).json({ success: false, msg: "PetId is not valid" })
    }
    res.status(200).send({ success: true, petInfo: petInfo })
  },

  deletePetById: async (req, res) => {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, msg: "PetId is not valid" })
    }
    const petInfo = await Pets.findByIdAndDelete(id)
    if (!petInfo) {
      return res.status(404).json({ success: false, msg: "PetId is not valid" })
    }
    res.status(200).send({ success: true, petInfo: petInfo })
  },

  updatePetById: async (req, res) => {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, msg: "PetId is not valid" })
    }
    const petInfo = await Pets.findByIdAndUpdate(id, req.body)
    if (!petInfo) {
      return res.status(404).json({ success: false, msg: "PetId is not valid" })
    }
    res.status(200).send({ success: true, petInfo: petInfo })
  }
}
module.exports = petCtrl
