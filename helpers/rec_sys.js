const getMostFollowUser = (listAllUserRaw, length) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  listAllUser.sort((a, b) => b?.followers?.length - a?.followers?.length)
  return listAllUser.slice(0, length)
}

// Lấy danh sách theo dõi của người dùng hiện tại
const getFollowerOfUserId = (listAllUserRaw) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
}

const getFollowingOfUserId = (listAllUserRaw, userId) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  const currentUser = listAllUser.find((user) => user._id === userId)
  return currentUser?.following || []
}

const getUserInfoById = (listAllUserRaw, userId) => {
  const listAllUser = JSON.parse(listAllUserRaw || "[]") || []
  return listAllUser.find((val) => val._id === userId)
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

const getRecommendUser = (listAllUserRaw, userId) => {
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
    return recUser.map((val) => {
      return {
        userId: val._id,
        userInfo: getUserInfoById(JSON.stringify(listAllUser), val._id)
      }
    })
  } else {
    console.log("User đã follow: ", userFollower.join(","))
    const score = getScore(JSON.stringify(listAllUser), userFollower)
    score.sort((a, b) => b.score - a.score)
    const finalUser = score.filter(
      (val) => !userFollower.includes(val.userId) && val.userId !== userId
    )
    // Random user if not exceed 5
    if (finalUser.length < 5) {
      const listUserSuggestMore = [...listAllUser]
        .filter(
          (val) =>
            !userFollower.includes(val._id) &&
            !finalUser.find((finalUserVal) => finalUserVal.userId == val._id)
        )
        .sort((a, b) => Math.random() - Math.random())
      const times = 5 - finalUser.length
      for (let i = 0; i < times; i++) {
        if (i >= listUserSuggestMore.length) break
        finalUser.push({ userId: listUserSuggestMore[i]._id, score: 0 })
      }
    }

    const finalRes = finalUser.map((val) => ({
      ...val,
      userInfo: getUserInfoById(JSON.stringify(listAllUser), val.userId)
    }))
    console.log(
      "Gợi ý cho người dùng",
      finalRes.map((val) => {
        return {
          userId: val?.userId,
          score: val?.score,
          username: val?.userInfo?.username
        }
      })
    )
    return finalRes
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
