const fs = require("fs")
const { MultinomialNB } = require("ml-naivebayes")

const tempJson = fs.readFileSync("./ai-model/sick/list_temp.json")
const tempList = JSON.parse(tempJson)
// Load list dogName
const nameJson = fs.readFileSync("./ai-model/sick/list_label.json")
const nameList = JSON.parse(nameJson)

const modelJson = fs.readFileSync("./ai-model/sick/model.json")
const modelData = JSON.parse(modelJson)
const catPersonalModel = MultinomialNB.load(modelData)

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

const genSickRandom = (num, ignoreList) => {
  return getRandomElements(
    tempList.filter((val) => !ignoreList.includes(val)),
    num
  )
}

const predictSickByTemp = (listTemp) => {
  console.log(listTemp)
  const arr = new Array(tempList.length).fill(0)
  for (const temp of listTemp) {
    if (tempList.indexOf(temp)) {
      arr[tempList.indexOf(temp)] = 1
    }
  }
  return nameList[catPersonalModel.predict([arr])]
}

module.exports = {
  genSickRandom,
  predictSickByTemp
}
