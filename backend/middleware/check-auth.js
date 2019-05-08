const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = {
      // email: decodedToken.email,
      // firstName: decodedToken.firstName,
      // lastName: decodedToken.lastName,
      // preferredName: decodedToken.preferredName,
      // roles: decodedToken.roles,
      // _id: decodedToken._id
    };
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Not authenticated.'
    });
  }
};
