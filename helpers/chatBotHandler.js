const BASE_URL = "https://api.thedogapi.com/v1"
const CAT_URL = "https://api.thecatapi.com/v1"
const API_KEY = process.env.CAT_API_KEY
const axios = require("axios")
const moment = require("moment")
const fs = require("fs")

const handleIntent = async (queryResult) => {
  if (
    queryResult?.allRequiredParamsPresent &&
    queryResult?.intent?.displayName === "ask.find_dog"
  ) {
    const dogName = queryResult?.parameters?.fields?.dog_name?.stringValue
    console.log(dogName)
    // tìm thông tin chó từ api dog
    const { data: breeds } = await axios.get(`${BASE_URL}/breeds`, {
      headers: {
        "x-api-key": API_KEY
      }
    })

    fs.writeFileSync(
      `C:\\CongPhi\\school-project\\logs\\dogapi_${moment().format(
        "DDMMYY_HHmmss"
      )}.json`,
      JSON.stringify(breeds)
    )

    const dogInfo = breeds.find((val) => val.name === dogName)

    return {
      name: "ask.find_dog",
      dogInfo: dogInfo
    }
  }
}

module.exports = {
  handleIntent
}
