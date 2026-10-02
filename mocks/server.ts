import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** MSW server instance for unit/integration tests (Node environment). */
export const server = setupServer(...handlers)
