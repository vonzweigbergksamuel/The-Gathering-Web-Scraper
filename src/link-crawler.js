/**
 * The link crawler of the application.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import validator from 'validator'
import { UniversalScraper } from './universal-scraper.js'

/**
 * A class that extracts links from a given URL.
 */
export class LinkCrawler {
  /**
   * Represents a LinkCrawler object.
   * The constructor validates the URL and adds a trailing slash if needed.
   *
   * @class
   * @param {string} baseUrl - The base URL for crawling.
   * @throws {Error} Throws an error if the URL is not valid.
   */
  constructor (baseUrl) {
    this.baseUrl = baseUrl

    if (!validator.isURL(this.baseUrl)) {
      throw new Error('The URL is not valid.')
    }
    if (this.baseUrl.slice(-1) !== '/') {
      this.baseUrl = `${this.baseUrl}/`
    }
  }

  /**
   * Extracts URLs from a given webpage.
   *
   * @async
   * @private
   * @param {string} url - The URL of the webpage to extract URLs from.
   * @param {string} baseUrl - The base URL of the webpage.
   * @returns {Array<string>} - An array of extracted URLs.
   * @throws {Error} - If no 'a' elements exist on the webpage.
   */
  async #extractUrls (url, baseUrl) {
    const element = 'a'
    const universalScraper = new UniversalScraper()
    const htmlElements = await universalScraper.extractHtml(url, element)
    const linksArray = htmlElements.map(anchorElement => anchorElement.href)

    return this.#handleRelativeLinks(linksArray, baseUrl)
  }

  /**
   * Handles relative links by converting them to absolute links.
   *
   * @private
   * @param {Array<string>} links - The array of links to be handled.
   * @param {string} baseUrl - The base URL of the website being crawled.
   * @returns {Array<string>} - The array of updated links.
   */
  #handleRelativeLinks (links, baseUrl) {
    const updatedLinks = []
    links.forEach(link => {
      if (link.startsWith('/')) { // Its a relative link
        const fixedLink = link.slice(1)
        const urlObject = `${baseUrl}${fixedLink}`
        updatedLinks.push(urlObject)
      } else if (link.startsWith('./')) { // Its a relative link
        const fixedLink = link.slice(2)
        const urlObject = `${baseUrl}${fixedLink}`
        updatedLinks.push(urlObject)
      } else { // Its an absolute link
        updatedLinks.push(this.#normalizeLinks(link))
      }
    })
    return this.#sortLinks(updatedLinks)
  }

  /**
   * Normalize a given link by adding trailing slashes if needed.
   *
   * @private
   * @param {string} link - The link to be normalized.
   * @returns {string} - The normalized link.
   */
  #normalizeLinks (link) {
    const urlObject = new URL(link)
    const hostPath = urlObject.href
    if (hostPath.length > 0 && hostPath.slice(-1) !== '/') {
      return `${hostPath}/`
    }
    return hostPath
  }

  /**
   * Sorts the links, removes duplicates and crawls each link.
   *
   * @private
   * @param {Array<string>} updatedLinks - The array of updated links.
   * @returns {void}
   */
  #sortLinks (updatedLinks) {
    const sortedLinks = [...new Set((updatedLinks).sort())]

    return sortedLinks
  }

  /**
   * Crawls the web starting from a given link and extracts all visited URLs.
   *
   * @async
   * @param {string} link - The starting link to crawl from.
   * @param {Set<string>} visitedUrls - A set of visited URLs to keep track of visited links.
   * @param {string} baseUrl - The base URL used for relative URL extraction.
   * @returns {Promise<string[]>} - A promise that resolves with an array of visited URLs.
   * @throws {Error} - If the timeout is reached.
   */
  async crawl (link, visitedUrls = new Set(), baseUrl) {
    /**
     * A promise that rejects after a given time.
     * Used to set a timeout for the crawling.
     * Timeout variable - Source: https://phind.com/
     * Phind is an AI-powered search engine for developers.
     *
     * @param {number} ms - The number of milliseconds to wait before rejecting the promise.
     * @returns {Promise<void>}
     * @throws {Error} - If the timeout is reached.
     */
    const timeout = ms => new Promise((resolve, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))

    while (!visitedUrls.has(link)) {
      visitedUrls.add(link)

      try {
        baseUrl = link
        const extractedURLs = await Promise.race([
          this.#extractUrls(link, baseUrl),
          timeout(3000) // Timeout after 3 seconds
        ])

        for (const link of extractedURLs) {
          await this.crawl(link, visitedUrls, baseUrl)
        }
      } catch (error) {
        console.error(`Error crawling ${link}: ${error.message}`)
      }
    }
    return Array.from(visitedUrls)
  }
}
