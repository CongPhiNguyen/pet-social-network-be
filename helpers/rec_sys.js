const getMostFollowUser = (listAllUserRaw, length) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  listAllUser.sort((a, b) => b?.followers?.length - a?.followers?.length)
  return listAllUser.slice(0, length)
}

// Lấy danh sách theo dõi của người dùng hiện tại
const getFollowerOfUserId = async (listAllUserRaw) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
}

const getFollowingOfUserId = (listAllUserRaw, userId) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  const currentUser = listAllUser.find((user) => user._id === userId)
  return currentUser?.following || []
}

const getScore = (listAllUserRaw, listUserId) => {
  // First get by following
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  const userFollowList = []
  for (const userId of listUserId) {
    userFollowList.push(
      getFollowingOfUserId(JSON.stringify(listAllUser), userId)
    )
  }
  // console.log(userFollowList)
  // Count score
  const objectScore = {}
  for (const userList of userFollowList) {
    for (userId of userList) {
      objectScore[userId] ??= 0
      objectScore[userId]++
    }
  }
  // console.log(objectScore)
  const scoreArray = []
  for (const userId of Object.keys(objectScore)) {
    scoreArray.push({ userId: userId, score: objectScore[userId] })
  }
  // console.log(scoreArray)
  return scoreArray
}

const getRecommendUser = async (listAllUserRaw, userId) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  // Check xem phải user chưa từng có tương tác hay không
  // Get thông tin danh sách follow của 1 user
  const userFollower = getFollowingOfUserId(JSON.stringify(listAllUser), userId)
  if (userFollower.length === 0) {
    console.log(
      "User chưa follow người dùng nào. Gợi ý các người dùng được follow nhiều nhất"
    )
    const recUser = getMostFollowUser(JSON.stringify(listAllUser), 5)
    console.log(recUser.map((val) => val._id))
    return recUser.map((val) => val._id)
  } else {
    console.log(userFollower)
    console.log("User đã follow: ", userFollower.join(","))
    const score = getScore(JSON.stringify(listAllUser), userFollower)
    score.sort((a, b) => b.score - a.score)
    const finalUser = score.filter((val) => !userFollower.includes(val.userId))
    console.log("Gợi ý cho người dùng", finalUser)
    return finalUser.map((val) => val.userId)
  }
}

const getRecByUserIdHandling = async (userId) => {
  const listAllUser = await global.mongoClient
    .db("social")
    .collection("users")
    .find({})
    .toArray()
  return getRecommendUser(JSON.stringify(listAllUser), userId)
}

module.exports = {
  getRecByUserIdHandling
}
