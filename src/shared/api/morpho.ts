import { GraphQLClient } from "graphql-request";
import { MORPHO_API_URL } from "@/shared/config";

export const morphoClient = new GraphQLClient(MORPHO_API_URL);
