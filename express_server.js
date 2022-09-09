const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { generateRandomString, findUserByEmail, urlsForUser } = require('./helpers');


const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['i_guess_this_is_a_secret_just_try_it'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get('/', (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  return res.redirect('/urls');
});

app.get('/u/:id', (req, res) => {
  const link = urlDatabase[req.params.id];
  if(!link) {
    return res.redirect(`/urls/${req.params.id}`);
  }
  res.redirect(link.longURL);
})

app.get('/urls', (req, res) => {
  const ownedURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { user: users[req.session.user_id], urls: ownedURLs };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send(`Cannot add new URLs without being logged in. Please register or log in.\n`);
  }
  const longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send('Empty URL, so sad!'); 
  }

  const id = generateRandomString();
  urlDatabase[id] = { shortURL: id, longURL, userID: req.session.user_id};
  res.redirect(`/urls/${id}`);
});

app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('user_register', templateVars);
});

app.post(`/register`, (req, res) =>{
  const email = req.body.email;
  if (!email || !req.body.password) {
    return res.status(400).send(
      '<h1>You didn\'t enter an email and/or password.</h1>\n<h2>Please return to <a href="http://localhost:8080/register">register</a></h2>'
      );
  }
  const password = bcrypt.hashSync(req.body.password, 10);

  if(findUserByEmail(email, users)) {
    return res.status(400).send(
      '<h1>That email is already in use!</h1>\n<h2>Please return to <a href="http://localhost:8080/register">register</a></h2>'
      );
  }

  const newID = generateRandomString();
  users[newID] = { id: newID, email, password };
  req.session.user_id = newID;
  res.redirect(`/urls`);
});

app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const urlID = urlDatabase[id];
  let longURL = '';
  if (user && urlID) {
    longURL = urlID.longURL;
  }
  const templateVars = { id, longURL, user, urlID };
  res.render('urls_show', templateVars);
});
  
app.get('/urls/null', (req, res) => {
  const user = req.session.user_id;
  const templateVars = { user }
  return res.render('urls_null');
})

app.post('/urls/:id', (req, res) => {
  // if id doesnt exist
  if (!urlDatabase[req.params.id]) {
    return res.status(403).send(`That URL doesn't exist.\n`);
  }
  // if user isn't logged in
  if (!req.session.user_id) {
    return res.status(403).send(`You aren't logged in, please register or login.\n`);
  }
  // if user doesn't own url
  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
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
  if (!req.session.user_id) {
    return res.status(403).send(`You aren't logged in, please register or login.\n`);
  }
  // if user doesn't own url
  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(403).send(`You don't own that URL.\n`);
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.get(`/login`, (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render(`user_login`, templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const user = findUserByEmail(email, users);
  if (!req.body.password) {
    res.status(403).send(
      '<h1>You didn\'t enter a password!</h1>\n<h2>Please return to <a href="http://localhost:8080/login">login</a></h2>'
      );
    return res.redirect('/login');
  }
  if (!user) {
    res.status(403).send(
      '<h1>Incorrect credentials.</h1>\n<h2>Please return to <a href="http://localhost:8080/login">login</a></h2>'
      );
    return res.redirect('/login');
  }
  const passwordMatches = bcrypt.compareSync(req.body.password, user.password);
  if (!passwordMatches) {
    res.status(403).send(
      '<h1>Incorrect credentials.</h1>\n<h2>Please return to <a href="http://localhost:8080/login">login</a></h2>'
      );
    return res.redirect('/login');
  }

  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

app.post(`/logout`, (req, res) => {
  req.session = null;
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