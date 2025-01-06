import { ObjectId, OptionalId } from "mongodb";

export type Vehicle = {
	id: string;
	name: string;
	manufacturer: string;
	year: number;
	joke: Joke;
	parts: Part[];
};

export type VehicleModel = OptionalId<{
	name: string;
	manufacturer: string;
	year: number;
	joke: Joke;
	parts: ObjectId[];
}>;

export type Part = {
	id: string;
	name: string;
	price: number;
	vehicleId: string;
};

export type PartModel = OptionalId<{
	name: string;
	price: number;
	vehicleId: ObjectId;
}>;

export type Joke = {
	id: number;
	type: string;
	setup: string;
	punchline: string;
};
