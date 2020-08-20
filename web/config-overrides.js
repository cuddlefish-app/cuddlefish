// See https://medium.com/@ricardojgonzlez/how-to-add-relay-to-create-react-app-with-typescript-b6daacea21dd.

const { override, addBabelPlugins } = require("customize-cra");

module.exports = override(addBabelPlugins("babel-plugin-relay"));
