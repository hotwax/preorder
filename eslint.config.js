import { dbConfig } from "../../eslint.config.js"

// The local-database rules (`dbConfig` in the root eslint.config.js). The build runs this lint first.
export default [
  ...dbConfig
]
