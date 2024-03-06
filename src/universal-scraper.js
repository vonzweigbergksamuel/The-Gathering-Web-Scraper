/**
 * The universal scraper of the application.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import { JSDOM } from 'jsdom'

/**
 * A class that extracts links from a given URL.
 */
export class UniversalScraper {
  /**
   * Extracts URLs from the given URL.
   *
   * @async
   * @param {string} url - The URL to extract Html Elements from.
   * @param {string} element - The Html Element to extract.
   * @param {string} cookie - The cookie to use for the request.
   * @returns {Promise<void>} - A promise that resolves once the Html Elements are extracted.
   */
  async extractHtml (url, element, cookie) {
    if (cookie) {
      const extractedHtml = await this.#getHtml(url, cookie)
      const dom = new JSDOM(extractedHtml)

      const htmlElementArray = Array.from(dom.window.document.querySelectorAll(element))

      return htmlElementArray
    } else {
      const extractedHtml = await this.#getHtml(url)
      const dom = new JSDOM(extractedHtml)

      const htmlElementArray = Array.from(dom.window.document.querySelectorAll(element))

      return htmlElementArray
    }
  }

  /**
   * Fetches the HTML content of a given URL.
   *
   * @async
   * @private
   * @param {string} url - The URL to fetch the HTML from.
   * @param {string} cookie - The cookie to use for the request.
   * @returns {Promise<string>} - A promise that resolves with the HTML content.
   * @throws {Error} - If there is an HTTP error while fetching the HTML.
   */
  async #getHtml (url, cookie) {
    if (cookie) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Cookie: cookie
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.text()
    } else {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.text()
    }
  }
}
