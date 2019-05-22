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
