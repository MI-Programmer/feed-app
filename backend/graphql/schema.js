import { buildSchema } from "graphql";

const shcema = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    imageUrl: String!
    content: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    email: String!
    name: String!
    password: String
    status: String!
    posts: [Post!]!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type PostsData {
    posts: [Post!]!
    totalPosts: Int!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  input PostInputData {
    title: String!
    image: String!
    content: String!
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
    user: User!
    posts(page: Int): PostsData!
    post(postId: ID!): Post!
  }

  type RootMutation {
    createUser(userInput: UserInputData!): User!
    updateStatus(status: String!): User!
    createPost(postInput: PostInputData!): Post!
    updatePost(postId: ID!, postInput: PostInputData!): Post!
    deletePost(postId: ID!): Boolean!
  }
    
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

export default shcema;
