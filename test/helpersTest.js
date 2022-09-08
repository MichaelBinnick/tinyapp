const { assert } = require('chai');

const { findUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testURLs = {
  "aBc123": {
    shortURL: "aBc123",
    longURL: "http://lighthouselabs.ca",
    userID: "userRandomID"
  },
  "zYx098": {
    shortURL: "zYx098",
    longURL: "http://youtube.com",
    userID: "user2RandomID"
  }
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    return assert.equal(user.id, expectedUserID);
  });
  it('should return null with invalid email', function() {
    const user = findUserByEmail("userManz1337@example.com", testUsers)
    const expectedReturn = null;
    return assert.equal(user, expectedReturn);
  });
});

describe('urlsForUser', function() {
  it('should return the URLs that have a property "userID" whose value is the input user\'s ID', function() {
    const user = "userRandomID";
    const expectedURLs = {
      "aBc123": {
        shortURL: "aBc123",
        longURL: "http://lighthouselabs.ca",
        userID: "userRandomID"
      }
    };

    return assert.deepEqual(urlsForUser(user, testURLs), expectedURLs);
  });
  it('should return empty object with invalid userID', function() {
    const user = "user1337zorz";
    const expectedReturn = {};

    return assert.deepEqual(urlsForUser(user, testURLs), expectedReturn);
  });
});