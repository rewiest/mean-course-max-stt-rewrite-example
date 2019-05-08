const jwt = require('jsonwebtoken');
const ldap = require('ldapjs');
const BLUE_PAGE_LDAP_URL = 'ldaps://bluepages.ibm.com:636';
const BLUE_PAGE_LDAP_ORG = 'o=ibm.com';

// initialize Cloudant
const Cloudant = require('@cloudant/cloudant');
const cloudant = new Cloudant({ url: process.env.DB_URL, plugins: 'promises' });

// create Users database if it does not already exist
cloudant.db.create('users')
  .then((data) => {
    console.log('Users database created');
  })
  .catch((error) => {
    if (error.error === 'file_exists') {
      console.log('Users database already exists');
    } else {
      console.log('Error occurred when creating Users database', error.error);
    }
  });
  const usersDb = cloudant.db.use('users');

// create Users database index for email
var email = {name:'email', type:'json', index:{fields:['email']}}
usersDb.index({name:'email', type:'json', index:{fields:['email']}})
  .then((response) => {
    console.log('Users database Email index -', response.result);
  })
  .catch((error) => {
    console.log('Error occurred when creating Users database Email index', error.error);
  });


// login user function
exports.userLogin = (req, res, next) => {

  console.log('In route - userLogin', '(no-auth-api)');

  // initialize variables
  let user = { email: '', firstName: '', lastName: '', preferredName: '', roles: [], _id: '' };
  let password = '';

  if (req.body.email) user.email = req.body.email;
  if (req.body.password) password = req.body.password;

  // create ldapclient for ldap bluepages authentication
  const ldapclient = ldap.createClient({
    url: BLUE_PAGE_LDAP_URL
  });

  // call searchClient, bindClient, getRoles, and then create and return token if successful
  searchClient(user.email)
  .then((searchResult) => {
    if (!searchResult) {
      console.log('Authentication failed for', user.email);
      return res.status(401).json({
        message: 'Authentication failed.'
      });
    }
    console.log('DN', searchResult.dn);
    if (searchResult.object.hrFirstName !== undefined)
      user.firstName = searchResult.object.hrFirstName;
    if (searchResult.object.hrLastName !== undefined)
      user.lastName = searchResult.object.hrLastName;
    if (searchResult.object.givenName !== undefined)
      user.preferredName = searchResult.object.givenName;
    return bindClient(searchResult.dn, password)
  })
  .then((bindResult) => {
    if (res.statusCode !== 200) return
    if (bindResult) {
      return getRoles(user.email)
    } else {
      console.log('Authentication failed for', user.email);
      res.status(401).json({
        message: 'Authentication failed.'
      });
      return;
    }
  })
  .then((roleResult) => {
    if (res.statusCode !== 200) return
    if (roleResult) {
      const token = jwt.sign(
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          preferredName: user.preferredName,
          roles: user.roles,
          _id: user._id
        },
        process.env.JWT_KEY,
        { expiresIn: '1h' }
      );
      console.log('Authentication successful for', user.email);
      res.status(200).json({
        token: token,
        expiresIn: 3600,
        user: user
      });
    } else {
      console.log('Authentication failed for', user.email);
      res.status(401).json({
        message: 'Authentication failed.'
      });
      return;
    }
  })
  .catch(err => {
    console.log('Authentication failed');
    res.status(500).json({
      message: 'Authentication failed.'
    });
  });

  // define ldap searchClient function - used to authenticate user
  function searchClient(email) {
    console.log('In LDAPSearchClient - Begin');
    return new Promise((resolve, reject) => {
      let dn;
      let opts = {
        filter: '(mail=' + email + ')',
        scope: 'sub',
        attributes: ['dn', 'hrFirstName', 'hrLastName', 'givenName']
      };
      ldapclient.search(BLUE_PAGE_LDAP_ORG, opts, (err, res) => {
        res.on('searchEntry', (entry) => {
          console.log('In LDAPSearchClient - Found DN');
          dn = entry.dn;
          resolve(entry);
        });
        res.on('error', (error) => {
          console.log('In LDAPSearchClient - Error');
          resolve(dn);
        });
        res.on('end', (result) => {
          resolve(dn);
        });
      });
    });
  }

  // define ldap bindClient function - used to authenticate user
  function bindClient(dn, password) {
    console.log('In LDAPBindClient - Begin');
    return new Promise((resolve, reject) => {
      if (!dn) resolve(false);
      ldapclient.bind(dn, password, (err, res) => {
        if (!err) {
          console.log('In LDAPBindClient - Bind Success');
          ldapclient.unbind((err) => {});
          resolve(true);
        } else {
          console.log('In LDAPBindClient - Bind Failure');
          resolve(false);
        };
      });
    });
  }

  // define getRoles function - used to get (or add) user roles info from db
  function getRoles(email) {
    console.log('In getRoles - Begin');
    return new Promise((resolve, reject) => {
      if (!email) resolve(false);
      usersDb.find({ selector: { email: email }})
        .then((result) => {
          if (result.docs.length > 0) {
            user._id = result.docs[0]._id;
            user.email = result.docs[0].email;
            user.firstName = result.docs[0].firstname;
            user.lastName = result.docs[0].lastname;
            user.preferredName = result.docs[0].preferredname;
            user.roles = [...result.docs[0].roles];
            resolve(true);
          } else {
            usersDb.insert({
              email: email,
              firstname: user.firstName,
              lastname: user.lastName,
              preferredname: user.preferredName,
              roles: ["Creator"]
            })
              .then((result) => {
                user._id = result.id;
                console.log('New user successfully added -', email);
                resolve(true);
              })
              .catch((error) => {
                console.log('Could not add new user -', email);
                resolve(false);
              })
          }
        })
        .catch((error) => {
          console.log('Error when getting existing or adding new user during login', error);
          resolve(false);
        });
    });
  }

}

// get all users function
exports.getUsers = (req, res, next) => {
  console.log('In route - getUsers', '(' + req.userData.email + ')');
  usersDb.list({'include_docs': true})
    .then((fetchedUsers) => {
      users = [];
      row = 0;
      fetchedUsers.rows.forEach((fetchedUser) => {
        if (fetchedUser.doc._id.indexOf('_design') != 0) {
          users[row] = {
            _id: fetchedUser.doc._id,
            email: fetchedUser.doc.email,
            firstName: fetchedUser.doc.firstname,
            lastName: fetchedUser.doc.lastname,
            preferredName: fetchedUser.doc.preferredname,
            roles: fetchedUser.doc.roles
          }
          if (typeof(users[row].preferredName) === 'object')
            users[row].preferredName = users[row].preferredName[0];
          row = row + 1;
        };
      });
      console.log('Get users successful', '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Get users successful.',
        users: users
      });
    })
    .catch((error) => {
      console.log('Get users failed', '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Get users failed.',
        error: error
      });
    });
}

// get single user function
exports.getUser = (req, res, next) => {
  let userId = req.params.id;
  console.log('In route - getUser', '(' + req.userData.email + ')');
  usersDb.get(userId)
    .then((fetchedUser) => {
      console.log('Get user successful for', userId, '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Get user successful.',
        user: {
          _id: fetchedUser._id,
          email: fetchedUser.email,
          firstName: fetchedUser.firstname,
          lastName: fetchedUser.lastname,
          preferredName: fetchedUser.preferredname,
          roles: fetchedUser.roles
        }
      });
    })
    .catch((error) => {
      console.log('Get user failed for', userId, '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Get user failed.',
        error: error
      });
    });
}

// add user function
exports.addUser = (req, res, next) => {
  console.log('In route - addUser', '(' + req.userData.email + ')');
  if (req.userData.roles.indexOf('Admin') < 0) {
    console.log('Not authorized', '(' + req.userData.email + ')');
    return res.status(403).json({
      message: 'Not authorized to add a user.'
    });
  }
  let user = {
    email: req.body.email,
    firstname: req.body.firstName,
    lastname: req.body.lastName,
    preferredname: req.body.preferredName,
    roles: req.body.roles
  }
  usersDb.insert(user)
    .then((addedUser) => {
      console.log('Add user successful for', addedUser.id, '(' + req.userData.email + ')');
      res.status(201).json({
        message: 'Add user successful.',
        user: {
          _id: addedUser.id,
          email: user.email,
          firstName: user.firstname,
          lastName: user.lastname,
          preferredName: user.preferredname,
          roles: user.roles
        }
      });
    })
    .catch((error) => {
      console.log('Add user failed', '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Add user failed.',
        error: error
      });
    });
}

// update user function
exports.updateUser = (req, res, next) => {
  console.log('In route - updateUser', '(' + req.userData.email + ')');
  if ((req.body.email !== req.userData.email) && (req.userData.roles.indexOf('Admin') < 0)) {
    console.log('Not authorized', '(' + req.userData.email + ')');
    return res.status(403).json({
      message: 'Not authorized to update this user.'
    });
  }
  let user = {
    _id: req.params.id,
    _rev: '',
    email: req.body.email,
    firstname: req.body.firstName,
    lastname: req.body.lastName,
    preferredname: req.body.preferredName,
    roles: req.body.roles
  }
  usersDb.get(user._id)
    .then((fetchedUser) => {
      user._rev = fetchedUser._rev;
      return usersDb.insert(user);
    })
    .then((updatedUser) => {
      console.log('Update user successful for', user._id, '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Update user successful.',
        user: {
          _id: updatedUser.id,
          email: user.email,
          firstName: user.firstname,
          lastName: user.lastname,
          preferredName: user.preferredname,
          roles: user.roles
        }
      });
    })
    .catch((error) => {
      console.log('Update user failed for', user._id, '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Update user failed.',
        error: error
      });
    })
}

// delete user function
exports.deleteUser = (req, res, next) => {
  console.log('In route - deleteUser', '(' + req.userData.email + ')');
  if (req.userData.roles.indexOf('Admin') < 0) {
    console.log('Not authorized', '(' + req.userData.email + ')');
    return res.status(403).json({
      message: 'Not authorized to delete this user.'
    });
  }
  let userId = req.params.id;
  usersDb.get(userId)
    .then((fetchedUser) => {
      let latestRev = fetchedUser._rev;
      return usersDb.destroy(userId, latestRev);
    })
    .then((deletedUser) => {
      console.log('Delete user successful for', userId, '(' + req.userData.email + ')');
      res.status(200).json({
        message: 'Delete user successful.',
        user: {
          _id: deletedUser.id
        }
      });
    })
    .catch((error) => {
      console.log('Delete user failed for', userId, '(' + req.userData.email + ')');
      res.status(500).json({
        message: 'Delete user failed.',
        error: error
      });
    })
}
