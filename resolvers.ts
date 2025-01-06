import { Collection, ObjectId } from "mongodb";
import { PartModel, VehicleModel, Joke } from "./types.ts";
import { GraphQLError } from "graphql";

type Context = {
	VehicleCollection: Collection<VehicleModel>;
	PartCollection: Collection<PartModel>;
};

type IdSearchArgs = {
	id: string;
};

type QueryPartsByVehicleArgs = {
	vehicleId: string;
};

type QueryManufacturerSearchArgs = {
	manufacturer: string;
};

type QueryTimeRangeArgs = {
	startYear: number;
	endYear: number;
};

type MutationAddVehicleArgs = {
	name: string;
	manufacturer: string;
	year: number;
};

type MutationAddPartArgs = {
	name: string;
	price: number;
	vehicleId: string;
};

type MutationUpdateVehicleArgs = {
	id: string;
	name: string;
	manufacturer: string;
	year: number;
};

async function fetchRandomJoke(): Promise<Joke> {
	const url = "https://official-joke-api.appspot.com/random_joke";
	try {
		const response: Response = await fetch(url);
		if (!response) {
			throw new Error(`Error: No response from random joke API.`);
		}
		const joke: Joke = await response.json();
		return joke;
	} catch (e) {
		console.error("Failde to fetch random joke from API");
		throw e;
	}
}

export const resolvers = {
	Vehicle: {
		id: (parent: VehicleModel) => {
			return parent._id!.toString();
		},
		parts: async (parent: VehicleModel, _: unknown, ctx: Context): Promise<PartModel[]> => {
			const partIds = parent.parts;
			return await ctx.PartCollection.find({ _id: { $in: partIds } }).toArray();
		},
	},
	Part: {
		id: (parent: PartModel) => {
			return parent._id!.toString();
		},
		vehicleId: async (parent: PartModel, _: unknown, ctx: Context): Promise<VehicleModel> => {
			const vehicle: VehicleModel | null = await ctx.VehicleCollection.findOne({ _id: new ObjectId(parent.vehicleId) });
			if (!vehicle) throw new GraphQLError("Error finding vehicle linked to part in DB");
			return vehicle;
		},
	},
	Query: {
		vehicles: async (_: unknown, _args: unknown, ctx: Context): Promise<VehicleModel[]> => {
			return await ctx.VehicleCollection.find().toArray();
		},
		vehicle: async (_: unknown, args: IdSearchArgs, ctx: Context): Promise<VehicleModel | null> => {
			const id = new ObjectId(args.id);
			const vehicle = await ctx.VehicleCollection.findOne({ _id: id });
			return vehicle;
		},
		parts: async (_: unknown, _args: unknown, ctx: Context): Promise<PartModel[]> => {
			return await ctx.PartCollection.find().toArray();
		},
		vehiclesByManufacturer: async (
			_: unknown,
			args: QueryManufacturerSearchArgs,
			ctx: Context
		): Promise<VehicleModel[]> => {
			return await ctx.VehicleCollection.find({ manufacturer: args.manufacturer }).toArray();
		},
		partsByVehicle: async (_: unknown, args: QueryPartsByVehicleArgs, ctx: Context): Promise<PartModel[]> => {
			const vehicle: VehicleModel | null = await ctx.VehicleCollection.findOne({ _id: new ObjectId(args.vehicleId) });
			if (!vehicle) throw new GraphQLError("Vehicle not found on 'partsByVehicle' Query.");
			const parts: PartModel[] = await ctx.PartCollection.find({ _id: { $in: vehicle.parts } }).toArray();
			return parts;
		},
		vehiclesByYearRange: async (_: unknown, args: QueryTimeRangeArgs, ctx: Context): Promise<VehicleModel[]> => {
			const vehicles: VehicleModel[] = await ctx.VehicleCollection.find().toArray();
			const response: VehicleModel[] = vehicles.filter(
				(v: VehicleModel) => v.year >= args.startYear && v.year <= args.endYear
			);
			return response;
		},
	},
	Mutation: {
		addVehicle: async (_parent: unknown, args: MutationAddVehicleArgs, ctx: Context): Promise<VehicleModel> => {
			const { name, manufacturer, year } = args;
			const joke = await fetchRandomJoke();
			const { insertedId } = await ctx.VehicleCollection.insertOne({
				name,
				manufacturer,
				year,
				joke,
				parts: [],
			});
			return {
				_id: insertedId,
				name,
				manufacturer,
				year,
				joke,
				parts: [],
			};
		},
		addPart: async (_parent: unknown, args: MutationAddPartArgs, ctx: Context): Promise<PartModel> => {
			const { name, price, vehicleId } = args;
			const vehicle: VehicleModel | null = await ctx.VehicleCollection.findOne({ _id: new ObjectId(vehicleId) });
			if (!vehicle) throw new GraphQLError(`No vehicle found with id:${vehicleId} in DB.`);
			const { insertedId } = await ctx.PartCollection.insertOne({ name, price, vehicleId });
			await ctx.VehicleCollection.findOneAndUpdate({ _id: new ObjectId(vehicleId) }, { $push: { parts: insertedId } });
			return {
				_id: insertedId,
				name,
				price,
				vehicleId: vehicle._id,
			};
		},
		updateVehicle: async (
			_parent: unknown,
			args: MutationUpdateVehicleArgs,
			ctx: Context
		): Promise<VehicleModel | null> => {
			const { id, name, manufacturer, year } = args;
			const exists: VehicleModel | null = await ctx.VehicleCollection.findOne({ _id: new ObjectId(id) });
			if (!exists) throw new GraphQLError(`No vehicle found with id:${id} in DB.`);
			const joke: Joke = exists.joke;
			const parts: ObjectId[] = exists.parts;
			const update = {
				name,
				manufacturer,
				year,
				joke,
				parts,
			};
			const { modifiedCount } = await ctx.VehicleCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
			if (modifiedCount === 0) throw new GraphQLError("Error updating vehicle");
			return {
				_id: id,
				name,
				manufacturer,
				year,
				joke: exists.joke,
				parts: exists.parts,
			};
		},
		deletePart: async (_parent: unknown, args: IdSearchArgs, ctx: Context): Promise<PartModel | null> => {
			const exists: PartModel | null = await ctx.PartCollection.findOne({ _id: new ObjectId(args.id) });
			if (!exists) throw new GraphQLError(`No vehicle found with id:${args.id} in DB.`);
			const { deletedCount } = await ctx.PartCollection.deleteOne({ _id: new ObjectId(args.id) });
			if (deletedCount === 0) throw new GraphQLError("Error deleting part");
			//Hook
			await ctx.VehicleCollection.updateMany(
				{ parts: new ObjectId(args.id) },
				{ $pull: { parts: new ObjectId(args.id) } }
			);

			return exists;
		},
	},
};
