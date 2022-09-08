const generateRandomString = function() {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  for (let i = 6; i > 0; i--) {
    const randChar = chars.charAt(Math.floor(Math.random() * chars.length));
    result += randChar;
  }
  return result;
}

const findUserByEmail = function(userEmail, userDB) {
  for (const user in userDB) {
    if (userEmail === userDB[user].email) {
      return userDB[user];
    }
  }
  return null;
}

const urlsForUser = function(id, urlDatabase) {
  let filteredURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      let shortUrlID = urlDatabase[shortURL].shortURL;
      filteredURLs[shortUrlID] = urlDatabase[shortUrlID];
    }
  }
  return filteredURLs;
}

module.exports = { generateRandomString, findUserByEmail, urlsForUser }