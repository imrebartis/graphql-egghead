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
const nodeInterface = require('./src/node');


const PORT = process.env.PORT || 3000;
const server = express();


// The goal for the interface is to be able
// to use it anytime we have shared fields between types,
// e.g. if we also have the instructorType below

// const instructorType = newGraphQLObjectType({
//   fields: {
//     id: {
//       type: GraphQLID,
//       description: 'The id of the video',
//     },
//   },
//   interfaces: [nodeInterface]
// });

const videoType = new GraphQLObjectType({
  name: 'Video',
  description: 'A video on Egghead.io',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the video.',
    },
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

const queryType = new GraphQLObjectType({
  name: 'QueryType',
  description: 'The root query type.',
  fields: {
    videos: {
      type: new GraphQLList(videoType),
      resolve: getVideos
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

// Creating a video in GraphiQL:
// mutation M {
//   createVideo(video: {title: "Foo", duration: 300, released: false}) {
//     id
//     title
//   }
// }
// =>
// {
//   "data": {
//     "createVideo": {
//       "id": "Rm9v",
//       "title": "Foo"
//     }
//   }
// }