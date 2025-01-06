import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { MongoClient } from "mongodb";
import { PartModel, VehicleModel } from "./types.ts";
import { schema } from "./schema.ts";
import { resolvers } from "./resolvers.ts";
import { GraphQLError } from "graphql";

const MONGO_URL = Deno.env.get("MONGO_URL");

console.log("MONGO_URL:", Deno.env.get("MONGO_URL"));

if (!MONGO_URL) {
	throw new GraphQLError("Please provide MONGO_URL for database connection.");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("Connected to MongoDB (￣︶￣*))");

const mongoDB = mongoClient.db("VehicleShop");
const VehicleCollection = mongoDB.collection<VehicleModel>("vehicles");
const PartCollection = mongoDB.collection<PartModel>("parts");

const server = new ApolloServer({
	typeDefs: schema,
	resolvers,
});

const standAloneServer = await startStandaloneServer(server, {
	context: async () => ({ VehicleCollection, PartCollection }),
});

console.info(`Server ready at ${standAloneServer.url}`);
