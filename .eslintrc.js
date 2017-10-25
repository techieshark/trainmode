module.exports = {
    "extends": "airbnb",
    "installedESLint": true,
    "env": {
        "browser": true,
        "webextensions": true, // defines 'chrome' global and others
    },
    "plugins": [
    ],
    "rules": {
        "no-console": 0,
        // https://blog.javascripting.com/2015/09/07/fine-tuning-airbnbs-eslint-config/
        "max-len": [1, 120, 2, {ignoreComments: true}],
        "no-else-return": 0,
        "no-param-reassign": 0,
        "no-unused-vars": 0, // development mode
    },
    "globals": {
    }
};