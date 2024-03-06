/**
 * The cinema scraper of the application.
 *
 * @author Samuel von Zweigbergk <sv222rr@student.lnu.se>
 * @version 1.1.1
 */

import { LinkCrawler } from './link-crawler.js'
import { UniversalScraper } from './universal-scraper.js'

/**
 *
 */
export class CinemaScraper {
  /**
   * Represents a CinemaScraper object.
   *
   * @param {string} baseUrl - The base URL for the cinema scraper.
   */
  constructor (baseUrl) {
    this.baseUrl = baseUrl
  }

  /**
   * Displays cinema information by crawling through links and retrieving cinema info.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the cinema information is displayed.
   */
  async displayCinemaInfo () {
    try {
      const linkCrawler = new LinkCrawler(this.baseUrl)

      let links = await linkCrawler.crawl(this.baseUrl)

      links = links.filter(link => link.includes('cinema'))

      const calendarInfo = await this.#getCinemaInfo(links)

      return calendarInfo
    } catch (error) {
      console.error(error.message)
    }
  }

  /**
   * Retrieves cinema information from a given link.
   *
   * @async
   * @private
   * @param {string} link - The link to scrape the cinema information from.
   * @returns {Promise<Array<{day: string, info: string}>>} - A promise that resolves to an array of objects containing the day and corresponding information.
   */
  async #getCinemaInfo (link) {
    const daysSelector = 'select[name="day"] > option[value^="0"]'
    const moviesSelector = 'select[name="movie"] > option[value^="0"]'

    const universalScraper = new UniversalScraper()

    const daysHtml = await universalScraper.extractHtml(link, daysSelector)
    const moviesHtml = await universalScraper.extractHtml(link, moviesSelector)

    const daysAndMovies = this.#getOptionInfo(daysHtml, moviesHtml)
    const movieTimes = []

    for (const day of Object.keys(daysAndMovies.days)) {
      for (const movie of Object.keys(daysAndMovies.movies)) {
        const postLink = `${link}check?day=${daysAndMovies.days[day].id}&movie=${daysAndMovies.movies[movie].id}`
        const times = await this.#postRequest(postLink)
        for (const time of times) {
          time.name = daysAndMovies.movies[movie].name
        }
        movieTimes.push(times)
      }
    }
    return movieTimes
  }

  /**
   * Retrieves days and movies information from the option elements.
   *
   * @private
   * @param {HTMLElement[]} daysHtml - The HTML elements representing the days.
   * @param {HTMLElement[]} moviesHtml - The HTML elements representing the movies.
   * @returns {object} - An object containing the days and movies.
   */
  #getOptionInfo (daysHtml, moviesHtml) {
    const days = {}
    const movies = {}

    daysHtml.forEach(element => {
      const optionValue = element.getAttribute('value')
      const optionText = element.textContent
      days[optionText] = { id: optionValue }
    })

    moviesHtml.forEach(element => {
      const optionValue = element.getAttribute('value')
      const optionText = element.textContent
      movies[optionText] = { id: optionValue, name: optionText }
    })

    return { days, movies }
  }

  /**
   * Sends a POST request to the specified link and returns the response data.
   *
   * @async
   * @private
   * @param {string} link - The link to send the POST request to.
   * @returns {Promise<any>} - A promise that resolves to the response data.
   */
  async #postRequest (link) {
    const response = await fetch(link)
    const data = await response.json()
    return data
  }
}
