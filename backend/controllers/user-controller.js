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
  };

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
  };

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
  };

};

