import authResolver from "./authResolver.js";
import feedResolver from "./feedResolver.js";

const resolvers = {
  ...authResolver,
  ...feedResolver,
};

export default resolvers;
