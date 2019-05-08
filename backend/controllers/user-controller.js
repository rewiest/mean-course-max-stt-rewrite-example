const jwt = require('jsonwebtoken');
const ldap = require('ldapjs');
const BLUE_PAGE_LDAP_URL = 'ldaps://bluepages.ibm.com:636';
const BLUE_PAGE_LDAP_ORG = 'o=ibm.com';

// initialize Cloudant
const Cloudant = require('@cloudant/cloudant');
// const cloudant = new Cloudant({ url: process.env.DB_URL, plugins: 'promises' });

