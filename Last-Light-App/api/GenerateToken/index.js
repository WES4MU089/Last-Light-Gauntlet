// api/GenerateToken/index.js

const { CosmosClient } = require("@azure/cosmos");
const crypto = require("crypto"); // for token generation

module.exports = async function (context, req) {
  context.log("GenerateToken function processed a request.");

  // 1) Parse incoming data (SL script should send in request body)
  const { slUuid, slAvatarName } = req.body || {};
  if (!slUuid || !slAvatarName) {
    context.res = {
      status: 400,
      body: "Missing required fields: slUuid, slAvatarName."
    };
    return;
  }

  try {
    // 2) Create random token
    const token = crypto.randomBytes(16).toString("hex"); // 32-char hex

    // 3) Connect to Cosmos DB
    const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    const database = cosmosClient.database("<YOUR_DATABASE_NAME>");
    const container = database.container("<YOUR_CONTAINER_NAME>");

    // 4) Store the token + user data in Cosmos
    const item = {
      id: token,        // Using the token as the 'id'
      slUuid,
      slAvatarName,
      createdAt: new Date().toISOString()
    };

    await container.items.create(item);

    // 5) Return the token to SL
    context.res = {
      status: 200,
      body: { token }
    };
  } catch (err) {
    context.log.error("Error creating token: ", err);
    context.res = {
      status: 500,
      body: "Internal Server Error"
    };
  }
};
