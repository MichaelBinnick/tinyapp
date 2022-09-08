const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

const urlsForUser = function(id) {
  let filteredURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      let shortUrlID = urlDatabase[shortURL].shortURL;
      filteredURLs[shortUrlID] = urlDatabase[shortUrlID];
    }
  }
  return filteredURLs;
}

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if(!longURL) {
    return res.status(403).send(`That URL hasn't been added! Try again.\n`);
  }
  res.redirect(longURL);
})

app.get('/urls', (req, res) => {
  const ownedURLs = urlsForUser(req.cookies['user_id']);
  const templateVars = { user: users[req.cookies['user_id']], urls: ownedURLs };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if (!req.cookies['user_id']) {
    return res.status(400).send(`Cannot add new URLs without being logged in. Please register or log in.\n`);
  }
  const longURL = req.body.longURL;
  if (!longURL) {
    // if blank URL
    return res.status(400).send('Empty URL, so sad!'); 
  }

  const id = generateRandomString();
  urlDatabase[id] = { shortURL: id, longURL, userID: req.cookies['user_id']};
  res.redirect(`/urls/${id}`);
});

app.get('/urls/new', (req, res) => {
  if (!req.cookies['user_id']) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('user_register', templateVars);
});

app.post(`/register`, (req, res) =>{
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  if (!email || !password) {
    return res.status(400).send(`400 error - incomplete registration form`);
  }

  if(findUserByEmail(email, users)) {
    return res.status(400).send(`400 error - redundant registration`);
  }

  const newID = generateRandomString();
  users[newID] = { id: newID, email, password };
  res.cookie(`user_id`, newID);
  res.redirect(`/urls`);
});

app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  if (!longURL) {
    // incorrect id/shortURL
    return res.status(400).send("That id doesn't exist!");
  }
  const templateVars = { id, longURL, user: users[req.cookies['user_id']] };
  res.render('urls_show', templateVars);
});
  
app.post('/urls/:id/update', (req, res) => {
  // if id doesnt exist
  if (!urlDatabase[req.params.id]) {
    return res.status(403).send(`That URL doesn't exist.\n`);
  }
  // if user isn't logged in
  if (!req.cookies['user_id']) {
    return res.status(403).send(`You aren't logged in, please register or login.\n`);
  }
  // if user doesn't own url
  if (urlDatabase[req.params.id].userID !== req.cookies['user_id']) {
    return res.status(403).send(`You don't own that URL.\n`);
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

app.post('/urls/:id/delete', (req, res) => {
  // if id doesnt exist
  if (!urlDatabase[req.params.id]) {
    return res.status(403).send(`That URL doesn't exist.\n`);
  }
  // if user isn't logged in
  if (!req.cookies['user_id']) {
    return res.status(403).send(`You aren't logged in, please register or login.\n`);
  }
  // if user doesn't own url
  if (urlDatabase[req.params.id].userID !== req.cookies['user_id']) {
    return res.status(403).send(`You don't own that URL.\n`);
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.get(`/login`, (req, res) => {
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  }
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render(`user_login`, templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email, users);
  if (!user || password !== user.password) {
    return res.status(403).send(`403 - incorrect details`);
  }

  res.cookie('user_id', user.id);
  res.redirect(`/urls`);
});

app.post(`/logout`, (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});