// api/VerifyToken/index.js

const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
  context.log("VerifyToken function processed a request.");

  // 1) Extract token from route
  const token = context.bindingData.token; // from route /VerifyToken/{token}
  if (!token) {
    context.res = {
      status: 400,
      body: "Token is required in URL path."
    };
    return;
  }

  try {
    // 2) Connect to Cosmos DB
    const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    const database = cosmosClient.database("<YOUR_DATABASE_NAME>");
    const container = database.container("<YOUR_CONTAINER_NAME>");

    // 3) Fetch the item by its ID (which is our token)
    const { resource: item } = await container.item(token).read();

    if (!item) {
      context.res = {
        status: 404,
        body: "Invalid or expired token."
      };
      return;
    }

    // 4) Return the data to the caller
    //     The front-end can then display slUuid and slAvatarName as read-only fields
    context.res = {
      status: 200,
      body: {
        slUuid: item.slUuid,
        slAvatarName: item.slAvatarName
      }
    };
  } catch (err) {
    if (err.code === 404) {
      // If the item doesn't exist in Cosmos
      context.res = {
        status: 404,
        body: "Invalid token (not found)."
      };
    } else {
      context.log.error("Error verifying token: ", err);
      context.res = {
        status: 500,
        body: "Internal Server Error"
      };
    }
  }
};
