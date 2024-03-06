/**
 * The bar scraper of the application.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import { LinkCrawler } from './link-crawler.js'
import { UniversalScraper } from './universal-scraper.js'

/**
 *
 */
export class BarScraper {
  /**
   * Represents a BarScraper object.
   *
   * @class
   * @param {string} baseUrl - The base URL for the scraper.
   */
  constructor (baseUrl) {
    this.baseUrl = baseUrl
  }

  /**
   * Displays bar information.
   *
   * @async
   * @returns {Promise<object>} The bar information.
   */
  async displayBarInfo () {
    try {
      const linkCrawler = new LinkCrawler(this.baseUrl)

      let links = await linkCrawler.crawl(this.baseUrl)

      links = links.filter(link => link.includes('dinner'))

      const link = links.toString()

      const barInfo = await this.#getBarInfo(link)

      return barInfo
    } catch (error) {
      console.error(error.message)
    }
  }

  /**
   * Retrieves bar information from a given link.
   *
   * @async
   * @private
   * @param {string} link - The link to retrieve bar information from.
   * @returns {Promise<object>} - A promise that resolves to an object containing available times for each day.
   */
  async #getBarInfo (link) {
    const postLoginData = await this.#postLogin(link)

    const cookie = postLoginData.cookie
    const barLink = postLoginData.url

    let inputSelector = ''
    const availableTimes = {}

    const days = { Friday: 'fri', Saturday: 'sat', Sunday: 'sun' }

    // Loop through the days object and retrieve the available times for each day.
    for (const day of Object.keys(days)) {
      inputSelector = `input[value^="${days[day]}"] + span`

      const universalScraper = new UniversalScraper()
      const inputElements = await universalScraper.extractHtml(barLink, inputSelector, cookie)
      const inputElementsHtml = inputElements.map(htmlElement => {
        const textContent = htmlElement.textContent
        const numbersOnly = textContent.match(/\d+/g)

        const [start, end] = numbersOnly

        // Create an object with start and end keys to display the available times.
        return {
          start,
          end
        }
      })

      availableTimes[day] = inputElementsHtml
    }

    return availableTimes
  }

  /**
   * Performs a login request to the specified link and returns the response.
   *
   * @async
   * @private
   * @param {string} link - The base URL of the website.
   * @returns {Promise<object>} - The response object containing the URL and cookie.
   * @throws {Error} - If there is an HTTP error while fetching the HTML.
   */
  async #postLogin (link) {
    const responsePost = await fetch(`${link}login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username: 'zeke',
        password: 'coys',
        submit: 'login'
      }),
      redirect: 'manual'
    })

    let location = ''
    let cookie = ''

    if (responsePost.status === 302) {
      location = responsePost.headers.get('Location')
      cookie = responsePost.headers.get('set-cookie')
    }

    if (!responsePost.ok && responsePost.status !== 302) {
      throw new Error(`Error: ${responsePost.status}`)
    }

    const responseGet = { url: `${link}${location}`, cookie }

    return responseGet
  }
}
