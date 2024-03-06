/**
 * The starting point of the application.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import { Application } from './application.js'

try {
  let baseUrl = process.argv[2]

  if (baseUrl.slice(-1) !== '/') {
    baseUrl = `${baseUrl}/`
  }

  const application = new Application(baseUrl)
  await application.run()
} catch (error) {
  console.error(error.message)
}
