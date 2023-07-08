const fs = require("fs")
const { MultinomialNB } = require("ml-naivebayes")

const tempJson = fs.readFileSync("./ai-model/dog/list_temp.json")
const tempList = JSON.parse(tempJson)
// Load list temp Vi
const tempViJson = fs.readFileSync("./ai-model/dog/list_temp_vi.json")
const tempViList = JSON.parse(tempViJson)
// Load list dogName
const nameJson = fs.readFileSync("./ai-model/dog/list_label.json")
const nameList = JSON.parse(nameJson)

const modelJson = fs.readFileSync("./ai-model/dog/personal_model.json")
const modelData = JSON.parse(modelJson)
const dogPersonalModel = MultinomialNB.load(modelData)

function getRandomElements(arr, n) {
  const result = new Array(n)
  const len = arr.length

  for (let i = 0; i < n; i++) {
    let randIndex = Math.floor(Math.random() * len)
    while (result.includes(arr[randIndex])) {
      randIndex = Math.floor(Math.random() * len)
    }
    result[i] = arr[randIndex]
  }

  return result
}

const genDogPersonalRandom = (num, ignoreList) => {
  return getRandomElements(
    tempViList.filter((val) => !ignoreList.includes(val)),
    num
  )
}

const predictDogByTemp = (listTemp) => {
  console.log(listTemp)
  const arr = new Array(tempList.length).fill(0)
  for (const temp of listTemp) {
    if (tempViList.indexOf(temp)) {
      arr[tempViList.indexOf(temp)] = 1
    }
  }
  return nameList[dogPersonalModel.predict([arr])]
}

module.exports = {
  genDogPersonalRandom,
  predictDogByTemp
}
