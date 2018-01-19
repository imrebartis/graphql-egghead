// In order to support mutations in Relay, there is 
// a requirement that the GraphQL Server exposes mutation
//  fields in a standardized way. This standard includes 
//  a way for mutations to accept and emit an identifier string,
//   allowing Relay to track mutations and responses. Here
//   we're using a helper available to us through graphql-relay
//   to create Mutation fields that accept clientMutationId’s.



'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLBoolean,
} = require('graphql');
const { getVideoById, getVideos, createVideo } = require('./src/data');
const {
  globalIdField,
  connectionDefinitions,
  connectionFromPromisedArray,
  connectionArgs,
  mutationWithClientMutationId
} = require('graphql-relay');
const { nodeInterface, nodeField } = require('./src/node');



const PORT = process.env.PORT || 3000;
const server = express();

const videoType = new GraphQLObjectType({
  name: 'Video',
  description: 'A video on Egghead.io',
  fields: {
    id: globalIdField(),
    title: {
      type: GraphQLString,
      description: 'The title of the video.',
    },
    duration: {
      type: GraphQLInt,
      description: 'The duration of the video (in seconds).',
    },
    watched: {
      type: GraphQLBoolean,
      description: 'Whether or not the viewer has watched the video.',
    },
  },
  // nodeInterface is the first element of the interfaces array
  interfaces: [nodeInterface]
});

exports.videoType = videoType;

const { connectionType: VideoConnection } = connectionDefinitions({
  nodeType: videoType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'A count of the total number of objects in this connection.',
      resolve: (conn) => {
        return conn.edges.length;
      },
    },
  }),
});

const queryType = new GraphQLObjectType({
  name: 'QueryType',
  description: 'The root query type.',
  fields: {
    node: nodeField,
    videos: {
      type: VideoConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(
        getVideos(),
        args
      ),
    },
    video: {
      type: videoType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
          description: 'The id of the video.',
        },
      },
      // the first argument we don't care about:
      resolve: (_, args) => {
        return getVideoById(args.id);
      },
    },
  },
});

const videoMutation = mutationWithClientMutationId({
  name: 'AddVideo',
  inputFields: {
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The title of the video.',
    },
    duration: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'The duration of the video (in seconds).',
    },
    released: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not the video is released.',
    },
  },
  outputFields: {
    video: {
      type: videoType,
    },
  },
  mutateAndGetPayload: (args) => new Promise((resolve, reject) => {
    Promise.resolve(createVideo(args))
      .then((video) => resolve({ video }))
      .catch(reject);
  }),
});

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'The root Mutation type.',
  fields: {
    createVideo: videoMutation
  },
});

const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType
});

server.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// terminal: node index.js =>
// browser: http://localhost:3000/graphql
// (GraphiQL, an in-browser tool for writing, validating, and
// # testing GraphQL queries)

// INPUT:
// mutation AddVideoQuery($input: AddVideoInput!) {
//   createVideo(input: $input) {
//     video {
//       title
//     }
//   }
// }
// QUERY VARIABLES (ADD THEM BY CLICKING ON THE QUERY
// VARIABLES BAR AT THE BOTTOM):
// {
//   "input": {
//     "title": "Video Title",
//     "duration": 300,
//     "released": false,
//     "clientMutationId": "abcd"
//   }  
// }
// OUTPUT:
// {
//   "data": {
//     "createVideo": {
//       "video": {
//         "title": "Video Title"
//       }
//     }
//   }
// }

// INPUT:
// query AllVideosQuery {
//   videos {
//     edges {
//       node {
//         title 
//       }
//     }
//   }
// }
// OUTPUT:
// {
//   "data": {
//     "videos": {
//       "edges": [
//         {
//           "node": {
//             "title": "Create a GraphQL Schema"
//           }
//         },
//         {
//           "node": {
//             "title": "Ember.js CLI"
//           }
//         },
//         {
//           "node": {
//             "title": "Video Title"
//           }
//         },
//       ]
//     }
//   }
// }