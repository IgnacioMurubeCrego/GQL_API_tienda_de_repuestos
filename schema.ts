export const schema = `#graphql
  type Vehicle {
    id: ID!
    name: String!
    manufacturer: String!
    year: Int!
    joke: Joke!
    parts: [Part!]!
  }

  type Part {
    id: ID!
	  name: String!
	  price: Int!
    vehicleId: Vehicle!
  }

  type Joke {
    id: Int!
    type: String!
    setup: String!
    punchline: String!
  }

  type Query {
    vehicles: [Vehicle!]!
    vehicle(id: ID!): Vehicle
    parts: [Part!]!
    vehiclesByManufacturer(manufacturer: String!): [Vehicle!]!
    partsByVehicle(vehicleId: ID!): [Part!]!
    vehiclesByYearRange(startYear: Int!, endYear: Int!): [Vehicle!]!
  }

  type Mutation {
    addVehicle(name: String!, manufacturer: String!, year: Int!): Vehicle!
    addPart(name: String!, price: Int!, vehicleId: ID!): Part!
    updateVehicle(id: ID!, name: String!, manufacturer: String!, year: Int!): Vehicle
    deletePart(id: ID!): Part
  }
`;
