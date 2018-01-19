// In order to properly traverse through collections,
// Relay-compliant servers require a mechanism to page through
// collections available in a GraphQL Schema. Here we're
// creating a Connection type from an existing GraphQL List Type
// and access edge information from each collection.

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
  connectionArgs
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

const videoInputType = new GraphQLInputObjectType({
  name: 'VideoInput',
  fields: {
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
  }
});

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'The root Mutation type.',
  fields: {
    createVideo: {
      type: videoType,
      args: {
        video: {
          type: new GraphQLNonNull(videoInputType),
        },
      },
      resolve: (_, args) => {
        return createVideo(args.video);
      },
    },
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
// {
//   videos {
//     edges {
//       node {
//         id,
//         title,
//         duration
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
//             "id": "VmlkZW86YQ==",
//             "title": "Create a GraphQL Schema",
//             "duration": 120
//           }
//         },
//         {
//           "node": {
//             "id": "VmlkZW86Yg==",
//             "title": "Ember.js CLI",
//             "duration": 240
//           }
//         }
//       ]
//     }
//   }
// }

// INPUT:
// {
//   videos {
//     totalCount
//   }
// }
// OUTPUT:
// {
//   "data": {
//     "videos": {
//       "totalCount": 2
//     }
//   }
// }

// INPUT:
// {
//   videos(first: 1) {
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
//         }
//       ]
//     }
//   }
// }

// INPUT:
// {
//   videos(last: 1) {
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
//             "title": "Ember.js CLI"
//           }
//         }
//       ]
//     }
//   }
// }