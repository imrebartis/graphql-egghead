'use strict';

const { graphql, buildSchema } = require('graphql');

const schema = buildSchema(`

type Query {
    foo: String
  }

type Schema {
  query: Query
}
`);

const resolvers = {
    foo: () => 'barbar',
  };

const query = `
query myFirstQuery {
  foo
}
`;

graphql(schema, query, resolvers)
  .then((result) => console.log(result))
  .catch((error) => console.log(error));