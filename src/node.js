'use strict';

const {
  nodeDefinitions,
  fromGlobalId,
} = require('graphql-relay');

const { getObjectById } = require('./data');

const { nodeInterface, nodeField } = nodeDefinitions(
  (globalId) => {
    const { type, id } = fromGlobalId(globalId);
    // console.log(type, id);
    return getObjectById(type.toLowerCase(), id);
  },
  (object) => {
    const { videoType } = require('../');
    // console.log(videoType);
    // if there's a title return videoType:
    if (object.title) {
      return videoType;
    }

    return null;
  }
);

exports.nodeInterface = nodeInterface;
exports.nodeField = nodeField;