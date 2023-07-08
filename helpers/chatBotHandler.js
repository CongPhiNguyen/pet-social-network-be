const BASE_URL = "https://api.thedogapi.com/v1"
const CAT_URL = "https://api.thecatapi.com/v1"
const API_KEY = process.env.CAT_API_KEY
const axios = require("axios")
const moment = require("moment")
const fs = require("fs")
const {
  genDogPersonalRandom,
  predictDogByTemp
} = require("../ai-model/script/dog_personal")

const handleIntent = async (queryResult) => {
  if (queryResult?.allRequiredParamsPresent) {
    if (queryResult?.intent?.displayName === "ask_find-dog") {
      const dogName = queryResult?.parameters?.fields?.dog_name?.stringValue
      // tìm thông tin chó từ api dog
      const { data: breeds } = await axios.get(`${BASE_URL}/breeds`, {
        headers: {
          "x-api-key": API_KEY
        }
      })

      // fs.writeFileSync(
      //   `C:\\CongPhi\\school-project\\logs\\dogapi_${moment().format(
      //     "DDMMYY_HHmmss"
      //   )}.json`,
      //   JSON.stringify(breeds)
      // )

      const dogInfo = breeds.find((val) => val.name === dogName)

      return {
        name: "ask_find-dog",
        dogInfo: dogInfo,
        dogName: dogName
      }
    } else if (queryResult?.intent?.displayName === "ask_find-cat") {
      const catName = queryResult?.parameters?.fields?.cat_name?.stringValue
      // tìm thông tin chó từ api dog
      const { data: breeds } = await axios.get(`${CAT_URL}/breeds`, {
        headers: {
          "x-api-key": API_KEY
        }
      })

      // fs.writeFileSync(
      //   `C:\\CongPhi\\school-project\\logs\\catapi_${moment().format(
      //     "DDMMYY_HHmmss"
      //   )}.json`,
      //   JSON.stringify(breeds)
      // )

      const catInfo = breeds.find((val) => val.name === catName)
      return {
        name: "ask_find-cat",
        catInfo: catInfo,
        catName: catName
      }
    }
  }
  switch (queryResult?.intent?.displayName) {
    case "ask_pet-fact":
      return {
        name: "ask_pet-fact",
        fact: global.fact[Math.floor(Math.random() * global.fact.length)] || ""
      }
    case "ask_pet-care-tips":
      return {
        name: "ask_pet-care-tips",
        tip: global.tips[Math.floor(Math.random() * global.tips.length)] || ""
      }
    case "predict_sick":
      return {
        name: "predict_sick"
      }
    case "choose.pet-by-personal":
      console.log(queryResult?.parameters?.fields?.pet_type)
      if (queryResult?.parameters?.fields?.pet_type?.stringValue === "Chó") {
        if (queryResult?.allRequiredParamsPresent) {
          const tempList = []
          tempList.push(
            queryResult?.parameters?.fields?.pet_personal_1?.stringValue
          )
          tempList.push(
            queryResult?.parameters?.fields?.pet_personal_2?.stringValue
          )
          tempList.push(
            queryResult?.parameters?.fields?.pet_personal_3?.stringValue
          )
          return {
            name: "choose.pet-by-personal",
            dogName: predictDogByTemp(tempList),
            tempList: tempList.join(", ")
          }
        } else {
          const tempList = []
          tempList.push(
            queryResult?.parameters?.fields?.pet_personal_1?.stringValue
          )
          tempList.push(
            queryResult?.parameters?.fields?.pet_personal_2?.stringValue
          )
          tempList.push(
            queryResult?.parameters?.fields?.pet_personal_3?.stringValue
          )
          const val = genDogPersonalRandom(3, tempList)

          return {
            name: "choose.pet-by-personal",
            genPersonal: val
          }
        }
      } else return {}
    default: {
    }
  }
}

module.exports = {
  handleIntent
}
